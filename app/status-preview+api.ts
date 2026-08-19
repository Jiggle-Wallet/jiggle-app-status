import status from "../status.preview.json";

/**
 * Preview / sandbox client endpoint for force-upgrade + maintenance.
 *
 * Production clients must keep using GET /status (status.json).
 * Preview Jiggle-V3 builds (EAS profile `preview`) point here so testers can
 * raise minimumVersions or flip maintenance without affecting production.
 *
 * Cache / CORS headers match GET /status on purpose.
 */
export async function GET(): Promise<Response> {
  const body = JSON.stringify(status);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "CDN-Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
