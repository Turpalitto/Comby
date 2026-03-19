import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'local-ai-builder — create a web app using AI in minutes',
  description: 'Build complete, production-ready web apps from your description using AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="antialiased bg-[#0a0a0a] text-white font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
