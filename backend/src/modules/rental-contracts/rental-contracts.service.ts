import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
    ApplicantRole,
    PropertyCommercialStatus,
    PropertyIncomeType,
    RentalApplicationStatus,
    RentalContractStatus,
} from '../../common/enums';
import { ApplicationApplicant } from '../rental-applications/entities/application-applicant.entity';
import { RentalApplication } from '../rental-applications/entities/rental-application.entity';
import { PropertyIncome } from '../properties/entities/property-income.entity';
import { Property } from '../properties/entities/property.entity';

import { CreateRentalContractDto } from './dto/create-rental-contract.dto';
import { UpdateRentalContractDto } from './dto/update-rental-contract.dto';
import { RentalContract } from './entities/rental-contract.entity';

export type ContractView = {
    id: string;
    status: RentalContractStatus;
    startDate: string;
    endDate: string;
    monthlyRent: string;
    signedAt?: string;
    propertyId: string;
    tenantContactId: string;
    createdAt: string;
};

@Injectable()
export class RentalContractsService {
    constructor(
        @InjectRepository(RentalContract)
        private readonly contractsRepo: Repository<RentalContract>,
        @InjectRepository(RentalApplication)
        private readonly applicationsRepo: Repository<RentalApplication>,
        @InjectRepository(ApplicationApplicant)
        private readonly applicantsRepo: Repository<ApplicationApplicant>,
        @InjectRepository(Property)
        private readonly propertiesRepo: Repository<Property>,
        @InjectRepository(PropertyIncome)
        private readonly incomesRepo: Repository<PropertyIncome>,
    ) {}

    private toView(contract: RentalContract): ContractView {
        return {
            id: contract.id,
            status: contract.status,
            startDate: contract.startDate,
            endDate: contract.endDate,
            monthlyRent: contract.monthlyRent,
            signedAt: contract.signedAt?.toISOString(),
            propertyId: contract.propertyId,
            tenantContactId: contract.tenantContactId,
            createdAt: contract.createdAt.toISOString(),
        };
    }

    private async resolveTenantContactId(applicationId: string, explicit?: string): Promise<string> {
        if (explicit) return explicit;

        const primary = await this.applicantsRepo.findOne({
            where: { rentalApplicationId: applicationId, applicantRole: ApplicantRole.PRIMARY_TENANT },
        });
        if (primary) return primary.contactId;

        const application = await this.applicationsRepo.findOne({
            where: { id: applicationId },
            relations: { opportunity: { lead: true } },
        });
        const contactId = application?.opportunity?.lead?.contactId;
        if (!contactId) throw new NotFoundException('Tenant contact not found for application');
        return contactId;
    }

    async findByApplication(applicationId: string): Promise<ContractView | null> {
        const contract = await this.contractsRepo.findOne({
            where: { rentalApplicationId: applicationId },
            order: { createdAt: 'DESC' },
        });
        return contract ? this.toView(contract) : null;
    }

    async create(applicationId: string, dto: CreateRentalContractDto): Promise<ContractView> {
        const application = await this.applicationsRepo.findOne({ where: { id: applicationId } });
        if (!application) throw new NotFoundException('Application not found');

        const existing = await this.contractsRepo.findOne({ where: { rentalApplicationId: applicationId } });
        if (existing) throw new ConflictException('Contract already exists for this application');

        const tenantContactId = await this.resolveTenantContactId(applicationId, dto.tenantContactId);

        const contract = await this.contractsRepo.save(
            this.contractsRepo.create({
                rentalApplicationId: applicationId,
                propertyId: application.propertyId,
                tenantContactId,
                status: RentalContractStatus.DRAFT,
                startDate: dto.startDate,
                endDate: dto.endDate,
                monthlyRent: dto.monthlyRent,
            }),
        );

        return this.toView(contract);
    }

    async update(applicationId: string, dto: UpdateRentalContractDto): Promise<ContractView> {
        const contract = await this.contractsRepo.findOne({ where: { rentalApplicationId: applicationId } });
        if (!contract) throw new NotFoundException('Contract not found');

        if (dto.startDate !== undefined) contract.startDate = dto.startDate;
        if (dto.endDate !== undefined) contract.endDate = dto.endDate;
        if (dto.monthlyRent !== undefined) contract.monthlyRent = dto.monthlyRent;

        const signing = dto.status === RentalContractStatus.SIGNED && contract.status !== RentalContractStatus.SIGNED;
        if (dto.status !== undefined) contract.status = dto.status;

        if (signing) {
            contract.signedAt = new Date();
            await this.onContractSigned(contract);
        }

        await this.contractsRepo.save(contract);
        return this.toView(contract);
    }

    private async onContractSigned(contract: RentalContract) {
        const application = await this.applicationsRepo.findOne({ where: { id: contract.rentalApplicationId } });
        if (application && application.status !== RentalApplicationStatus.APPROVED) {
            application.status = RentalApplicationStatus.APPROVED;
            await this.applicationsRepo.save(application);
        }

        const property = await this.propertiesRepo.findOne({ where: { id: contract.propertyId } });
        if (property) {
            property.commercialStatus = PropertyCommercialStatus.RENTED;
            await this.propertiesRepo.save(property);
        }

        const incomeDate = contract.startDate;
        const existingIncome = await this.incomesRepo.findOne({
            where: {
                propertyId: contract.propertyId,
                incomeDate,
                amount: contract.monthlyRent,
            },
        });
        if (!existingIncome) {
            await this.incomesRepo.save(
                this.incomesRepo.create({
                    propertyId: contract.propertyId,
                    amount: contract.monthlyRent,
                    incomeDate,
                    incomeType: PropertyIncomeType.ARRIENDO,
                    description: 'Ingreso por contrato de arriendo firmado',
                }),
            );
        }
    }
}
