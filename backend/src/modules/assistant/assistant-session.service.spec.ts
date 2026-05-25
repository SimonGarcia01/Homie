import { AssistantSessionService } from './assistant-session.service';

describe('AssistantSessionService', () => {
    const config = { get: (_key: string, fallback: string) => fallback };
    let service: AssistantSessionService;

    beforeEach(() => {
        service = new AssistantSessionService(config as never);
    });

    it('stores and retrieves thread with tool messages', () => {
        const sessionId = service.resolveSessionId();
        service.appendUserMessage(sessionId, 'org-1', 'user-1', '¿Cuántas disponibles?');
        service.replaceThread(sessionId, 'org-1', 'user-1', [
            { role: 'user', content: '¿Cuántas disponibles?' },
            {
                role: 'assistant',
                content: null,
                tool_calls: [
                    {
                        id: 'call_1',
                        type: 'function',
                        function: { name: 'contar_propiedades', arguments: '{}' },
                    },
                ],
            },
            { role: 'tool', tool_call_id: 'call_1', content: '{"count":1}' },
            { role: 'assistant', content: 'Tienes 1 propiedad disponible.' },
        ]);

        const session = service.get(sessionId, 'org-1', 'user-1');
        expect(session?.messages).toHaveLength(4);
        expect(session?.messages[2]).toMatchObject({ role: 'tool' });
    });

    it('rejects cross-user session access', () => {
        const sessionId = service.resolveSessionId();
        service.getOrCreate(sessionId, 'org-1', 'user-1');

        expect(() => service.get(sessionId, 'org-1', 'user-2')).toThrow();
    });
});
