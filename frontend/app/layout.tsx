import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';
import './globals.css';

const displayFont = Sora({
    variable: '--font-display',
    subsets: ['latin'],
    weight: ['500', '600', '700'],
});

const bodyFont = Manrope({
    variable: '--font-body',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
    title: 'Homie CRM Portal',
    description: 'Login and authenticated account views for Homie Rental CRM',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
            <body>{children}</body>
        </html>
    );
}
