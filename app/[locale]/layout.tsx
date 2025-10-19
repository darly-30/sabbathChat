import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import AuthProvider from '@/components/auth/AuthProvider';
 
export function generateStaticParams() {
  return [{ locale: 'es-ES' }, { locale: 'en-US' }, { locale: 'es-CO' }];
}

type LocaleLayoutProps = {
  children: ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  
  let messages;
  try {
    messages = (await import(`../../messages/${locale}/index.json`)).default;
  } catch (error) {
    notFound();
  }
 
  return (
    <AuthProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </AuthProvider>
  );
}
