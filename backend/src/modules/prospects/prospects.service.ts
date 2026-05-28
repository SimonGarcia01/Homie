import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository, In } from 'typeorm';

import { ApplicantRole, PropertyCommercialStatus, PropertyPublicationStatus, RentalApplicationStatus } from '../../common/enums';
import { Contact } from '../contacts/entities/contact.entity';
import { ApplicationApplicant } from '../rental-applications/entities/application-applicant.entity';
import { RentalApplication } from '../rental-applications/entities/rental-application.entity';
import { LeadsService } from '../leads/leads.service';
import { Property } from '../properties/entities/property.entity';
import { PropertiesService } from '../properties/properties.service';
import { UsersService } from '../users/users.service';

import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { ProspectLoginDto, ProspectRegisterDto } from './dto/prospect-register.dto';
import { ProspectAccount } from './entities/prospect-account.entity';
import { ProspectFavorite } from './entities/prospect-favorite.entity';
import { ProspectInquiry, ProspectInquiryStatus } from './entities/prospect-inquiry.entity';

export type ProspectProfile = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
};

@Injectable()
export class ProspectsService {
    constructor(
        @InjectRepository(ProspectAccount)
        private readonly accountsRepo: Repository<ProspectAccount>,
        @InjectRepository(ProspectFavorite)
        private readonly favoritesRepo: Repository<ProspectFavorite>,
        @InjectRepository(ProspectInquiry)
        private readonly inquiriesRepo: Repository<ProspectInquiry>,
        @InjectRepository(Property)
        private readonly propertiesRepo: Repository<Property>,
        @InjectRepository(Contact)
        private readonly contactsRepo: Repository<Contact>,
        @InjectRepository(ApplicationApplicant)
        private readonly applicantsRepo: Repository<ApplicationApplicant>,
        @InjectRepository(RentalApplication)
        private readonly applicationsRepo: Repository<RentalApplication>,
        private readonly usersService: UsersService,
        private readonly leadsService: LeadsService,
        private readonly propertiesService: PropertiesService,
    ) {}

