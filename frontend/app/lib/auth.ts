const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ?? '';
const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';

type ApiError = {
    error: string;
    status?: number;
};

export type AuthUser = {
    id: string;
    email: string;
    organizationId: string;
    role: string;
};

export type LoginUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    role: string;
};

type LoginSuccess = {
    accessToken: string;
    user: LoginUser;
};

export type LoginResponse = LoginSuccess | ApiError;
export type MeResponse = AuthUser | ApiError;

function buildApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (!API_BASE_URL) {
        return normalizedPath;
    }

    return `${API_BASE_URL}${normalizedPath}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

async function parseErrorResponse(res: Response): Promise<string> {
    const text = await res.text();
    if (!text) {
        return res.statusText || 'Request failed';
    }

    try {
        const parsed = JSON.parse(text) as unknown;
        if (isObject(parsed) && typeof parsed.message === 'string') {
            return parsed.message;
        }

        if (
            isObject(parsed) &&
            Array.isArray(parsed.message) &&
            parsed.message.every((item) => typeof item === 'string')
        ) {
            return parsed.message.join(', ');
        }

        return text;
    } catch {
        return text;
    }
}

function isLoginPayload(value: unknown): value is LoginSuccess {
    if (!isObject(value)) {
        return false;
    }

    if (typeof value.accessToken !== 'string') {
        return false;
    }

    if (!isObject(value.user)) {
        return false;
    }

    return (
        typeof value.user.id === 'string' &&
        typeof value.user.email === 'string' &&
        typeof value.user.firstName === 'string' &&
        typeof value.user.lastName === 'string' &&
        typeof value.user.organizationId === 'string' &&
        typeof value.user.role === 'string'
    );
}

function isMePayload(value: unknown): value is AuthUser {
    if (!isObject(value)) {
        return false;
    }

    return (
        typeof value.id === 'string' &&
        typeof value.email === 'string' &&
        typeof value.organizationId === 'string' &&
        typeof value.role === 'string'
    );
}

export function saveAccessToken(token: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function getAccessToken(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function logout(): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getAuthHeader(): Record<string, string> {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        return { error: await parseErrorResponse(res), status: res.status };
    }

    const payload = (await res.json()) as unknown;

    if (!isLoginPayload(payload)) {
        return { error: 'Invalid response from server', status: 500 };
    }

    saveAccessToken(payload.accessToken);
    return payload;
}

export async function getMe(): Promise<MeResponse> {
    const token = getAccessToken();
    if (!token) {
        return { error: 'Missing access token', status: 401 };
    }

    const res = await fetch(buildApiUrl('/api/auth/me'), {
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    });

    if (!res.ok) {
        return { error: await parseErrorResponse(res), status: res.status };
    }

    const payload = (await res.json()) as unknown;
    if (!isMePayload(payload)) {
        return { error: 'Invalid user response from server', status: 500 };
    }

    return payload;
}
