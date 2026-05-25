import { AssistantContextService } from './assistant-context.service';

describe('AssistantContextService', () => {
    const config = { get: (key: string, fallback: string) => (key === 'ASSISTANT_CONTEXT_TTL_MIN' ? '30' : fallback) };
    let service: AssistantContextService;

    beforeEach(() => {
        service = new AssistantContextService(config as never);
    });

    it('records properties from contar_propiedades enriched result', () => {
        service.record('org-1', 'user-1', 'sess-1', 'contar_propiedades', { tipo: 'casa' }, { tipo: 'casa' }, {
            count: 1,
            propiedades: [
                {
                    id: 'p1',
                    code: 'H-1',
                    title: 'Casa Providencia',
                    tipo: 'casa',
                    estadoComercial: 'disponible',
                    estadoPublicacion: 'publicada',
                    ciudad: 'Santiago',
                    pais: 'Chile',
                    direccion: null,
                    arriendoMensual: 800000,
                    moneda: 'CLP',
                    dormitorios: 3,
                    banos: 2,
                },
            ],
        });

        const block = service.buildContextBlock('org-1', 'user-1', 'sess-1');
        expect(block).toContain('Casa Providencia');
        expect(block).toContain('id="p1"');
    });

    it('returns null context block when cache is empty', () => {
        expect(service.buildContextBlock('org-1', 'user-1', 'sess-1')).toBeNull();
    });

    it('dedupes properties across tool calls', () => {
        const prop = {
            id: 'p1',
            code: 'H-1',
            title: 'Casa Providencia',
            tipo: 'casa',
            estadoComercial: 'disponible',
            estadoPublicacion: 'publicada',
            ciudad: 'Santiago',
            pais: 'Chile',
            direccion: null,
            arriendoMensual: 800000,
            moneda: 'CLP',
            dormitorios: 3,
            banos: 2,
        };

        service.record('org-1', 'user-1', 'sess-1', 'listar_propiedades', {}, {}, { items: [prop] });
        service.record('org-1', 'user-1', 'sess-1', 'obtener_propiedad', { id: 'p1' }, { id: 'p1' }, prop);

        const snapshot = service.get('org-1', 'user-1', 'sess-1');
        expect(snapshot?.recentProperties).toHaveLength(1);
    });
});