    async register(dto: ProspectRegisterDto, signToken: (payload: Record<string, unknown>) => string) {
        const email = dto.email.trim().toLowerCase();
        const existing = await this.accountsRepo
            .createQueryBuilder('account')
            .where('LOWER(account.email) = LOWER(:email)', { email })
            .getOne();

        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const staffExists = await this.usersService.findByEmailForAuth(email);
        if (staffExists) {
            throw new ConflictException('Email already registered as a broker account');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const account = await this.accountsRepo.save(
            this.accountsRepo.create({
                email,
                passwordHash,
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                phone: dto.phone?.trim(),
                isActive: true,
            }),
        );

        return this.buildAuthResponse(account, signToken);
    }

    async login(dto: ProspectLoginDto, signToken: (payload: Record<string, unknown>) => string) {
        const account = await this.accountsRepo
            .createQueryBuilder('account')
            .addSelect('account.passwordHash')
            .where('LOWER(account.email) = LOWER(:email)', { email: dto.email.trim() })
            .getOne();

        if (!account || !account.isActive) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const valid = await bcrypt.compare(dto.password, account.passwordHash);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        await this.accountsRepo.update(account.id, { lastLoginAt: new Date() });

        return this.buildAuthResponse(account, signToken);
    }

    async getProfile(prospectId: string): Promise<ProspectProfile> {
        const account = await this.accountsRepo.findOne({ where: { id: prospectId } });
        if (!account) throw new NotFoundException('Account not found');
        return this.toProfile(account);
    }

    async listFavorites(prospectId: string) {
        const rows = await this.favoritesRepo.find({
            where: { prospectId },
            relations: { property: { location: true, rentalDetail: true, feature: true, images: true, organization: true } },
            order: { createdAt: 'DESC' },
        });

        return rows
            .filter((row) => row.property && this.isPropertyPublic(row.property))
            .map((row) => this.propertiesService.mapPublicProperty(row.property!));
    }

    async addFavorite(prospectId: string, propertyId: string) {
        const property = await this.requirePublicProperty(propertyId);

        const existing = await this.favoritesRepo.findOne({ where: { prospectId, propertyId } });
        if (existing) {
            return this.propertiesService.mapPublicProperty(property);
        }

        await this.favoritesRepo.save(
            this.favoritesRepo.create({ prospectId, propertyId }),
        );

        return this.propertiesService.mapPublicProperty(property);
    }

    async removeFavorite(prospectId: string, propertyId: string) {
        const favorite = await this.favoritesRepo.findOne({ where: { prospectId, propertyId } });
        if (!favorite) throw new NotFoundException('Favorite not found');
        await this.favoritesRepo.remove(favorite);
        return { id: propertyId };
    }

    async listApplications(prospectId: string) {
        const account = await this.accountsRepo.findOne({ where: { id: prospectId } });
        if (!account) throw new NotFoundException('Account not found');

        const contacts = await this.contactsRepo
            .createQueryBuilder('contact')
            .where('LOWER(contact.email) = LOWER(:email)', { email: account.email })
            .getMany();

        if (contacts.length === 0) return [];

        const contactIds = contacts.map((contact) => contact.id);
        const applicants = await this.applicantsRepo.find({
            where: {
                contactId: In(contactIds),
                applicantRole: ApplicantRole.PRIMARY_TENANT,
            },
            relations: {
                rentalApplication: {
                    property: { location: true, organization: true },
                },
            },
            order: { createdAt: 'DESC' },
        });

        const seen = new Set<string>();
        return applicants
            .filter((row) => {
                if (!row.rentalApplication || seen.has(row.rentalApplication.id)) return false;
                seen.add(row.rentalApplication.id);
                return true;
            })
            .map((row) => {
                const app = row.rentalApplication!;
                return {
                    id: app.id,
                    status: app.status,
                    statusLabel: this.applicationStatusLabel(app.status),
                    createdAt: app.createdAt.toISOString(),
                    property: app.property
                        ? {
                              id: app.property.id,
                              title: app.property.title,
                              city: app.property.location?.city,
                          }
                        : undefined,
                    organization: app.property?.organization
                        ? {
                              id: app.property.organization.id,
                              name: app.property.organization.name,
                              slug: app.property.organization.slug,
                          }
                        : undefined,
                };
            });
    }

    private applicationStatusLabel(status: RentalApplicationStatus) {
        const labels: Record<RentalApplicationStatus, string> = {
            [RentalApplicationStatus.STARTED]: 'Iniciada',
            [RentalApplicationStatus.PENDING_DOCUMENTS]: 'Documentos pendientes',
            [RentalApplicationStatus.UNDER_REVIEW]: 'En revisión',
            [RentalApplicationStatus.APPROVED]: 'Aprobada',
            [RentalApplicationStatus.REJECTED]: 'Rechazada',
            [RentalApplicationStatus.WITHDRAWN]: 'Retirada',
        };
        return labels[status] ?? status;
    }

    async listInquiries(prospectId: string) {
        const rows = await this.inquiriesRepo.find({
            where: { prospectId },
            relations: { property: { location: true, rentalDetail: true, organization: true }, organization: true },
            order: { createdAt: 'DESC' },
        });

        return rows.map((row) => ({
            id: row.id,
            type: row.type,
            status: row.status,
            statusLabel: this.statusLabel(row.status),
            message: row.message,
            preferredTiming: row.preferredTiming,
            createdAt: row.createdAt.toISOString(),
            property: row.property
                ? {
                      id: row.property.id,
                      title: row.property.title,
                      city: row.property.location?.city,
                  }
                : undefined,
            organization: row.organization
                ? { id: row.organization.id, name: row.organization.name, slug: row.organization.slug }
                : undefined,
        }));
    }

    async createInquiry(prospectId: string, dto: CreateInquiryDto) {
        const account = await this.accountsRepo.findOne({ where: { id: prospectId } });
        if (!account) throw new NotFoundException('Account not found');

        const property = await this.requirePublicProperty(dto.propertyId);
        const owner = await this.usersService.findDefaultOwnerForOrganization(property.organizationId);

        const lead = await this.leadsService.create(property.organizationId, owner.id, {
            firstName: account.firstName,
            lastName: account.lastName,
            email: account.email,
            phone: account.phone,
            propertyId: property.id,
            source: 'portal',
        });

        const inquiry = await this.inquiriesRepo.save(
            this.inquiriesRepo.create({
                prospectId,
                propertyId: property.id,
                organizationId: property.organizationId,
                leadId: lead.id,
                type: dto.type,
                status: ProspectInquiryStatus.RECEIVED,
                message: dto.message?.trim(),
                preferredTiming: dto.preferredTiming?.trim(),
            }),
        );

        return {
            id: inquiry.id,
            type: inquiry.type,
            status: inquiry.status,
            statusLabel: this.statusLabel(inquiry.status),
            message: inquiry.message,
            preferredTiming: inquiry.preferredTiming,
            createdAt: inquiry.createdAt.toISOString(),
            property: {
                id: property.id,
                title: property.title,
                city: property.location?.city,
            },
            organization: property.organization
                ? { id: property.organization.id, name: property.organization.name, slug: property.organization.slug }
                : undefined,
        };
    }

    async isFavorite(prospectId: string, propertyId: string): Promise<boolean> {
        const count = await this.favoritesRepo.count({ where: { prospectId, propertyId } });
        return count > 0;
    }

    private buildAuthResponse(account: ProspectAccount, signToken: (payload: Record<string, unknown>) => string) {
        const accessToken = signToken({
            sub: account.id,
            email: account.email,
            accountType: 'prospect',
        });

        return {
            accessToken,
            user: this.toProfile(account),
        };
    }

    private toProfile(account: ProspectAccount): ProspectProfile {
        return {
            id: account.id,
            email: account.email,
            firstName: account.firstName,
            lastName: account.lastName,
            phone: account.phone,
        };
    }

    private async requirePublicProperty(propertyId: string) {
        const property = await this.propertiesRepo.findOne({
            where: {
                id: propertyId,
                commercialStatus: PropertyCommercialStatus.AVAILABLE,
                publicationStatus: PropertyPublicationStatus.PUBLISHED,
                isVisible: true,
            },
            relations: { location: true, organization: true },
        });

        if (!property) {
            throw new NotFoundException('Property not found or not available');
        }

        return property;
    }

    private isPropertyPublic(property: Property) {
        return (
            property.commercialStatus === PropertyCommercialStatus.AVAILABLE &&
            property.publicationStatus === PropertyPublicationStatus.PUBLISHED &&
            property.isVisible
        );
    }

    private statusLabel(status: ProspectInquiryStatus): string {
        const labels: Record<ProspectInquiryStatus, string> = {
            [ProspectInquiryStatus.RECEIVED]: 'Recibida',
            [ProspectInquiryStatus.CONTACTED]: 'Te contactaremos pronto',
            [ProspectInquiryStatus.VISIT_SCHEDULED]: 'Visita confirmada',
            [ProspectInquiryStatus.COMPLETED]: 'Visita realizada',
            [ProspectInquiryStatus.CLOSED]: 'Cerrada',
        };
        return labels[status] ?? status;
    }

    assertProspectAccount(user: { accountType?: string }) {
        if (user.accountType !== 'prospect') {
            throw new ForbiddenException('Prospect account required');
        }
    }
}
