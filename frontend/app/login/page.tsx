'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { getAccessToken, login } from '../lib/auth';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('admin@boho.test');
    const [password, setPassword] = useState('Admin1234!');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (getAccessToken()) {
            router.replace('/me');
        }
    }, [router]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const response = await login(email, password);

        if ('error' in response) {
            setError(response.error);
            setIsSubmitting(false);
            return;
        }

        router.push('/me');
    }

    return (
        <main className="app-shell">
            <section className="panel panel--narrow stagger">
                <p className="kicker">Account Access</p>
                <h1 className="title">Sign in to Homie CRM</h1>
                <p className="subtitle">Remember to never give out your credentials!</p>

                <div className="info-callout">
                    Demo account: <span className="code-inline">admin@boho.test</span>
                </div>

                <form className="stack stack-lg" onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="email" className="field-label">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            autoComplete="email"
                            required
                            className="field-input"
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="password" className="field-label">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            required
                            className="field-input"
                        />
                    </div>

                    {error && <p className="alert alert-error">{error}</p>}

                    <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="footer-links">
                    <Link href="/">Back home</Link>
                    <Link href="/me">Go to Get Me</Link>
                </div>
            </section>
        </main>
    );
}
