// These config options tell Next.js to fully disable static rendering
// and to always run dynamically (server-side)

// This applies to the entire application
export const dynamic = 'force-dynamic';

// Setting revalidate to 0 forces dynamic behavior
export const revalidate = 0;

// This also helps force dynamic behavior
export const fetchCache = 'force-no-store';
