import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Get the supported locales from environment variables
const locales = process.env.SUPPORTED_LOCALES?.split(',') || ['es-ES', 'en-US', 'es-CO'];
const defaultLocale = process.env.DEFAULT_LOCALE || 'es-ES';

// Rutas públicas (accesibles sin autenticación)
const publicRoutes = [
  '/login',
  '/register',
];

// Rutas que requieren autenticación
const authRoutes = [
  '/chat',
  '/profile'
];

// This function will be called for every request
export default async function middleware(request: NextRequest) {
  // Create the middleware
  const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always'
  });

  // Verificar si el usuario está autenticado
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  
  // Extraer la ruta actual (sin el locale)
  const pathname = request.nextUrl.pathname;
  const localePathnameRegex = new RegExp(`^/(${locales.join('|')})(/.*)$`);
  const match = pathname.match(localePathnameRegex);
  const pathWithoutLocale = match ? match[2] : pathname;

  // Determinar si la ruta actual requiere autenticación
  const isAuthRoute = authRoutes.some(route => 
    pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
  );

  // Determinar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some(route => 
    pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
  );

  // Check if the pathname is the root
  if (request.nextUrl.pathname === '/') {
    // Redirigir a login o chat según el estado de autenticación
    const redirectPath = isAuthenticated ? `/${defaultLocale}/chat` : `/${defaultLocale}/login`;
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Redirigir a login si la ruta requiere autenticación y el usuario no está autenticado
  if (isAuthRoute && !isAuthenticated) {
    const locale = match ? match[1] : defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Redirigir a chat si el usuario está autenticado e intenta acceder a login/register
  if (isPublicRoute && isAuthenticated) {
    const locale = match ? match[1] : defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/chat`, request.url));
  }

  // Apply the intl middleware for all other routes
  return intlMiddleware(request);
}

// Configure the middleware to match certain paths
export const config = {
  matcher: ['/', '/(es-ES|en-US|es-CO)/:path*']
};
