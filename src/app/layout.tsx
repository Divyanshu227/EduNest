import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from '@/components/providers';
import { APP_NAME } from '@/lib/constants';

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body'
});

const headingFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading'
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} | Premium 1-to-1 Online Tuition for Classes VI to X`,
    template: `%s · ${APP_NAME}`
  },
  description: 'EduNest provides personalized 1-to-1 online tuition classes exclusively for students of Classes VI to X. Learn better and score higher with expert educators.',
  keywords: ['EduNest', 'Edu Nest', 'online tuition', '1-to-1 tuition', 'Classes VI to X', 'personalized tutoring', 'CBSE online tuition', 'ICSE online tuition', 'best online classes', 'home tuition'],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: `${APP_NAME} | Premium 1-to-1 Online Tuition`,
    description: 'EduNest provides personalized 1-to-1 online tuition classes exclusively for students of Classes VI to X. Learn better and score higher.',
    siteName: APP_NAME,
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} | Premium 1-to-1 Online Tuition`,
    description: 'Personalized 1-to-1 online tuition classes exclusively for students of Classes VI to X.',
    creator: '@EduNest',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  }
};

export const viewport = {
  themeColor: '#0f172a'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${headingFont.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}