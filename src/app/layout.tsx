import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

/// Inter, which is what the Figma design specifies and what
/// `AppTextStyles.fontFamily` is waiting to be pointed at once the app bundles
/// it. Loaded through next/font so it is self-hosted rather than fetched from
/// Google at render time.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Doctor Approvals',
  description: 'Administrator console for reviewing doctor registrations.',
  // Belt and braces with the X-Robots-Tag header in next.config.ts. A page
  // listing doctors' registration numbers has nothing a crawler should index.
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The console is a desktop tool; the palette is committed to light.
  colorScheme: 'light',
  themeColor: '#4a90d9',
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
