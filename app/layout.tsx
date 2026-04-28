import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';
import { AlertProvider } from '@/context/AlertContext';
import AlertBanner from '@/components/AlertBanner';

export const metadata: Metadata = {
  title: "CrisisQR 2.0 | Enterprise Disaster Response",
  description: "Minimalist, high-performance disaster response platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-primary antialiased font-sans">
        <AlertProvider>
          <AlertBanner />
          <div className="min-h-screen flex flex-col p-4 md:p-8 lg:p-12 gap-8">
            <header className="flex justify-between items-center border-b-2 border-border pb-6">
              <Link href="/">
                <h1 className="text-4xl font-black uppercase tracking-tighter hover:text-status-critical transition-colors cursor-pointer">
                  CrisisQR 2.0
                </h1>
              </Link>
              <nav className="flex gap-6 font-bold uppercase text-sm tracking-widest">
                <Link href="/citizen/dashboard" className="hover:underline underline-offset-8">Citizen</Link>
                <Link href="/rescue/dashboard" className="hover:underline underline-offset-8">Rescue</Link>
                <Link href="/admin/control-room" className="hover:underline underline-offset-8">Gov</Link>
              </nav>
            </header>
            <main className="flex-grow flex flex-col">
              {children}
            </main>
            <footer className="border-t-2 border-border pt-6 text-xs font-mono text-muted-foreground flex justify-between">
              <div>© 2026 CrisisQR Global Enterprise v2.0.4</div>
              <div className="uppercase">Light Mode Protocol: Active</div>
            </footer>
          </div>
        </AlertProvider>
      </body>
    </html>
  );
}
