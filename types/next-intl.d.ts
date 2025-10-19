// Este archivo corrige los errores de tipos para next-intl
// Especialmente útil cuando se usa next-intl con Next.js App Router

declare module 'next-intl' {
  import { ReactNode } from 'react';
  
  export function useTranslations(namespace?: string): (key: string, params?: Record<string, any>) => string;
  export function useLocale(): string;
  
  export interface NextIntlClientProviderProps {
    locale: string;
    messages: Record<string, any>;
    children: ReactNode;
    timeZone?: string;
    now?: Date;
  }
  
  export function NextIntlClientProvider(props: NextIntlClientProviderProps): JSX.Element;
}

declare module 'next-intl/server' {
  export function getRequestConfig(config: (options: { locale: string }) => Promise<{ messages: any }>): 
    (options: { locale: string }) => Promise<{ messages: any }>;
}

declare module 'next-intl/middleware' {
  import { NextRequest } from 'next/server';
  
  export interface MiddlewareConfig {
    locales: string[];
    defaultLocale: string;
    localePrefix?: 'always' | 'never' | 'as-needed';
  }
  
  export default function createMiddleware(config: MiddlewareConfig): 
    (request: NextRequest) => Promise<Response> | Response;
}

declare module 'next-intl/plugin' {
  export default function withNextIntl(): (nextConfig: any) => any;
}
