"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, ChevronRight, LocateFixed, MapPin, Search, X } from "lucide-react";
import Spinner from "./ui/Spinner";

export interface LatLng {
  lat: number;
  lng: number;
}

// The map is Leaflet on OpenStreetMap tiles: no API key, no billing. It is
// loaded on demand (only checkout and the chat's order slip use it) from the
// shop's own public/vendor/leaflet - a copy of Leaflet 1.9.4 - rather than
// from a CDN, so the map works wherever the shop itself loads (the mobile
// app's WebView included). The pin it produces is plain
// coordinates; the API turns them into a Google Maps link for whoever
// delivers the order.
const LEAFLET_JS = "/vendor/leaflet/leaflet.min.js";
const LEAFLET_CSS = "/vendor/leaflet/leaflet.min.css";
const TILE_HOST = "https://tile.openstreetmap.org";
// Free OpenStreetMap search, used to jump the map to an address.
const SEARCH_URL = "https://photon.komoot.io/api/";
const VIETNAM_BBOX = "102.1,8.1,109.6,23.5";

// Where the map opens when there is nothing to go on: Phủ Lý, the school's town.
const DEFAULT_CENTER: LatLng = { lat: 20.5449, lng: 105.9122 };

const PIN_SVG = (
  <svg width="38" height="47" viewBox="0 0 34 42" fill="none" aria-hidden>
    <path
      d="M17 41c7-9.5 15-16.2 15-24A15 15 0 1 0 2 17c0 7.8 8 14.5 15 24Z"
      fill="#319527"
      stroke="#fff"
      strokeWidth="2"
    />
    <circle cx="17" cy="17" r="5.5" fill="#fff" />
  </svg>
);

/* eslint-disable @typescript-eslint/no-explicit-any */
type Leaflet = any;

interface SearchHit {
  key: string;
  name: string;
  where: string;
  point: LatLng;
}

let leafletPromise: Promise<Leaflet> | null = null;

/** Adds Leaflet's script and stylesheet to the page once; resolves with `window.L`. */
function loadLeaflet(): Promise<Leaflet> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise<Leaflet>((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = LEAFLET_CSS;
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => (w.L ? resolve(w.L) : reject(new Error("Leaflet did not load")));
    script.onerror = () => reject(new Error("Leaflet did not load"));
    document.head.appendChild(script);
  }).catch((error) => {
    // Let a later attempt (the retry button) start over.
    leafletPromise = null;
    throw error;
  });

  return leafletPromise;
}

