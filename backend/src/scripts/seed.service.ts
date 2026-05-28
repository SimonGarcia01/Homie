import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import {
    ActivityType,
    ApplicantRole,
    ChecklistItemStatus,
    ContactRoleType,
    EvaluationRecommendation,
    LeadStatus,
    LeadTemperature,
    OpportunityPropertyStatus,
    OpportunityStatus,
    OwnerType,
    PropertyCommercialStatus,
    PropertyPublicationStatus,
    PropertyType,
    RentalApplicationStatus,
    RentalContractStatus,
    UserRoleName,
    VisitStatus,
    VisitType,
} from '../common/enums';
import { Activity } from '../modules/activities/entities/activity.entity';
import { Amenity } from '../modules/amenities/entities/amenity.entity';
import { ContactRole } from '../modules/contacts/entities/contact-role.entity';
import { Contact } from '../modules/contacts/entities/contact.entity';
import { ApplicationChecklistItem } from '../modules/documents/entities/application-checklist-item.entity';
import { DocumentType } from '../modules/documents/entities/document-type.entity';
import { DocumentRecord } from '../modules/documents/entities/document.entity';
import { Lead } from '../modules/leads/entities/lead.entity';
import { PreferenceZone } from '../modules/leads/entities/preference-zone.entity';
import { SearchPreference } from '../modules/leads/entities/search-preference.entity';
import { OpportunityProperty } from '../modules/opportunities/entities/opportunity-property.entity';
import { Opportunity } from '../modules/opportunities/entities/opportunity.entity';
import { PipelineStage } from '../modules/opportunities/entities/pipeline-stage.entity';
import { Pipeline } from '../modules/opportunities/entities/pipeline.entity';
import { DEFAULT_PIPELINE_STAGES } from '../modules/opportunities/pipelines.service';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { Owner } from '../modules/owners/entities/owner.entity';
import { PropertyAgent } from '../modules/properties/entities/property-agent.entity';
import { PropertyAmenity } from '../modules/properties/entities/property-amenity.entity';
import { PropertyFeature } from '../modules/properties/entities/property-feature.entity';
import { PropertyLocation } from '../modules/properties/entities/property-location.entity';
import { PropertyRentalDetail } from '../modules/properties/entities/property-rental-detail.entity';
import { Property } from '../modules/properties/entities/property.entity';
import { ApplicationApplicant } from '../modules/rental-applications/entities/application-applicant.entity';
import { RentalApplication } from '../modules/rental-applications/entities/rental-application.entity';
import { RentalContract } from '../modules/rental-contracts/entities/rental-contract.entity';
import { RentalEvaluation } from '../modules/rental-evaluations/entities/rental-evaluation.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { TaskItem } from '../modules/tasks/entities/task.entity';
import { User } from '../modules/users/entities/user.entity';
import { Visit } from '../modules/visits/entities/visit.entity';
import { PropertyImage } from '../modules/properties/entities/property-image.entity';
import { PropertyIncome } from '../modules/properties/entities/property-income.entity';
import { PropertyExpense } from '../modules/properties/entities/property-expense.entity';
import { PropertyIncomeType, PropertyExpenseCategory } from '../common/enums';

const SEED_PROPERTY_IMAGES: Record<
    string,
    { cover: string; gallery?: string[] }
> = {
    'BOHO-001': {
        cover: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80',
            'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80',
        ],
    },
    'BOHO-002': {
        cover: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80',
        ],
    },
    'BOHO-003': {
        cover: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
        ],
    },
    'BOHO-004': {
        cover: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1400&q=80',
            'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1400&q=80',
        ],
    },
};

