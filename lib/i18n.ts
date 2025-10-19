// Based on next-intl documentation for Next.js 14
// This file sets up the internationalization support for our app

import { createSharedPathnamesNavigation } from 'next-intl/navigation';

// Define supported locales from env or use defaults
const locales = process.env.SUPPORTED_LOCALES?.split(',') || ['es-ES', 'en-US', 'es-CO'];
const defaultLocale = process.env.DEFAULT_LOCALE || 'es-ES';

// Create localized navigation helpers
export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation({ 
  locales,
  localePrefix: 'always'  // Always include locale in URL
});

// Export constants for use elsewhere
export const LOCALES = locales;
export const DEFAULT_LOCALE = defaultLocale;
