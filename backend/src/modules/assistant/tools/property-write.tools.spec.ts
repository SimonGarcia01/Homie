import { PropertyCommercialStatus, PropertyType } from '../../../common/enums';
import { AssistantDraftService } from '../assistant-draft.service';
import { PropertiesService } from '../../properties/properties.service';
import { OwnersService } from '../../owners/owners.service';
import { PropertyWriteTools } from './property-write.tools';

describe('PropertyWriteTools', () => {
    const orgId = 'org-1';
    const userId = 'user-1';
    const sessionId = 'sess-1';
    const ctx = { userId, organizationId: orgId, role: 'agent', email: 'a@test.com', sessionId };

    let propertiesService: jest.Mocked<Pick<PropertiesService, 'create'>>;
    let ownersService: jest.Mocked<Pick<OwnersService, 'search' | 'findOne' | 'create'>>;
    let draftService: AssistantDraftService;
    let tools: PropertyWriteTools;

    beforeEach(() => {
        propertiesService = { create: jest.fn() };
        ownersService = { search: jest.fn(), findOne: jest.fn(), create: jest.fn() };
        draftService = new AssistantDraftService({ get: () => '30' } as never);
        tools = new PropertyWriteTools(
            propertiesService as unknown as PropertiesService,
            ownersService as unknown as OwnersService,
            draftService,
        );
    });

    it('preparar_propiedad stores draft and returns preview', async () => {
        ownersService.search.mockResolvedValue([
            { id: 'owner-1', label: 'María González', contactId: 'c1', email: null, phone: null, ownerType: 'person' as never, firstName: 'María', lastName: 'González' },
        ]);

        const result = await tools.execute(
            'preparar_propiedad',
            {
                titulo: 'Depto Providencia',
                tipo: 'departamento',
                propietarioNombre: 'María González',
                arriendoMensual: 850000,
                ciudad: 'Providencia',
            },
            ctx,
        );

        expect(result).toMatchObject({
            listo: true,
            requiereConfirmacion: true,
            vistaPrevia: expect.objectContaining({
                titulo: 'Depto Providencia',
                propietario: 'María González',
                arriendoMensual: 850000,
            }),
        });

        const draft = draftService.get(orgId, userId, sessionId);
        expect(draft?.dto.ownerId).toBe('owner-1');
        expect(draft?.dto.propertyType).toBe(PropertyType.APARTMENT);
    });

    it('confirmar_crear_propiedad requires explicit confirmation', async () => {
        const result = await tools.execute('confirmar_crear_propiedad', { confirmacion: false }, ctx);
        expect(result).toMatchObject({ error: expect.stringContaining('confirmar') });
    });

    it('confirmar_crear_propiedad creates property from draft', async () => {
        ownersService.search.mockResolvedValue([
            { id: 'owner-1', label: 'María González', contactId: 'c1', email: null, phone: null, ownerType: 'person' as never, firstName: 'María', lastName: 'González' },
        ]);

        await tools.execute(
            'preparar_propiedad',
            {
                titulo: 'Casa Test',
                tipo: 'casa',
                propietarioNombre: 'María',
                arriendoMensual: 500000,
                ciudad: 'Santiago',
            },
            ctx,
        );

        propertiesService.create.mockResolvedValue({
            id: 'prop-1',
            code: 'HOM-TEST',
            title: 'Casa Test',
            propertyType: PropertyType.HOUSE,
            commercialStatus: PropertyCommercialStatus.AVAILABLE,
            publicationStatus: 'draft' as never,
            location: { city: 'Santiago', country: 'Chile', address: null },
            rentalDetail: { monthlyRent: '500000', currency: 'CLP' },
            feature: { bedrooms: 0, bathrooms: 0 },
        } as never);

        const result = await tools.execute('confirmar_crear_propiedad', { confirmacion: true }, ctx);

        expect(propertiesService.create).toHaveBeenCalled();
        expect(result).toMatchObject({ exito: true, propiedad: expect.objectContaining({ title: 'Casa Test' }) });
        expect(draftService.get(orgId, userId, sessionId)).toBeNull();
    });

    it('buscar_propietario delegates to owners search', async () => {
        ownersService.search.mockResolvedValue([
            { id: 'o1', label: 'Juan Pérez', contactId: 'c1', email: 'j@t.com', phone: null, ownerType: 'person' as never, firstName: 'Juan', lastName: 'Pérez' },
        ]);

        const result = await tools.execute('buscar_propietario', { busqueda: 'Juan' }, ctx);

        expect(result).toMatchObject({ total: 1, propietarios: [{ id: 'o1', nombre: 'Juan Pérez' }] });
    });
});
