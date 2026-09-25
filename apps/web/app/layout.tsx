import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'ai-job-matching-engine — Full Stack AI Platform',
  description: 'AI-powered job matching engine with Turso DB vector search, Fastify OpenTelemetry, and Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-gray-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10 max-w-7xl mx-auto w-full">
              {children}
            </main>
            <footer className="border-t border-border/60 py-6 text-center text-xs text-gray-500">
              ai-job-matching-engine • Local Apple Silicon M3 AI Pipeline • Turso DB libSQL • Fastify OTel Tracing
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
