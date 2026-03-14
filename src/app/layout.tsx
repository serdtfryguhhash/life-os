import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppShell } from '@/components/layout/app-shell';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LifeOS - Your Personal Operating System',
  description:
    'A beautiful, full-featured personal productivity app. Manage your calendar, tasks, habits, goals, journal, finances, notes, and focus sessions - all in one place.',
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
