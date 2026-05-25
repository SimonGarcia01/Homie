import { NotFoundException } from '@nestjs/common';

import { PropertyCommercialStatus, PropertyType } from '../../../common/enums';
import { PropertiesService } from '../../properties/properties.service';
import { UsersService } from '../../users/users.service';
import { PropertyTools } from './property.tools';

describe('PropertyTools', () => {
    const orgId = 'org-1';
    const userId = 'user-1';
    const ctx = { userId, organizationId: orgId, role: 'agent', email: 'a@test.com', sessionId: 'sess-1' };

    let propertiesService: jest.Mocked<Pick<PropertiesService, 'search' | 'findSummary' | 'getStats'>>;
    let usersService: jest.Mocked<Pick<UsersService, 'findOne'>>;
    let tools: PropertyTools;

    beforeEach(() => {
        propertiesService = {
            search: jest.fn(),
            findSummary: jest.fn(),
            getStats: jest.fn(),
        };
        usersService = {
            findOne: jest.fn(),
        };
        tools = new PropertyTools(propertiesService as unknown as PropertiesService, usersService as unknown as UsersService);
    });

    it('contar_propiedades maps Spanish filters and sets countOnly', async () => {
        propertiesService.search
            .mockResolvedValueOnce({ count: 5 })
            .mockResolvedValueOnce({ count: 5, items: [], page: 1, limit: 3, totalPages: 1 });

        const result = await tools.execute(
            'contar_propiedades',
            { tipo: 'casa', estadoComercial: 'disponible', ciudad: 'Santiago' },
            ctx,
        );

        expect(result).toEqual({ count: 5 });
        expect(propertiesService.search).toHaveBeenCalledTimes(1);
        expect(propertiesService.search).toHaveBeenCalledWith(orgId, userId, {
            propertyType: PropertyType.HOUSE,
            commercialStatus: PropertyCommercialStatus.AVAILABLE,
            publicationStatus: undefined,
            city: 'Santiago',
            country: undefined,
            minRent: undefined,
            maxRent: undefined,
            q: undefined,
            assignedToMe: undefined,
            countOnly: true,
        });
    });

    it('contar_propiedades includes property detail when count is 3 or less', async () => {
        const items = [{ id: 'p1', title: 'Casa Test', code: 'C-1' }];
        propertiesService.search
            .mockResolvedValueOnce({ count: 1 })
            .mockResolvedValueOnce({ count: 1, items, page: 1, limit: 3, totalPages: 1 });

        const result = await tools.execute('contar_propiedades', { estadoComercial: 'disponible' }, ctx);

        expect(result).toEqual({
            count: 1,
            propiedades: items,
            nota: 'Se incluye detalle porque hay 3 o menos coincidencias.',
        });
        expect(propertiesService.search).toHaveBeenCalledTimes(2);
    });

    it('listar_propiedades caps limit at 20', async () => {
        propertiesService.search.mockResolvedValue({ count: 1, items: [], page: 1, limit: 20, totalPages: 1 });

        await tools.execute('listar_propiedades', { limite: 100, assignedToMe: true }, ctx);

        expect(propertiesService.search).toHaveBeenCalledWith(
            orgId,
            userId,
            expect.objectContaining({ limit: 20, assignedToMe: true, page: 1 }),
        );
    });

    it('obtener_propiedad returns summary by id', async () => {
        const summary = { id: 'p1', title: 'Test' };
        propertiesService.findSummary.mockResolvedValue(summary as never);

        const result = await tools.execute('obtener_propiedad', { id: 'p1' }, ctx);

        expect(result).toEqual(summary);
        expect(propertiesService.findSummary).toHaveBeenCalledWith('p1', orgId);
    });

    it('obtener_propiedad searches by codigo when id not found', async () => {
        propertiesService.findSummary.mockRejectedValue(new NotFoundException());
        propertiesService.search.mockResolvedValue({
            count: 1,
            items: [{ id: 'p2', code: 'X-1' }],
            page: 1,
            limit: 5,
            totalPages: 1,
        } as never);

        const result = await tools.execute('obtener_propiedad', { codigo: 'X-1' }, ctx);

        expect(propertiesService.search).toHaveBeenCalledWith(orgId, userId, expect.objectContaining({ q: 'X-1', limit: 5 }));
        expect(result).toEqual({ id: 'p2', code: 'X-1' });
    });

    it('contexto_usuario returns Spanish role label', async () => {
        usersService.findOne.mockResolvedValue({
            firstName: 'Ana',
            lastName: 'López',
        } as never);

        const result = await tools.execute('contexto_usuario', {}, ctx);

        expect(result).toEqual({
            nombre: 'Ana López',
            email: ctx.email,
            rol: 'agente',
            esAgente: true,
            organizationId: orgId,
        });
    });

    it('estadisticas_portafolio delegates to getStats', async () => {
        const stats = { total: 10 };
        propertiesService.getStats.mockResolvedValue(stats as never);

        const result = await tools.execute('estadisticas_portafolio', { assignedToMe: true }, ctx);

        expect(result).toEqual(stats);
        expect(propertiesService.getStats).toHaveBeenCalledWith(orgId, userId, { assignedToMe: true });
    });
});
