import status from "../status.json";

/**
 * Primary client endpoint for force-upgrade + maintenance.
 *
 * Cache headers are intentional:
 * - max-age=60: clients revalidate within a minute (maintenance flips stay fast)
 * - stale-while-revalidate=300: serve stale briefly while refreshing
 * - CDN-Cache-Control mirrors browser so Expo CDN also stays short-TTL
 * - CORS * so native + web wallet builds can fetch without a proxy
 *
 * Source of truth is status.json in this repo. Push → CI deploy → CDN busts.
 * Nothing sensitive ever belongs in this file.
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