/** Places in Vietnam matching a typed address, best first. */
async function searchPlaces(query: string): Promise<SearchHit[]> {
  const res = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}&limit=6&bbox=${VIETNAM_BBOX}`);
  const data = await res.json();
  const hits: SearchHit[] = [];

  for (const feature of data?.features ?? []) {
    const p = feature?.properties ?? {};
    const coords = feature?.geometry?.coordinates;
    if (p.countrycode !== "VN" || !Array.isArray(coords)) continue;

    const street = [p.housenumber, p.street].filter(Boolean).join(" ");
    const parts = [street, p.locality, p.district, p.city, p.state].filter(Boolean);
    const where = parts.filter((part, i) => parts.indexOf(part) === i).join(", ");
    hits.push({
      key: `${p.osm_type ?? ""}${p.osm_id ?? hits.length}`,
      name: p.name || street || where || query,
      where,
      point: { lat: coords[1], lng: coords[0] },
    });
  }

  return hits;
}

/**
 * "Where exactly do we deliver?" - a required step next to the typed
 * address, on the checkout page and on an order slip in the chat.
 *
 * In the form it is one large button (or, once chosen, a small map preview
 * with "Đổi vị trí"). The choosing itself happens in a dialog that takes the
 * whole screen on a phone and a large window on a computer, because a map
 * squeezed into a form is hard to use: on a phone, dragging it fights with
 * scrolling the page. In the dialog the pin stays in the middle and the map
 * moves under it - drag, pinch or scroll to zoom, or tap/click a spot to
 * bring it to the pin - which needs no precise tapping. A search box and
 * "my location" get the map close first.
 */
export default function LocationPicker({
  value,
  onChange,
  address,
  suggested = null,
  compact = false,
}: {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  /** The address typed (or collected by the AI), used to start the map nearby. */
  address: string;
  /** A spot the API already found for that address, if any. */
  suggested?: LatLng | null;
  /** Smaller, for the chat's order slip. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {value ? (
        <div className="overflow-hidden rounded-xl border border-primary-300 bg-surface">
          <StaticPreview point={value} className={compact ? "h-24" : "h-36"} />
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
              <Check className="h-3 w-3" strokeWidth={3.5} />
            </span>
            <span className={`min-w-0 flex-1 font-medium text-brand ${compact ? "text-xs" : "text-[13px]"}`}>
              Đã ghim vị trí giao hàng
            </span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand transition-colors hover:bg-primary-50"
            >
              Đổi vị trí
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50 font-semibold text-brand-strong transition duration-200 hover:border-primary-400 active:scale-[0.99] ${
            compact ? "h-11 text-xs" : "h-14 text-sm"
          }`}
        >
          <MapPin className={compact ? "h-4 w-4" : "h-5 w-5"} />
          Chọn vị trí trên bản đồ
        </button>
      )}

      {open && (
        <MapDialog
          start={value ?? suggested}
          address={address}
          onClose={() => setOpen(false)}
          onConfirm={(point) => {
            onChange(point);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

/**
 * A still picture of the chosen spot: nine map tiles around it, shifted so
 * the point sits in the middle under a pin. Plain images - no second map to
 * load, and nothing to grab by accident while scrolling the form.
 */
function StaticPreview({ point, className }: { point: LatLng; className: string }) {
  const zoom = 16;
  const n = 2 ** zoom;
  const x = ((point.lng + 180) / 360) * n;
  const latRad = (point.lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  // Position of the point inside the 3x3 block, in pixels.
  const offsetX = (x - tileX + 1) * 256;
  const offsetY = (y - tileY + 1) * 256;

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <div
        className="absolute grid h-[768px] w-[768px] grid-cols-3"
        style={{ left: `calc(50% - ${offsetX}px)`, top: `calc(50% - ${offsetY}px)` }}
      >
        {[-1, 0, 1].flatMap((dy) =>
          [-1, 0, 1].map((dx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${dx}:${dy}`}
              src={`${TILE_HOST}/${zoom}/${tileX + dx}/${tileY + dy}.png`}
              alt=""
              width={256}
              height={256}
              loading="lazy"
              className="block h-64 w-64 max-w-none"
            />
          ))
        )}
      </div>
      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full drop-shadow-md">
        {PIN_SVG}
      </span>
      <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-600">
        © OpenStreetMap
      </span>
    </div>
  );
}

function MapDialog({
  start,
  address,
  onClose,
  onConfirm,
}: {
  start: LatLng | null;
  address: string;
  onClose: () => void;
  onConfirm: (point: LatLng) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState(address.trim());
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [busy, setBusy] = useState<"locate" | "search" | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const goTo = (point: LatLng, zoom = 17) => {
    const map = mapRef.current;
    if (map) map.setView([point.lat, point.lng], Math.max(map.getZoom(), zoom));
  };

  // The page behind must not scroll while the map is being dragged; Escape closes.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    setStatus("loading");

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const center = start ?? DEFAULT_CENTER;
        const map = L.map(containerRef.current, {
          center: [center.lat, center.lng],
          zoom: start ? 17 : 14,
          // Our own credit line: Leaflet's default one links out of the
          // shop, which the mobile app's WebView refuses to follow.
          attributionControl: false,
        });
        L.tileLayer(`${TILE_HOST}/{z}/{x}/{y}.png`, { maxZoom: 19 }).addTo(map);
        // A tap or click brings that spot under the pin.
        map.on("click", (e: any) => map.panTo(e.latlng));
        mapRef.current = map;
        setStatus("ready");
        // The dialog is still animating in when the map is created; measure
        // again once it has settled, or the tiles come out misaligned.
        setTimeout(() => map.invalidateSize(), 350);
        // And whenever the map's box changes size later (keyboard opening,
        // rotating the phone, the suggestion row appearing above it).
        if (typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() => map.invalidateSize());
          resizeObserver.observe(containerRef.current);
        }

        // Nothing chosen yet but an address is known: start the map there
        // instead of making the customer find their town first.
        if (!start && address.trim()) {
          searchPlaces(address.trim())
            .then((found) => {
              if (!cancelled && found[0] && mapRef.current) {
                mapRef.current.setView([found[0].point.lat, found[0].point.lng], 16);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Built once per attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = query.trim();
    if (!text || busy) return;
    setBusy("search");
    setHint(null);
    try {
      const found = await searchPlaces(text);
      setHits(found);
      if (found.length === 0) {
        setHint("Không tìm thấy trên bản đồ. Bạn kéo bản đồ tới đúng chỗ nhé.");
      } else {
        goTo(found[0].point, 16);
      }
    } catch {
      setHint("Không tìm được lúc này. Bạn kéo bản đồ tới đúng chỗ nhé.");
    } finally {
      setBusy(null);
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setHint("Thiết bị không hỗ trợ định vị.");
      return;
    }
    setBusy("locate");
    setHint(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        goTo({ lat: position.coords.latitude, lng: position.coords.longitude });
        setBusy(null);
      },
      () => {
        setHint("Không lấy được vị trí hiện tại. Bạn kéo bản đồ tới đúng chỗ nhé.");
        setBusy(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    onConfirm({ lat: center.lat, lng: center.lng });
  };

  // In <body>, above everything: the chat panel it may be opened from is a
  // small fixed box, and this needs the whole screen.
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div aria-hidden onClick={onClose} className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chọn vị trí giao hàng"
        // h-full, not 100dvh: phone WebViews that don't know the dvh unit drop
        // the rule, leaving the dialog only as tall as its content and the map
        // (the flexible part) zero pixels high - the app showed no map at all.
        className="relative flex h-full w-full animate-pop-in flex-col overflow-hidden bg-surface shadow-2xl sm:h-[min(720px,88vh)] sm:w-[min(920px,94vw)] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-gray-900">Chọn vị trí giao hàng</h2>
            <p className="truncate text-xs text-gray-500">Kéo bản đồ để ghim nằm đúng nơi nhận hàng</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 border-b border-gray-100 px-4 py-2.5">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm địa chỉ, tên trường, tên đường..."
              aria-label="Tìm địa chỉ trên bản đồ"
              className="h-10 w-full rounded-xl border border-gray-200 bg-surface pl-9 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <button
            type="submit"
            disabled={busy !== null || !query.trim()}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white transition duration-200 hover:bg-primary-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "search" && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            Tìm
          </button>
        </form>

        {/* Other places with the same name: one tap to jump to each. */}
        {hits && hits.length > 1 && (
          <ScrollRow>
            {hits.map((hit) => (
              <button
                key={hit.key}
                type="button"
                onClick={() => goTo(hit.point, 16)}
                className="max-w-[240px] shrink-0 rounded-lg bg-chip px-3 py-1.5 text-left select-none transition-colors hover:bg-primary-50"
              >
                <span className="block truncate text-xs font-semibold text-gray-900">{hit.name}</span>
                {hit.where && <span className="block truncate text-[11px] text-gray-500">{hit.where}</span>}
              </button>
            ))}
          </ScrollRow>
        )}

        {/* `isolate`: Leaflet stacks its own layers up to z-index 1000. */}
        <div className="relative isolate min-h-[240px] flex-1 bg-gray-100">
          <div ref={containerRef} className="h-full w-full" />

          {status === "ready" && (
            <>
              {/* The pin never moves: its tip marks the middle of the map. */}
              <span className="pointer-events-none absolute left-1/2 top-1/2 z-[1001] -translate-x-1/2 -translate-y-full drop-shadow-lg">
                {PIN_SVG}
              </span>
              <span className="pointer-events-none absolute left-1/2 top-1/2 z-[1000] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30" />

              <button
                type="button"
                onClick={handleLocate}
                disabled={busy !== null}
                aria-label="Vị trí của tôi"
                className="absolute bottom-4 right-4 z-[1001] flex h-11 items-center gap-2 rounded-full border border-card-border bg-surface px-4 text-xs font-semibold text-gray-800 shadow-lg transition duration-200 hover:bg-gray-50 active:scale-95 disabled:opacity-70"
              >
                {busy === "locate" ? <Spinner className="h-4 w-4" /> : <LocateFixed className="h-4 w-4 text-brand" />}
                Vị trí của tôi
              </button>
              <span className="pointer-events-none absolute bottom-1 left-1 z-[1001] rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-600">
                © OpenStreetMap
              </span>
            </>
          )}

          {status === "loading" && (
            <div className="absolute inset-0 z-[1001] flex items-center justify-center gap-2 text-sm text-gray-500">
              <Spinner className="h-5 w-5" />
              Đang tải bản đồ...
            </div>
          )}
          {status === "failed" && (
            <div className="absolute inset-0 z-[1001] flex flex-col items-center justify-center gap-3 px-6 text-center text-sm text-gray-500">
              Không tải được bản đồ. Kiểm tra kết nối mạng rồi thử lại.
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="rounded-xl border border-gray-200 bg-surface px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Tải lại bản đồ
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            {hint ?? "Phóng to để ghim thật chính xác: chụm hai ngón tay, hoặc lăn chuột trên máy tính."}
          </p>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={status !== "ready"}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-primary-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
            Xác nhận vị trí này
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * A single row of chips that scrolls sideways however the device does it:
 * swipe on a touch screen, and on a computer - where a hidden scrollbar
 * leaves nothing to grab - the mouse wheel, dragging the row, or the arrow
 * buttons that appear at whichever end has more.
 */
function ScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });
  // Mouse drag: where it started, and whether it moved far enough to count
  // as a drag rather than a click on a chip.
  const drag = useRef<{ startX: number; startScroll: number; moved: boolean } | null>(null);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setMore({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
    // Re-measured when the chips change.
  }, [children]);

  const scrollBy = (direction: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: direction * Math.max(200, el.clientWidth * 0.7), behavior: "smooth" });
  };

  const arrow =
    "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-card-border bg-surface text-gray-700 shadow-md transition duration-200 hover:bg-gray-50 active:scale-90";

  return (
    <div className="relative border-b border-gray-100">
      <div
        ref={ref}
        onScroll={update}
        // A vertical wheel scrolls the row sideways (a trackpad's own
        // sideways gesture already does).
        onWheel={(e) => {
          if (ref.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) ref.current.scrollLeft += e.deltaY;
        }}
        onPointerDown={(e) => {
          // Touch scrolls natively; this is for the mouse.
          if (e.pointerType !== "mouse" || !ref.current) return;
          drag.current = { startX: e.clientX, startScroll: ref.current.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || !ref.current) return;
          const dx = e.clientX - d.startX;
          if (Math.abs(dx) > 5) d.moved = true;
          if (d.moved) ref.current.scrollLeft = d.startScroll - dx;
        }}
        onPointerUp={() => {
          // Cleared after the click that follows, so that click can be dropped.
          const d = drag.current;
          setTimeout(() => {
            if (drag.current === d) drag.current = null;
          }, 0);
        }}
        onPointerLeave={() => {
          drag.current = null;
        }}
        // Letting go after dragging the row must not also press the chip
        // under the pointer.
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="scrollbar-hide flex cursor-grab touch-pan-x gap-2 overflow-x-auto overscroll-x-contain px-4 py-2 active:cursor-grabbing"
      >
        {children}
      </div>

      {more.left && (
        <>
          <span className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-surface to-transparent" />
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Xem gợi ý trước" className={`${arrow} left-1.5`}>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </>
      )}
      {more.right && (
        <>
          <span className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface to-transparent" />
          <button type="button" onClick={() => scrollBy(1)} aria-label="Xem gợi ý tiếp" className={`${arrow} right-1.5`}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
