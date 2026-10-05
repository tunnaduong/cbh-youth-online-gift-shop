// OpenStreetMap tiles, served from the shop's own domain.
//
// The map loaded its tiles straight from tile.openstreetmap.org, which works
// in a browser but showed an empty map (controls, no tiles) in the mobile
// app's WebView: OSM's tile servers refuse requests they can't attribute to
// a proper app, and an Android WebView marks every request with
// `X-Requested-With: <app package>`. Fetching them here sends one honest
// User-Agent instead, and Vercel's cache keeps the load on OSM small.

const UPSTREAM = "https://tile.openstreetmap.org";
const USER_AGENT = "CBHYouthGiftShop/1.0 (+https://giftshop.chuyenbienhoa.com)";
const MAX_ZOOM = 19;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z: zText, x: xText, y: yText } = await params;
  // Leaflet asks for /map-tiles/{z}/{x}/{y}.png.
  const z = Number(zText);
  const x = Number(xText);
  const y = Number(yText.replace(/\.png$/, ""));
  const size = 2 ** z;
  if (
    ![z, x, y].every(Number.isInteger) ||
    z < 0 ||
    z > MAX_ZOOM ||
    x < 0 ||
    y < 0 ||
    x >= size ||
    y >= size
  ) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const upstream = await fetch(`${UPSTREAM}/${z}/${x}/${y}.png`, {
      headers: { "User-Agent": USER_AGENT, Referer: "https://giftshop.chuyenbienhoa.com/" },
    });
    if (!upstream.ok) return new Response("Tile unavailable", { status: 502 });

    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "image/png",
        // A week in Vercel's cache, a day in the browser.
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("Tile unavailable", { status: 502 });
  }
}
