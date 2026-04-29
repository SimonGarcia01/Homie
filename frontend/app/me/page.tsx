'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthUser, getMe, logout } from '../lib/auth';

export default function MePage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function loadProfile() {
            const response = await getMe();

            if (!isMounted) {
                return;
            }

            if ('error' in response) {
                setError(response.error);
                setIsLoading(false);

                if (response.status === 401) {
                    logout();
                    router.replace('/login');
                }
                return;
            }

            setUser(response);
            setIsLoading(false);
        }

        void loadProfile();

        return () => {
            isMounted = false;
        };
    }, [router]);

    function handleLogout() {
        logout();
        router.push('/login');
    }

    return (
        <main className="app-shell">
            <section className="panel panel--medium stagger">
                <div className="top-row">
                    <div>
                        <p className="kicker">Authenticated View</p>
                        <h1 className="title">Get Me</h1>
                    </div>
                    <button type="button" onClick={handleLogout} className="btn btn-ghost">
                        Logout
                    </button>
                </div>

                <p className="subtitle">
                    This screen shows data from <span className="code-inline">GET /api/auth/me</span> using the saved
                    access token.
                </p>

                {isLoading && <p className="alert alert-info">Loading profile...</p>}

                {!isLoading && error && <p className="alert alert-error">{error}</p>}

                {!isLoading && user && (
                    <div className="profile-grid">
                        <article className="profile-item">
                            <span className="profile-label">ID</span>
                            <span className="profile-value">{user.id}</span>
                        </article>
                        <article className="profile-item">
                            <span className="profile-label">Email</span>
                            <span className="profile-value">{user.email}</span>
                        </article>
                        <article className="profile-item">
                            <span className="profile-label">Role</span>
                            <span className="profile-value">{user.role}</span>
                        </article>
                        <article className="profile-item">
                            <span className="profile-label">Organization</span>
                            <span className="profile-value">{user.organizationId}</span>
                        </article>
                    </div>
                )}

                <div className="footer-links">
                    <Link href="/">Back home</Link>
                    <Link href="/login">Back to login</Link>
                </div>
            </section>
        </main>
    );
}
