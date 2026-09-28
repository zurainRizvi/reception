import type { Metadata, Viewport } from 'next';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700-italic.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';
import './globals.css';
import './foliage.css';
import { wedding } from '@/config/wedding';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: wedding.social.title,
  description: wedding.social.description,
  robots: { index: false, follow: false },
  openGraph: {
    title: wedding.social.title,
    description: wedding.social.description,
    images: [wedding.social.image],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: wedding.social.themeColor,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
