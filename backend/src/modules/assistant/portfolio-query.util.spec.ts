import {
    buildVerifiedPortfolioBlock,
    isPortfolioCountQuery,
    wantsAssignedPropertiesOnly,
} from './portfolio-query.util';

describe('portfolio-query.util', () => {
    it('detects count questions', () => {
        expect(isPortfolioCountQuery('¿Cuántas propiedades tengo?')).toBe(true);
        expect(isPortfolioCountQuery('Cuantas propiedades tengo')).toBe(true);
        expect(isPortfolioCountQuery('si?')).toBe(false);
    });

    it('does not treat general count as assigned-only', () => {
        expect(wantsAssignedPropertiesOnly('¿Cuántas propiedades tengo?')).toBe(false);
        expect(wantsAssignedPropertiesOnly('mis propiedades asignadas')).toBe(true);
    });

    it('builds verified block', () => {
        const block = buildVerifiedPortfolioBlock({ total: 1 }, { count: 1 });
        expect(block).toContain('DATOS VERIFICADOS');
        expect(block).toContain('"count":1');
    });
});
