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
} from '../../common/enums';
import { Activity } from '../activities/entities/activity.entity';
import { Amenity } from '../amenities/entities/amenity.entity';
import { ContactRole } from '../contacts/entities/contact-role.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { ApplicationChecklistItem } from '../documents/entities/application-checklist-item.entity';
import { DocumentType } from '../documents/entities/document-type.entity';
import { DocumentRecord } from '../documents/entities/document.entity';
import { Lead } from '../leads/entities/lead.entity';
import { PreferenceZone } from '../leads/entities/preference-zone.entity';
import { SearchPreference } from '../leads/entities/search-preference.entity';
import { OpportunityProperty } from '../opportunities/entities/opportunity-property.entity';
import { Opportunity } from '../opportunities/entities/opportunity.entity';
import { PipelineStage } from '../opportunities/entities/pipeline-stage.entity';
import { Pipeline } from '../opportunities/entities/pipeline.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Owner } from '../owners/entities/owner.entity';
import { PropertyAgent } from '../properties/entities/property-agent.entity';
import { PropertyAmenity } from '../properties/entities/property-amenity.entity';
import { PropertyFeature } from '../properties/entities/property-feature.entity';
import { PropertyLocation } from '../properties/entities/property-location.entity';
import { PropertyRentalDetail } from '../properties/entities/property-rental-detail.entity';
import { Property } from '../properties/entities/property.entity';
import { ApplicationApplicant } from '../rental-applications/entities/application-applicant.entity';
import { RentalApplication } from '../rental-applications/entities/rental-application.entity';
import { RentalContract } from '../rental-contracts/entities/rental-contract.entity';
import { RentalEvaluation } from '../rental-evaluations/entities/rental-evaluation.entity';
import { Role } from '../roles/entities/role.entity';
import { TaskItem } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Visit } from '../visits/entities/visit.entity';

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
  ) {}

  async run() {
    const organization = await this.ensureOrganization();
    const roles = await this.ensureRoles();

    const adminRole = roles.find((role) => role.name === UserRoleName.ADMIN)!;
    const agentRole = roles.find((role) => role.name === UserRoleName.AGENT)!;

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

    const owner = await this.ensureOwner(
      ownerContact.id,
      organization.id,
      OwnerType.PERSON,
    );

    const amenity = await this.ensureAmenity(
      'Piscina',
      'Piscina comun para residentes',
    );

    const property = await this.ensureProperty({
      organizationId: organization.id,
      ownerId: owner.id,
      code: 'BOHO-001',
      title: 'Apartamento moderno en el sur',
      description: 'Apartamento 2 habitaciones con parqueadero',
      propertyType: PropertyType.APARTMENT,
      commercialStatus: PropertyCommercialStatus.AVAILABLE,
      publicationStatus: PropertyPublicationStatus.PUBLISHED,
    });

    await this.ensurePropertyLocation(property.id);
    await this.ensurePropertyRentalDetail(property.id);
    await this.ensurePropertyFeature(property.id);
    await this.ensurePropertyAmenity(property.id, amenity.id);
    await this.ensurePropertyAgent(property.id, agentUser.id, 'showing_agent');

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
    const stage = await this.ensurePipelineStage(pipeline.id, 'Calificación', 1);
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

    const rentalApplication = await this.ensureRentalApplication(
      opportunity.id,
      property.id,
    );
    await this.ensureApplicationApplicant(rentalApplication.id, tenantContact.id);
    const documentType = await this.ensureDocumentType(
      'cedula',
      'Cédula de ciudadanía',
    );
    const document = await this.ensureDocument(adminUser.id);
    await this.ensureChecklistItem(
      rentalApplication.id,
      documentType.id,
      document.id,
    );
    await this.ensureRentalEvaluation(rentalApplication.id, adminUser.id);
    await this.ensureRentalContract(rentalApplication.id, property.id, tenantContact.id);

    return {
      organization,
      roles,
      users: [adminUser.email, agentUser.email],
      contacts: [ownerContact.email, tenantContact.email, leadContact.email],
      property: property.code,
      lead: lead.id,
      opportunity: opportunity.id,
      rentalApplication: rentalApplication.id,
      credentials: [
        { email: 'admin@boho.test', password: 'Admin1234!' },
        { email: 'agent@boho.test', password: 'Agent1234!' },
      ],
    };
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
    const names = [
      UserRoleName.ADMIN,
      UserRoleName.AGENT,
      UserRoleName.COORDINATOR,
    ];
    const roles: Role[] = [];

    for (const name of names) {
      let role = await this.rolesRepo.findOne({ where: { name } });
      if (!role) {
        role = await this.rolesRepo.save(
          this.rolesRepo.create({ name, description: `Rol ${name}` }),
        );
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
    return this.contactRolesRepo.save(
      this.contactRolesRepo.create({ contactId, roleType }),
    );
  }

  private async ensureOwner(
    contactId: string,
    organizationId: string,
    ownerType: OwnerType,
  ) {
    const existing = await this.ownersRepo.findOne({ where: { contactId } });
    if (existing) return existing;
    return this.ownersRepo.save(
      this.ownersRepo.create({ contactId, organizationId, ownerType }),
    );
  }

  private async ensureAmenity(name: string, description: string) {
    const existing = await this.amenitiesRepo.findOne({ where: { name } });
    if (existing) return existing;
    return this.amenitiesRepo.save(this.amenitiesRepo.create({ name, description }));
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
    if (existing) return existing;
    return this.propertiesRepo.save(this.propertiesRepo.create(input));
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

  private async ensurePropertyAmenity(propertyId: string, amenityId: string) {
    const existing = await this.propertyAmenitiesRepo.findOne({
      where: { propertyId, amenityId },
    });
    if (existing) return existing;
    return this.propertyAmenitiesRepo.save(
      this.propertyAmenitiesRepo.create({ propertyId, amenityId }),
    );
  }

  private async ensurePropertyAgent(
    propertyId: string,
    userId: string,
    assignmentRole: string,
  ) {
    const existing = await this.propertyAgentsRepo.findOne({
      where: { propertyId, userId },
    });
    if (existing) return existing;
    return this.propertyAgentsRepo.save(
      this.propertyAgentsRepo.create({ propertyId, userId, assignmentRole }),
    );
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

  private async ensurePipelineStage(
    pipelineId: string,
    name: string,
    order: number,
  ) {
    const existing = await this.pipelineStagesRepo.findOne({
      where: { pipelineId, order },
    });
    if (existing) return existing;
    return this.pipelineStagesRepo.save(
      this.pipelineStagesRepo.create({ pipelineId, name, order }),
    );
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
        status: RentalApplicationStatus.UNDER_REVIEW,
      }),
    );
  }

  private async ensureApplicationApplicant(
    rentalApplicationId: string,
    contactId: string,
  ) {
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

  private async ensureDocumentType(key: string, label: string) {
    const existing = await this.documentTypesRepo.findOne({ where: { key } });
    if (existing) return existing;
    return this.documentTypesRepo.save(
      this.documentTypesRepo.create({ key, label, isRequiredDefault: true }),
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

  private async ensureChecklistItem(
    rentalApplicationId: string,
    documentTypeId: string,
    documentId: string,
  ) {
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

  private async ensureRentalEvaluation(
    rentalApplicationId: string,
    evaluatedByUserId: string,
  ) {
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

  private async ensureRentalContract(
    rentalApplicationId: string,
    propertyId: string,
    tenantContactId: string,
  ) {
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
