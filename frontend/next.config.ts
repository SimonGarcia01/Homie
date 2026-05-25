import type { NextConfig } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Destino del API Nest para el proxy de desarrollo / producción local.
 * 1) BACKEND_ORIGIN en el entorno
 * 2) PORT leído de ../backend/.env (monorepo Homie)
 * 3) http://localhost:3001 (fallback)
 */
function resolveBackendOrigin(): string {
    const fromEnv = process.env.BACKEND_ORIGIN?.trim();
    if (fromEnv) {
        return fromEnv.replace(/\/+$/, '');
    }
    try {
        const envPath = path.join(projectRoot, '..', 'backend', '.env');
        const text = fs.readFileSync(envPath, 'utf8');
        const portMatch = text.match(/^\s*PORT\s*=\s*(\d+)\s*$/m);
        if (portMatch) {
            return `http://127.0.0.1:${portMatch[1]}`;
        }
    } catch {
        /* sin backend/.env */
    }
    return 'http://localhost:3001';
}

const backendOrigin = resolveBackendOrigin();

const nextConfig: NextConfig = {
    outputFileTracingRoot: projectRoot,
    // Allow opening dev from LAN / VPN IPs (e.g. 10.x, 192.168.x) without blocking requests.
    allowedDevOrigins: ['localhost', '127.0.0.1', '10.147.17.132', '192.168.1.5'],
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${backendOrigin}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
