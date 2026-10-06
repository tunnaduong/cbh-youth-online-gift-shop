// OpenStreetMap tiles, served from the shop's own domain - the fallback
// LocationPicker switches to when tile.openstreetmap.org can't be reached from
// the visitor's device (some ISPs' DNS doesn't resolve *.openstreetmap.org).
// Visitors who can reach OSM load the tiles from it directly and never come
// here. Fetched with the shop's own User-Agent, as OSM's tile policy asks of a
// proxy, and cached a week by Vercel to keep the load on OSM small.

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
