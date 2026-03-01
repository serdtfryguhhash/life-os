import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/sidebar';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LifeOS — Your Personal Operating System',
  description:
    'A beautiful, full-featured personal productivity app. Manage your calendar, tasks, habits, goals, journal, finances, notes, and focus sessions — all in one place.',
  keywords: ['productivity', 'life management', 'habits', 'tasks', 'journal'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <TooltipProvider delayDuration={200}>
          <Sidebar />
          {/* Main content — padded for desktop sidebar (72px collapsed) */}
          <main className="min-h-screen pl-0 pt-14 md:pl-[72px] md:pt-0">
            <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
