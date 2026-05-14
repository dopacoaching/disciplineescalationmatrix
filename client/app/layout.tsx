import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Discipline Escalation Matrix',
  description: 'Discipline escalation management system',
  manifest: '/manifest.json',
  appleWebApp: {
    statusBarStyle: 'default',
    title: 'DEM',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: '/icons/icon-512.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a365d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
