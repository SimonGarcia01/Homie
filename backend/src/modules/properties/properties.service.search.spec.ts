import { PropertyCommercialStatus, PropertyType } from '../../common/enums';
import { PropertiesService } from './properties.service';

describe('PropertiesService search scoping', () => {
    const mockProperty = {
        id: 'p1',
        code: 'C-1',
        title: 'Casa Test',
        propertyType: PropertyType.HOUSE,
        commercialStatus: PropertyCommercialStatus.AVAILABLE,
        publicationStatus: 'published' as const,
        location: { city: 'Santiago', country: 'Chile', address: null },
        rentalDetail: { monthlyRent: '500000', currency: 'CLP' },
        feature: { bedrooms: 2, bathrooms: 1 },
    };

    function createQueryBuilderMock() {
        const qb: Record<string, jest.Mock> = {};
        qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
        qb.where = jest.fn().mockReturnValue(qb);
        qb.andWhere = jest.fn().mockReturnValue(qb);
        qb.innerJoin = jest.fn().mockReturnValue(qb);
        qb.orderBy = jest.fn().mockReturnValue(qb);
        qb.skip = jest.fn().mockReturnValue(qb);
        qb.take = jest.fn().mockReturnValue(qb);
        qb.select = jest.fn().mockReturnValue(qb);
        qb.addSelect = jest.fn().mockReturnValue(qb);
        qb.groupBy = jest.fn().mockReturnValue(qb);
        qb.limit = jest.fn().mockReturnValue(qb);
        qb.getCount = jest.fn().mockResolvedValue(3);
        qb.getManyAndCount = jest.fn().mockResolvedValue([[mockProperty], 1]);
        qb.getRawMany = jest.fn().mockResolvedValue([]);
        return qb;
    }

    let service: PropertiesService;
    let qb: ReturnType<typeof createQueryBuilderMock>;

    beforeEach(() => {
        qb = createQueryBuilderMock();
        const repository = {
            createQueryBuilder: jest.fn().mockReturnValue(qb),
            findOne: jest.fn(),
        };
        service = new PropertiesService(
            repository as never,
            {} as never,
            {} as never,
            { transaction: jest.fn() } as never,
        );
    });

    it('search countOnly returns count scoped to organization', async () => {
        const result = await service.search('org-abc', 'user-1', {
            propertyType: PropertyType.HOUSE,
            countOnly: true,
        });

        expect(result).toEqual({ count: 3 });
        expect(qb.where).toHaveBeenCalledWith('property.organizationId = :organizationId', {
            organizationId: 'org-abc',
        });
        expect(qb.andWhere).toHaveBeenCalledWith('property.propertyType = :propertyType', {
            propertyType: PropertyType.HOUSE,
        });
    });

    it('search with assignedToMe joins property_agents', async () => {
        await service.search('org-abc', 'user-99', { assignedToMe: true, countOnly: true });

        expect(qb.innerJoin).toHaveBeenCalledWith(
            'property_agents',
            'pa',
            'pa.property_id = property.id AND pa.user_id = :userId',
            { userId: 'user-99' },
        );
    });

    it('search with assignedToMe and no userId returns zero matches', async () => {
        qb.getCount.mockResolvedValue(0);

        await service.search('org-abc', undefined, { assignedToMe: true, countOnly: true });

        expect(qb.andWhere).toHaveBeenCalledWith('1 = 0');
    });

    it('search returns Spanish summary items', async () => {
        const result = await service.search('org-abc', undefined, { limit: 10, page: 1 });

        expect(result).toMatchObject({
            count: 1,
            items: [expect.objectContaining({ tipo: 'casa', estadoComercial: 'disponible' })],
        });
    });
});