@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(Organization)
        private readonly organizationsRepo: Repository<Organization>,
        @InjectRepository(Role)
        private readonly rolesRepo: Repository<Role>,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
        @InjectRepository(Contact)
        private readonly contactsRepo: Repository<Contact>,
        @InjectRepository(ContactRole)
        private readonly contactRolesRepo: Repository<ContactRole>,
        @InjectRepository(Lead)
        private readonly leadsRepo: Repository<Lead>,
        @InjectRepository(SearchPreference)
        private readonly searchPreferencesRepo: Repository<SearchPreference>,
        @InjectRepository(PreferenceZone)
        private readonly preferenceZonesRepo: Repository<PreferenceZone>,
        @InjectRepository(Owner)
        private readonly ownersRepo: Repository<Owner>,
        @InjectRepository(Amenity)
        private readonly amenitiesRepo: Repository<Amenity>,
        @InjectRepository(Property)
        private readonly propertiesRepo: Repository<Property>,
        @InjectRepository(PropertyLocation)
        private readonly propertyLocationsRepo: Repository<PropertyLocation>,
        @InjectRepository(PropertyRentalDetail)
        private readonly propertyRentalDetailsRepo: Repository<PropertyRentalDetail>,
        @InjectRepository(PropertyFeature)
        private readonly propertyFeaturesRepo: Repository<PropertyFeature>,
        @InjectRepository(PropertyAmenity)
        private readonly propertyAmenitiesRepo: Repository<PropertyAmenity>,
        @InjectRepository(PropertyAgent)
        private readonly propertyAgentsRepo: Repository<PropertyAgent>,
        @InjectRepository(Pipeline)
        private readonly pipelinesRepo: Repository<Pipeline>,
        @InjectRepository(PipelineStage)
        private readonly pipelineStagesRepo: Repository<PipelineStage>,
        @InjectRepository(Opportunity)
        private readonly opportunitiesRepo: Repository<Opportunity>,
        @InjectRepository(OpportunityProperty)
        private readonly opportunityPropertiesRepo: Repository<OpportunityProperty>,
        @InjectRepository(Visit)
        private readonly visitsRepo: Repository<Visit>,
        @InjectRepository(Activity)
        private readonly activitiesRepo: Repository<Activity>,
        @InjectRepository(TaskItem)
        private readonly tasksRepo: Repository<TaskItem>,
        @InjectRepository(RentalApplication)
        private readonly rentalApplicationsRepo: Repository<RentalApplication>,
        @InjectRepository(ApplicationApplicant)
        private readonly applicationApplicantsRepo: Repository<ApplicationApplicant>,
        @InjectRepository(DocumentType)
        private readonly documentTypesRepo: Repository<DocumentType>,
        @InjectRepository(DocumentRecord)
        private readonly documentsRepo: Repository<DocumentRecord>,
        @InjectRepository(ApplicationChecklistItem)
        private readonly checklistItemsRepo: Repository<ApplicationChecklistItem>,
        @InjectRepository(RentalEvaluation)
        private readonly rentalEvaluationsRepo: Repository<RentalEvaluation>,
        @InjectRepository(RentalContract)
        private readonly rentalContractsRepo: Repository<RentalContract>,
        @InjectRepository(PropertyIncome)
        private readonly propertyIncomesRepo: Repository<PropertyIncome>,
        @InjectRepository(PropertyExpense)
        private readonly propertyExpensesRepo: Repository<PropertyExpense>,
        @InjectRepository(PropertyImage)
        private readonly propertyImagesRepo: Repository<PropertyImage>,
    ) {}


    async run() {
        const organization = await this.ensureOrganization();
        const roles = await this.ensureRoles();

        const adminRole = roles.find((role) => role.name === UserRoleName.ADMIN)!;
        const agentRole = roles.find((role) => role.name === UserRoleName.AGENT)!;
        const coordinatorRole = roles.find((role) => role.name === UserRoleName.COORDINATOR)!;

        const adminUser = await this.ensureUser({
            email: 'admin@boho.test',
            firstName: 'Admin',
            lastName: 'Boho',
            organizationId: organization.id,
            roleId: adminRole.id,
            password: 'Admin1234!',
        });

        const agentUser = await this.ensureUser({
            email: 'agent@boho.test',
            firstName: 'Agent',
            lastName: 'Boho',
            organizationId: organization.id,
            roleId: agentRole.id,
            password: 'Agent1234!',
        });

        const coordinatorUser = await this.ensureUser({
            email: 'coord@boho.test',
            firstName: 'Coord',
            lastName: 'Boho',
            organizationId: organization.id,
            roleId: coordinatorRole.id,
            password: 'Coord1234!',
        });

        const ownerContact = await this.ensureContact({
            organizationId: organization.id,
            firstName: 'Paula',
            lastName: 'Propietaria',
            email: 'owner@boho.test',
            phone: '3000000001',
        });
        const tenantContact = await this.ensureContact({
            organizationId: organization.id,
            firstName: 'Tomas',
            lastName: 'Arrendatario',
            email: 'tenant@boho.test',
            phone: '3000000002',
        });
        const leadContact = await this.ensureContact({
            organizationId: organization.id,
            firstName: 'Laura',
            lastName: 'Lead',
            email: 'lead@boho.test',
            phone: '3000000003',
        });

        await this.ensureContactRole(ownerContact.id, ContactRoleType.OWNER);
        await this.ensureContactRole(tenantContact.id, ContactRoleType.TENANT);
        await this.ensureContactRole(leadContact.id, ContactRoleType.LEAD);

        const owner = await this.ensureOwner(ownerContact.id, organization.id, OwnerType.PERSON);

        const amenity = await this.ensureAmenity('Piscina', 'Piscina comun para residentes');

        await this.ensureDefaultDocumentTypes();

        const property = await this.ensureProperty({
            organizationId: organization.id,
            ownerId: owner.id,
            code: 'BOHO-001',
            title: 'Apartamento moderno en el sur',
            description: 'Apartamento 2 habitaciones con parqueadero, cerca al centro comercial',
            propertyType: PropertyType.APARTMENT,
            commercialStatus: PropertyCommercialStatus.AVAILABLE,
            publicationStatus: PropertyPublicationStatus.PUBLISHED,
        });

        await this.ensurePropertyLocation(property.id);
        await this.ensurePropertyRentalDetail(property.id);
        await this.ensurePropertyFeature(property.id);
        await this.ensurePropertyAmenity(property.id, amenity.id);
        await this.ensurePropertyAgent(property.id, agentUser.id, 'showing_agent');
        await this.ensurePropertyImages(property.id, property.code);

        // Financial data for BOHO-001
        await this.ensureIncomesAndExpenses(property.id);

        // Propiedad 2 - Casa en el norte
        const property2 = await this.ensureProperty({
            organizationId: organization.id,
            ownerId: owner.id,
            code: 'BOHO-002',
            title: 'Casa familiar en el norte',
            description: 'Hermosa casa con 3 habitaciones, jardín y garaje para 2 carros',
            propertyType: PropertyType.HOUSE,
            commercialStatus: PropertyCommercialStatus.AVAILABLE,
            publicationStatus: PropertyPublicationStatus.PUBLISHED,
        });

        await this.ensurePropertyLocation2(property2.id);
        await this.ensurePropertyRentalDetail2(property2.id);
        await this.ensurePropertyFeature2(property2.id);
        await this.ensurePropertyAmenity(property2.id, amenity.id);
        await this.ensurePropertyAgent(property2.id, agentUser.id, 'showing_agent');
        await this.ensurePropertyImages(property2.id, property2.code);
        
        await this.ensureIncomesAndExpenses(property2.id);

        // Propiedad 3 - Estudio en el centro
        const property3 = await this.ensureProperty({
            organizationId: organization.id,
            ownerId: owner.id,
            code: 'BOHO-003',
            title: 'Estudio amueblado en el centro',
            description: 'Estudio moderno amueblado, ideal para estudiantes o profesionales',
            propertyType: PropertyType.STUDIO,
            commercialStatus: PropertyCommercialStatus.AVAILABLE,
            publicationStatus: PropertyPublicationStatus.PUBLISHED,
        });

        await this.ensurePropertyLocation3(property3.id);
        await this.ensurePropertyRentalDetail3(property3.id);
        await this.ensurePropertyFeature3(property3.id);
        await this.ensurePropertyAmenity(property3.id, amenity.id);
        await this.ensurePropertyAgent(property3.id, agentUser.id, 'showing_agent');
        await this.ensurePropertyImages(property3.id, property3.code);

        await this.ensureIncomesAndExpenses(property3.id);

        // Propiedad 4 - Apartamento de lujo
        const property4 = await this.ensureProperty({
            organizationId: organization.id,
            ownerId: owner.id,
            code: 'BOHO-004',
            title: 'Apartamento de lujo con vista panorámica',
            description: 'Exclusivo apartamento con acabados de alta calidad, piscina y gimnasio',
            propertyType: PropertyType.APARTMENT,
            commercialStatus: PropertyCommercialStatus.AVAILABLE,
            publicationStatus: PropertyPublicationStatus.PUBLISHED,
        });

        await this.ensurePropertyLocation4(property4.id);
        await this.ensurePropertyRentalDetail4(property4.id);
        await this.ensurePropertyFeature4(property4.id);
        await this.ensurePropertyAmenity(property4.id, amenity.id);
        await this.ensurePropertyAgent(property4.id, agentUser.id, 'showing_agent');
        await this.ensurePropertyImages(property4.id, property4.code);

        await this.ensureIncomesAndExpenses(property4.id);

        const lead = await this.ensureLead({
            organizationId: organization.id,
            contactId: leadContact.id,
            ownerUserId: agentUser.id,
            source: 'instagram',
            status: LeadStatus.CONTACTED,
            temperature: LeadTemperature.WARM,
        });
        const searchPreference = await this.ensureSearchPreference(lead.id);
        await this.ensurePreferenceZone(searchPreference.id);

        const pipeline = await this.ensurePipeline(organization.id, 'Arriendos');
        for (const s of DEFAULT_PIPELINE_STAGES) {
            await this.ensurePipelineStage(pipeline.id, s.name, s.order);
        }
        const stage = await this.pipelineStagesRepo.findOneOrFail({
            where: { pipelineId: pipeline.id, order: 3 },
        });
        const opportunity = await this.ensureOpportunity({
            organizationId: organization.id,
            leadId: lead.id,
            ownerUserId: agentUser.id,
            pipelineId: pipeline.id,
            stageId: stage.id,
        });
        await this.ensureOpportunityProperty(opportunity.id, property.id);

        const visit = await this.ensureVisit({
            organizationId: organization.id,
            opportunityId: opportunity.id,
            propertyId: property.id,
            contactId: leadContact.id,
            agentUserId: agentUser.id,
        });
        await this.ensureActivity({
            organizationId: organization.id,
            userId: agentUser.id,
            leadId: lead.id,
            opportunityId: opportunity.id,
            propertyId: property.id,
            visitId: visit.id,
            type: ActivityType.VISIT,
            content: 'Visita programada con lead',
        });
        await this.ensureTask({
            organizationId: organization.id,
            createdByUserId: adminUser.id,
            assignedToUserId: agentUser.id,
            opportunityId: opportunity.id,
            leadId: lead.id,
            propertyId: property.id,
            title: 'Enviar propuesta de arriendo',
        });

        const rentalApplication = await this.ensureRentalApplication(opportunity.id, property.id);
        await this.ensureApplicationApplicant(rentalApplication.id, tenantContact.id);
        const documentTypes = await this.ensureDefaultDocumentTypes();
        const cedulaType = documentTypes.find((t) => t.key === 'cedula')!;
        const document = await this.ensureDocument(adminUser.id);
        await this.ensureChecklistItem(rentalApplication.id, cedulaType.id, document.id);
        for (const docType of documentTypes) {
            if (docType.key === 'cedula') continue;
            await this.ensureChecklistItemPending(rentalApplication.id, docType.id);
        }
        await this.ensureRentalEvaluation(rentalApplication.id, adminUser.id);
        await this.ensureRentalContract(rentalApplication.id, property.id, tenantContact.id);

        return {
            organization,
            roles,
            users: [adminUser.email, agentUser.email, coordinatorUser.email],
            contacts: [ownerContact.email, tenantContact.email, leadContact.email],
            property: property.code,
            lead: lead.id,
            opportunity: opportunity.id,
            rentalApplication: rentalApplication.id,
            credentials: [
                { email: 'admin@boho.test', password: 'Admin1234!', role: 'admin' },
                { email: 'coord@boho.test', password: 'Coord1234!', role: 'coordinator' },
                { email: 'agent@boho.test', password: 'Agent1234!', role: 'agent' },
            ],
        };
    }

    private async ensureIncomesAndExpenses(propertyId: string) {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        // Incomes
        const incomes = [
            { amount: '2200000', incomeDate: formatDate(today), incomeType: PropertyIncomeType.ARRIENDO, description: 'Pago arriendo mes actual' },
            { amount: '2200000', incomeDate: formatDate(lastMonth), incomeType: PropertyIncomeType.ARRIENDO, description: 'Pago arriendo mes anterior' },
        ];

        for (const inc of incomes) {
            const existing = await this.propertyIncomesRepo.findOne({
                where: { propertyId, incomeDate: inc.incomeDate, amount: inc.amount },
            });
            if (!existing) {
                await this.propertyIncomesRepo.save(this.propertyIncomesRepo.create({ ...inc, propertyId }));
            }
        }

        // Expenses
        const expenses = [
            { amount: '150000', expenseDate: formatDate(today), expenseCategory: PropertyExpenseCategory.MANTENIMIENTO, description: 'Reparación grifo cocina' },
            { amount: '45000', expenseDate: formatDate(today), expenseCategory: PropertyExpenseCategory.SERVICIO, description: 'Servicio de agua' },
            { amount: '850000', expenseDate: formatDate(lastMonth), expenseCategory: PropertyExpenseCategory.IMPUESTO, description: 'Impuesto predial cuota 1' },
            { amount: '120000', expenseDate: formatDate(lastMonth), expenseCategory: PropertyExpenseCategory.MANTENIMIENTO, description: 'Limpieza general' },
        ];

        for (const exp of expenses) {
            const existing = await this.propertyExpensesRepo.findOne({
                where: { propertyId, expenseDate: exp.expenseDate, amount: exp.amount, description: exp.description },
            });
            if (!existing) {
                await this.propertyExpensesRepo.save(this.propertyExpensesRepo.create({ ...exp, propertyId }));
            }
        }
    }

    private async ensureOrganization() {
        const existing = await this.organizationsRepo.findOne({
            where: { slug: 'boho-demo' },
        });
        if (existing) return existing;

        return this.organizationsRepo.save(
            this.organizationsRepo.create({
                name: 'Boho Demo Inmobiliaria',
                slug: 'boho-demo',
                country: 'Colombia',
                timezone: 'America/Bogota',
                isActive: true,
            }),
        );
    }

    private async ensureRoles() {
        const names = [UserRoleName.ADMIN, UserRoleName.AGENT, UserRoleName.COORDINATOR];
        const roles: Role[] = [];

        for (const name of names) {
            let role = await this.rolesRepo.findOne({ where: { name } });
            if (!role) {
                role = await this.rolesRepo.save(this.rolesRepo.create({ name, description: `Rol ${name}` }));
            }
            roles.push(role);
        }

        return roles;
    }

    private async ensureUser(input: {
        email: string;
        firstName: string;
        lastName: string;
        organizationId: string;
        roleId: string;
        password: string;
    }) {
        const existing = await this.usersRepo.findOne({
            where: { email: input.email },
        });
        if (existing) return existing;

        return this.usersRepo.save(
            this.usersRepo.create({
                email: input.email,
                firstName: input.firstName,
                lastName: input.lastName,
                organizationId: input.organizationId,
                roleId: input.roleId,
                passwordHash: await bcrypt.hash(input.password, 10),
                isActive: true,
            }),
        );
    }

    private async ensureContact(input: {
        organizationId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    }) {
        const existing = await this.contactsRepo.findOne({
            where: { email: input.email },
        });
        if (existing) return existing;
        return this.contactsRepo.save(this.contactsRepo.create(input));
    }

    private async ensureContactRole(contactId: string, roleType: ContactRoleType) {
        const existing = await this.contactRolesRepo.findOne({
            where: { contactId, roleType },
        });
        if (existing) return existing;
        return this.contactRolesRepo.save(this.contactRolesRepo.create({ contactId, roleType }));
    }

    private async ensureOwner(contactId: string, organizationId: string, ownerType: OwnerType) {
        const existing = await this.ownersRepo.findOne({ where: { contactId } });
        if (existing) return existing;
        return this.ownersRepo.save(this.ownersRepo.create({ contactId, organizationId, ownerType }));
    }

    private async ensureAmenity(name: string, description: string) {
        const existing = await this.amenitiesRepo.findOne({ where: { name } });
        if (existing) return existing;
        return this.amenitiesRepo.save(this.amenitiesRepo.create({ name, description }));
    }

    private async ensurePropertyImages(propertyId: string, code: string) {
        const config = SEED_PROPERTY_IMAGES[code];
        if (!config) return;

        const existingCount = await this.propertyImagesRepo.count({ where: { propertyId } });
        if (existingCount > 0) return;

        const urls = [config.cover, ...(config.gallery ?? [])];
        for (let i = 0; i < urls.length; i++) {
            const imageUrl = urls[i];
            await this.propertyImagesRepo.save(
                this.propertyImagesRepo.create({
                    propertyId,
                    storageKey: `seed/${code.toLowerCase()}-${i + 1}.jpg`,
                    imageUrl,
                    imageType: 'gallery',
                    mimeType: 'image/jpeg',
                    fileSizeBytes: '0',
                    originalFilename: i === 0 ? 'cover.jpg' : `gallery-${i}.jpg`,
                    sortOrder: i,
                    isCover: i === 0,
                }),
            );
        }
    }

    private async ensureProperty(input: {
        organizationId: string;
        ownerId: string;
        code: string;
        title: string;
        description: string;
        propertyType: PropertyType;
        commercialStatus: PropertyCommercialStatus;
        publicationStatus: PropertyPublicationStatus;
    }) {
        const existing = await this.propertiesRepo.findOne({ where: { code: input.code } });
        if (existing) {
            Object.assign(existing, {
                title: input.title,
                description: input.description,
                propertyType: input.propertyType,
                commercialStatus: input.commercialStatus,
                publicationStatus: input.publicationStatus,
                isVisible: true,
            });
            return this.propertiesRepo.save(existing);
        }
        return this.propertiesRepo.save(
            this.propertiesRepo.create({
                ...input,
                isVisible: true,
            }),
        );
    }

    private async ensurePropertyLocation(propertyId: string) {
        const existing = await this.propertyLocationsRepo.findOne({ where: { propertyId } });
        if (existing) return existing;
        return this.propertyLocationsRepo.save(
            this.propertyLocationsRepo.create({
                propertyId,
                country: 'Colombia',
                city: 'Cali',
            }),
        );
    }

    private async ensurePropertyLocation2(propertyId: string) {
        const existing = await this.propertyLocationsRepo.findOne({ where: { propertyId } });
        if (existing) return existing;
        return this.propertyLocationsRepo.save(
            this.propertyLocationsRepo.create({
                propertyId,
                country: 'Colombia',
                city: 'Cali',
                address: 'Calle 123 #45-67, Barrio Norte',
            }),
        );
    }

    private async ensurePropertyLocation3(propertyId: string) {
        const existing = await this.propertyLocationsRepo.findOne({ where: { propertyId } });
        if (existing) return existing;
        return this.propertyLocationsRepo.save(
            this.propertyLocationsRepo.create({
                propertyId,
                country: 'Colombia',
                city: 'Cali',
                address: 'Cra 50 #10-20, Centro',
            }),
        );
    }

    private async ensurePropertyLocation4(propertyId: string) {
        const existing = await this.propertyLocationsRepo.findOne({ where: { propertyId } });
        if (existing) return existing;
        return this.propertyLocationsRepo.save(
            this.propertyLocationsRepo.create({
                propertyId,
                country: 'Colombia',
                city: 'Cali',
                address: 'Av. 6 #100-200, Barrio Granada',
            }),
        );
    }

    private async ensurePropertyRentalDetail(propertyId: string) {
        const existing = await this.propertyRentalDetailsRepo.findOne({ where: { propertyId } });
        if (existing) return existing;
        return this.propertyRentalDetailsRepo.save(
            this.propertyRentalDetailsRepo.create({
                propertyId,
                monthlyRent: '2200000',
                currency: 'COP',
            }),
        );
    }

    private async ensurePropertyRentalDetail2(propertyId: string) {
        const existing = await this.propertyRentalDetailsRepo.findOne({ where: { propertyId } });
        if (existing) return existing;
        return this.propertyRentalDetailsRepo.save(
            this.propertyRentalDetailsRepo.create({
                propertyId,
                monthlyRent: '3500000',
                currency: 'COP',
            }),
        );
    }

    private async ensurePropertyRentalDetail3(propertyId: string) {
        const existing = await this.propertyRentalDetailsRepo.findOne({ where: { propertyId } });
        if (existing) return existing;
        return this.propertyRentalDetailsRepo.save(
            this.propertyRentalDetailsRepo.create({
                propertyId,
                monthlyRent: '1500000',
                currency: 'COP',
            }),
        );
    }

    private async ensurePropertyRentalDetail4(propertyId: string) {
        const existing = await this.propertyRentalDetailsRepo.findOne({ where: { propertyId } });
        if (existing) return existing;
        return this.propertyRentalDetailsRepo.save(
            this.propertyRentalDetailsRepo.create({
                propertyId,
                monthlyRent: '5000000',
                currency: 'COP',
            }),
        );
    }

    private async ensurePropertyFeature(propertyId: string) {
        const existing = await this.propertyFeaturesRepo.findOne({ where: { propertyId } });
        if (existing) return existing;
        return this.propertyFeaturesRepo.save(
            this.propertyFeaturesRepo.create({
                propertyId,
                bedrooms: 2,
                bathrooms: 2,
                isFurnished: false,
                petsAllowed: true,
            }),
        );
    }

    private async ensurePropertyFeature2(propertyId: string) {
        const existing = await this.propertyFeaturesRepo.findOne({ where: { propertyId } });
        if (existing) return existing;
        return this.propertyFeaturesRepo.save(
            this.propertyFeaturesRepo.create({
                propertyId,
                bedrooms: 3,
                bathrooms: 2,
                isFurnished: true,
                petsAllowed: true,
            }),
        );
    }

    private async ensurePropertyFeature3(propertyId: string) {
        const existing = await this.propertyFeaturesRepo.findOne({ where: { propertyId } });
        if (existing) return existing;
        return this.propertyFeaturesRepo.save(
            this.propertyFeaturesRepo.create({
                propertyId,
                bedrooms: 1,
                bathrooms: 1,
                isFurnished: true,
                petsAllowed: false,
            }),
        );
    }

    private async ensurePropertyFeature4(propertyId: string) {
        const existing = await this.propertyFeaturesRepo.findOne({ where: { propertyId } });
        if (existing) return existing;
        return this.propertyFeaturesRepo.save(
            this.propertyFeaturesRepo.create({
                propertyId,
                bedrooms: 3,
                bathrooms: 3,
                isFurnished: true,
                petsAllowed: true,
            }),
        );
    }

    private async ensurePropertyAmenity(propertyId: string, amenityId: string) {
        const existing = await this.propertyAmenitiesRepo.findOne({
            where: { propertyId, amenityId },
        });
        if (existing) return existing;
        return this.propertyAmenitiesRepo.save(this.propertyAmenitiesRepo.create({ propertyId, amenityId }));
    }

    private async ensurePropertyAgent(propertyId: string, userId: string, assignmentRole: string) {
        const existing = await this.propertyAgentsRepo.findOne({
            where: { propertyId, userId },
        });
        if (existing) return existing;
        return this.propertyAgentsRepo.save(this.propertyAgentsRepo.create({ propertyId, userId, assignmentRole }));
    }

    private async ensureLead(input: {
        organizationId: string;
        contactId: string;
        ownerUserId: string;
        source: string;
        status: LeadStatus;
        temperature: LeadTemperature;
    }) {
        const existing = await this.leadsRepo.findOne({ where: { contactId: input.contactId } });
        if (existing) return existing;
        return this.leadsRepo.save(
            this.leadsRepo.create({
                ...input,
                score: 70,
            }),
        );
    }

    private async ensureSearchPreference(leadId: string) {
        const existing = await this.searchPreferencesRepo.findOne({ where: { leadId } });
        if (existing) return existing;
        return this.searchPreferencesRepo.save(
            this.searchPreferencesRepo.create({
                leadId,
                propertyType: PropertyType.APARTMENT,
                rentMin: '1800000',
                rentMax: '2600000',
            }),
        );
    }

    private async ensurePreferenceZone(searchPreferenceId: string) {
        const existing = await this.preferenceZonesRepo.findOne({
            where: { searchPreferenceId, city: 'Cali' },
        });
        if (existing) return existing;
        return this.preferenceZonesRepo.save(
            this.preferenceZonesRepo.create({
                searchPreferenceId,
                city: 'Cali',
                zone: 'Sur',
                neighborhood: 'Ciudad Jardin',
                priority: 1,
            }),
        );
    }

    private async ensurePipeline(organizationId: string, name: string) {
        const existing = await this.pipelinesRepo.findOne({
            where: { organizationId, name },
        });
        if (existing) return existing;
        return this.pipelinesRepo.save(this.pipelinesRepo.create({ organizationId, name }));
    }

    private async ensurePipelineStage(pipelineId: string, name: string, order: number) {
        const existing = await this.pipelineStagesRepo.findOne({
            where: { pipelineId, order },
        });
        if (existing) return existing;
        return this.pipelineStagesRepo.save(this.pipelineStagesRepo.create({ pipelineId, name, order }));
    }

    private async ensureOpportunity(input: {
        organizationId: string;
        leadId: string;
        ownerUserId: string;
        pipelineId: string;
        stageId: string;
    }) {
        const existing = await this.opportunitiesRepo.findOne({
            where: { leadId: input.leadId },
        });
        if (existing) return existing;
        return this.opportunitiesRepo.save(
            this.opportunitiesRepo.create({
                ...input,
                status: OpportunityStatus.OPEN,
            }),
        );
    }

    private async ensureOpportunityProperty(opportunityId: string, propertyId: string) {
        const existing = await this.opportunityPropertiesRepo.findOne({
            where: { opportunityId, propertyId },
        });
        if (existing) return existing;
        return this.opportunityPropertiesRepo.save(
            this.opportunityPropertiesRepo.create({
                opportunityId,
                propertyId,
                status: OpportunityPropertyStatus.SUGGESTED,
            }),
        );
    }

    private async ensureVisit(input: {
        organizationId: string;
        opportunityId: string;
        propertyId: string;
        contactId: string;
        agentUserId: string;
    }) {
        const existing = await this.visitsRepo.findOne({
            where: { opportunityId: input.opportunityId, propertyId: input.propertyId },
        });
        if (existing) return existing;
        return this.visitsRepo.save(
            this.visitsRepo.create({
                ...input,
                visitType: VisitType.IN_PERSON,
                status: VisitStatus.CONFIRMED,
            }),
        );
    }

    private async ensureActivity(input: {
        organizationId: string;
        userId: string;
        leadId: string;
        opportunityId: string;
        propertyId: string;
        visitId: string;
        type: ActivityType;
        content: string;
    }) {
        const existing = await this.activitiesRepo.findOne({
            where: { visitId: input.visitId },
        });
        if (existing) return existing;
        return this.activitiesRepo.save(this.activitiesRepo.create(input));
    }

    private async ensureTask(input: {
        organizationId: string;
        createdByUserId: string;
        assignedToUserId: string;
        opportunityId: string;
        leadId: string;
        propertyId: string;
        title: string;
    }) {
        const existing = await this.tasksRepo.findOne({ where: { title: input.title } });
        if (existing) return existing;
        return this.tasksRepo.save(
            this.tasksRepo.create({
                ...input,
                description: 'Seguimiento comercial inicial',
            }),
        );
    }

    private async ensureRentalApplication(opportunityId: string, propertyId: string) {
        const existing = await this.rentalApplicationsRepo.findOne({
            where: { opportunityId, propertyId },
        });
        if (existing) return existing;
        return this.rentalApplicationsRepo.save(
            this.rentalApplicationsRepo.create({
                opportunityId,
                propertyId,
                status: RentalApplicationStatus.PENDING_DOCUMENTS,
            }),
        );
    }

    private async ensureApplicationApplicant(rentalApplicationId: string, contactId: string) {
        const existing = await this.applicationApplicantsRepo.findOne({
            where: { rentalApplicationId, contactId },
        });
        if (existing) return existing;
        return this.applicationApplicantsRepo.save(
            this.applicationApplicantsRepo.create({
                rentalApplicationId,
                contactId,
                applicantRole: ApplicantRole.PRIMARY_TENANT,
            }),
        );
    }

    private async ensureDefaultDocumentTypes() {
        const defaults = [
            { key: 'cedula', label: 'Cédula de ciudadanía' },
            { key: 'comprobante_renta', label: 'Comprobante de renta' },
            { key: 'contrato_trabajo', label: 'Contrato de trabajo' },
            { key: 'garantia', label: 'Documento de garantía' },
        ];
        const types = [];
        for (const item of defaults) {
            types.push(await this.ensureDocumentType(item.key, item.label));
        }
        return types;
    }

    private async ensureDocumentType(key: string, label: string) {
        const existing = await this.documentTypesRepo.findOne({ where: { key } });
        if (existing) {
            if (!existing.isRequiredDefault) {
                existing.isRequiredDefault = true;
                return this.documentTypesRepo.save(existing);
            }
            return existing;
        }
        return this.documentTypesRepo.save(this.documentTypesRepo.create({ key, label, isRequiredDefault: true }));
    }

    private async ensureChecklistItemPending(rentalApplicationId: string, documentTypeId: string) {
        const existing = await this.checklistItemsRepo.findOne({
            where: { rentalApplicationId, documentTypeId },
        });
        if (existing) return existing;
        return this.checklistItemsRepo.save(
            this.checklistItemsRepo.create({
                rentalApplicationId,
                documentTypeId,
                status: ChecklistItemStatus.PENDING,
            }),
        );
    }

    private async ensureDocument(uploadedByUserId: string) {
        const existing = await this.documentsRepo.findOne({
            where: { originalFilename: 'cedula_tenant.pdf' },
        });
        if (existing) return existing;
        return this.documentsRepo.save(
            this.documentsRepo.create({
                uploadedByUserId,
                storageProvider: 'local-demo',
                storageKey: 'documents/cedula_tenant.pdf',
                originalFilename: 'cedula_tenant.pdf',
                fileSizeBytes: '102400',
            }),
        );
    }

    private async ensureChecklistItem(rentalApplicationId: string, documentTypeId: string, documentId: string) {
        const existing = await this.checklistItemsRepo.findOne({
            where: { rentalApplicationId, documentTypeId },
        });
        if (existing) return existing;
        return this.checklistItemsRepo.save(
            this.checklistItemsRepo.create({
                rentalApplicationId,
                documentTypeId,
                documentId,
                status: ChecklistItemStatus.RECEIVED,
            }),
        );
    }

    private async ensureRentalEvaluation(rentalApplicationId: string, evaluatedByUserId: string) {
        const existing = await this.rentalEvaluationsRepo.findOne({
            where: { rentalApplicationId },
        });
        if (existing) return existing;
        return this.rentalEvaluationsRepo.save(
            this.rentalEvaluationsRepo.create({
                rentalApplicationId,
                evaluatedByUserId,
                recommendation: EvaluationRecommendation.APPROVED_WITH_CONDITIONS,
            }),
        );
    }

    private async ensureRentalContract(rentalApplicationId: string, propertyId: string, tenantContactId: string) {
        const existing = await this.rentalContractsRepo.findOne({
            where: { rentalApplicationId },
        });
        if (existing) return existing;
        return this.rentalContractsRepo.save(
            this.rentalContractsRepo.create({
                rentalApplicationId,
                propertyId,
                tenantContactId,
                status: RentalContractStatus.DRAFT,
                startDate: '2026-05-01',
                endDate: '2027-04-30',
                monthlyRent: '2200000',
            }),
        );
    }
}
