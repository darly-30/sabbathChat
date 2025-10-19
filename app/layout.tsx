import { Inter } from 'next/font/google';
import './globals.css';

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({ subsets: ['latin'] });

// Force dynamic rendering for the entire app to solve next-intl issues
export const dynamic = 'force-dynamic';

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'MiChat',
  description: 'Una aplicación de chat con integración a n8n',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/public/logo-migrupoja.ico" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
