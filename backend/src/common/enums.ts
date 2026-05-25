export enum UserRoleName {
    ADMIN = 'admin',
    AGENT = 'agent',
    COORDINATOR = 'coordinator',
}

export enum ContactRoleType {
    LEAD = 'lead',
    TENANT = 'tenant',
    OWNER = 'owner',
    GUARANTOR = 'guarantor',
}

export enum LeadStatus {
    NEW = 'new',
    CONTACTED = 'contacted',
    QUALIFIED = 'qualified',
    DISCARDED = 'discarded',
    CONVERTED = 'converted',
}

export enum LeadTemperature {
    COLD = 'cold',
    WARM = 'warm',
    HOT = 'hot',
}

export enum OwnerType {
    PERSON = 'person',
    COMPANY = 'company',
}

export enum PropertyType {
    APARTMENT = 'apartment',
    HOUSE = 'house',
    STUDIO = 'studio',
    OFFICE = 'office',
    WAREHOUSE = 'warehouse',
    LAND = 'land',
    OTHER = 'other',
}

export enum PropertyCommercialStatus {
    AVAILABLE = 'available',
    RESERVED = 'reserved',
    RENTED = 'rented',
    INACTIVE = 'inactive',
}

export enum PropertyPublicationStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    HIDDEN = 'hidden',
}

export enum LocationPrecision {
    EXACT = 'exact',
    APPROXIMATE = 'approximate',
}

export enum OpportunityStatus {
    OPEN = 'open',
    WON = 'won',
    LOST = 'lost',
    PAUSED = 'paused',
}

export enum OpportunityPropertyStatus {
    SUGGESTED = 'suggested',
    SHARED = 'shared',
    DISCARDED = 'discarded',
    VISITED = 'visited',
    SELECTED = 'selected',
}

export enum ActivityType {
    CALL = 'call',
    NOTE = 'note',
    WHATSAPP = 'whatsapp',
    EMAIL = 'email',
    STAGE_CHANGE = 'stage_change',
    VISIT = 'visit',
    DOCUMENT_RECEIVED = 'document_received',
}

export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export enum TaskStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    DONE = 'done',
    CANCELLED = 'cancelled',
}

export enum VisitType {
    IN_PERSON = 'in_person',
    VIRTUAL = 'virtual',
}

export enum VisitStatus {
    PROPOSED = 'proposed',
    CONFIRMED = 'confirmed',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show',
}

export enum ApplicantRole {
    PRIMARY_TENANT = 'primary_tenant',
    CO_TENANT = 'co_tenant',
    GUARANTOR = 'guarantor',
}

export enum RentalApplicationStatus {
    STARTED = 'started',
    PENDING_DOCUMENTS = 'pending_documents',
    UNDER_REVIEW = 'under_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    WITHDRAWN = 'withdrawn',
}

export enum ChecklistItemStatus {
    PENDING = 'pending',
    RECEIVED = 'received',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
}

export enum EvaluationRecommendation {
    APPROVED = 'approved',
    APPROVED_WITH_CONDITIONS = 'approved_with_conditions',
    REJECTED = 'rejected',
}

export enum RentalContractStatus {
    DRAFT = 'draft',
    SIGNED = 'signed',
    ACTIVE = 'active',
    ENDED = 'ended',
    CANCELLED = 'cancelled',
}

export enum PropertyIncomeType {
    ARRIENDO = 'arriendo',
    VENTA = 'venta',
}

/** Categorías predefinidas de gasto por propiedad */
export enum PropertyExpenseCategory {
    MANTENIMIENTO = 'mantenimiento',
    IMPUESTO = 'impuesto',
    SERVICIO = 'servicio',
}
