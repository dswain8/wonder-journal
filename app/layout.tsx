import type { Metadata } from 'next';
import { Caveat, DM_Serif_Display, Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

const display = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
});

export const metadata: Metadata = {
  title: 'Wonder Journal',
  description: 'A gentle place for little questions and the stories they deserve.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${display.variable} ${caveat.variable} min-h-screen font-sans text-[var(--wj-ivory)]`}
      >
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(243,192,86,0.14),transparent_26%),linear-gradient(180deg,#1f1640_0%,#120f29_42%,#0f0d22_100%)]" />
          <div className="absolute right-[-3rem] top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,#ffe9b8_0%,#e8b77a_65%,transparent_72%)] opacity-45 blur-sm" />
          <div className="absolute left-[-6rem] top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(91,42,107,0.48),transparent_70%)]" />
          <div className="absolute bottom-[-8rem] right-[-5rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(31,107,107,0.18),transparent_72%)]" />
        </div>
        <main className="relative min-h-screen px-4 py-5 sm:py-6">{children}</main>
      </body>
    </html>
  );
}
