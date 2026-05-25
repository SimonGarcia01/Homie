import {
    commercialStatusToEs,
    parseCommercialStatus,
    parsePropertyType,
    parsePublicationStatus,
    propertyTypeToEs,
    toPropertySummaryEs,
} from './domain-labels';
import {
    PropertyCommercialStatus,
    PropertyPublicationStatus,
    PropertyType,
} from './enums';

describe('domain-labels', () => {
    it('maps property types to Spanish', () => {
        expect(propertyTypeToEs(PropertyType.HOUSE)).toBe('casa');
        expect(propertyTypeToEs(PropertyType.APARTMENT)).toBe('departamento');
    });

    it('parses Spanish and English property types', () => {
        expect(parsePropertyType('casa')).toBe(PropertyType.HOUSE);
        expect(parsePropertyType('house')).toBe(PropertyType.HOUSE);
        expect(parsePropertyType('departamento')).toBe(PropertyType.APARTMENT);
    });

    it('parses commercial status aliases', () => {
        expect(parseCommercialStatus('disponible')).toBe(PropertyCommercialStatus.AVAILABLE);
        expect(parseCommercialStatus('available')).toBe(PropertyCommercialStatus.AVAILABLE);
        expect(parseCommercialStatus('arrendada')).toBe(PropertyCommercialStatus.RENTED);
    });

    it('parses publication status aliases', () => {
        expect(parsePublicationStatus('publicada')).toBe(PropertyPublicationStatus.PUBLISHED);
        expect(parsePublicationStatus('borrador')).toBe(PropertyPublicationStatus.DRAFT);
    });

    it('builds Spanish property summary', () => {
        const summary = toPropertySummaryEs({
            id: 'p1',
            code: 'H-001',
            title: 'Casa Providencia',
            propertyType: PropertyType.HOUSE,
            commercialStatus: PropertyCommercialStatus.AVAILABLE,
            publicationStatus: PropertyPublicationStatus.PUBLISHED,
            location: { city: 'Santiago', country: 'Chile', address: 'Av. 1' },
            rentalDetail: { monthlyRent: '850000', currency: 'CLP' },
            feature: { bedrooms: 3, bathrooms: 2 },
        });

        expect(summary.tipo).toBe('casa');
        expect(summary.estadoComercial).toBe('disponible');
        expect(commercialStatusToEs(PropertyCommercialStatus.AVAILABLE)).toBe('disponible');
        expect(summary.arriendoMensual).toBe(850000);
        expect(summary.ciudad).toBe('Santiago');
    });
});
