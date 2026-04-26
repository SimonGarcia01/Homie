import Link from 'next/link';

export default function HomePage() {
    return (
        <main className="app-shell">
            <section className="panel panel--medium stagger">
                <p className="kicker">Homie Frontend</p>
                <h1 className="title">Rental CRM, now with its own visual personality.</h1>
                <p className="subtitle">
                    This frontend connects to your NestJS backend auth endpoints. Start by logging in and then open the protected
                    profile page powered by <span className="code-inline">GET /api/auth/me</span>.
                </p>

                <div className="chip-row">
                    <span className="chip">JWT Login</span>
                    <span className="chip">Protected Route</span>
                    <span className="chip">Reusable UI Theme</span>
                </div>

                <div className="actions">
                    <Link href="/login" className="btn btn-primary">
                        Open Login
                    </Link>
                    <Link href="/me" className="btn btn-secondary">
                        Try Get Me
                    </Link>
                </div>

                <div className="footer-links">
                    <Link href="/login">Start with credentials</Link>
                    <Link href="/me">Direct profile endpoint view</Link>
                </div>
            </section>
        </main>
    );
}
