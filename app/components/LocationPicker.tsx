"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import Spinner from "./ui/Spinner";

export interface LatLng {
  lat: number;
  lng: number;
}

// The map is Leaflet on OpenStreetMap tiles: no API key, no billing. It is
// loaded from a CDN on demand (only the checkout page uses it) rather than
// installed as a dependency. The pin it produces is plain coordinates; the
// API turns them into a Google Maps link for whoever delivers the order.
const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
// Free OpenStreetMap search, used to jump the map to the typed address.
const SEARCH_URL = "https://photon.komoot.io/api/";
const VIETNAM_BBOX = "102.1,8.1,109.6,23.5";

// Where the map opens before anything is chosen: Phủ Lý, the school's town.
const DEFAULT_CENTER: LatLng = { lat: 20.5449, lng: 105.9122 };

const PIN_HTML =
  '<svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M17 41c7-9.5 15-16.2 15-24A15 15 0 1 0 2 17c0 7.8 8 14.5 15 24Z" fill="#319527" stroke="#fff" stroke-width="2"/>' +
  '<circle cx="17" cy="17" r="5.5" fill="#fff"/></svg>';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Leaflet = any;

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

/**
 * "Drop a pin where we should deliver": tap the map (or drag the pin) to set
 * the spot. Two shortcuts move the map for you - your current position, and
 * a search for the address typed above - but the pin is always the
 * customer's own choice and can be adjusted afterwards.
 */
export default function LocationPicker({
  value,
  onChange,
  address,
}: {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  /** The address typed in the form, for "find it on the map". */
  address: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet>(null);
  const markerRef = useRef<Leaflet>(null);
  const leafletRef = useRef<Leaflet>(null);
  // The latest onChange, so the map's own listeners (attached once) call it.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<"locate" | "search" | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  // Puts the pin at a spot (creating it the first time) and reports it.
  const placePin = (point: LatLng, moveMap: boolean) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (!markerRef.current) {
      const icon = L.divIcon({ html: PIN_HTML, className: "", iconSize: [34, 42], iconAnchor: [17, 41] });
      markerRef.current = L.marker([point.lat, point.lng], { icon, draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const at = markerRef.current.getLatLng();
        onChangeRef.current({ lat: at.lat, lng: at.lng });
      });
    } else {
      markerRef.current.setLatLng([point.lat, point.lng]);
    }

    setHint(null);
    if (moveMap) map.setView([point.lat, point.lng], Math.max(map.getZoom(), 16));
    onChangeRef.current(point);
  };

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        leafletRef.current = L;

        const start = value ?? DEFAULT_CENTER;
        const map = L.map(containerRef.current, {
          center: [start.lat, start.lng],
          zoom: value ? 16 : 14,
          // Our own credit line below: Leaflet's default one links out of the
          // shop, which the mobile app's WebView refuses to follow.
          attributionControl: false,
        });
        L.tileLayer(TILES, { maxZoom: 19 }).addTo(map);
        map.on("click", (e: any) => placePin({ lat: e.latlng.lat, lng: e.latlng.lng }, false));
        mapRef.current = map;

        if (value) placePin(value, false);
        setStatus("ready");
        // The page is still sliding in when the map is created; measure
        // again once it has settled, or the tiles come out misaligned.
        setTimeout(() => map.invalidateSize(), 600);
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // Built once per attempt; later changes go through placePin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setHint("Thiết bị không hỗ trợ định vị. Bạn chạm vào bản đồ để chọn vị trí nhé.");
      return;
    }
    setBusy("locate");
    setHint(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        placePin({ lat: position.coords.latitude, lng: position.coords.longitude }, true);
        setBusy(null);
      },
      () => {
        setHint("Không lấy được vị trí hiện tại. Bạn chạm vào bản đồ để chọn vị trí nhé.");
        setBusy(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async () => {
    const query = address.trim();
    if (!query) {
      setHint("Bạn nhập địa chỉ ở ô phía trên trước đã nhé.");
      return;
    }
    setBusy("search");
    setHint(null);
    try {
      const res = await fetch(
        `${SEARCH_URL}?q=${encodeURIComponent(query)}&limit=5&bbox=${VIETNAM_BBOX}`
      );
      const data = await res.json();
      const hit = (data?.features ?? []).find(
        (f: any) => f?.properties?.countrycode === "VN" && Array.isArray(f?.geometry?.coordinates)
      );
      if (!hit) {
        setHint("Không tìm thấy địa chỉ này trên bản đồ. Bạn chạm vào bản đồ để chọn vị trí nhé.");
        return;
      }
      const [lng, lat] = hit.geometry.coordinates;
      placePin({ lat, lng }, true);
      setHint("Đã đặt ghim gần địa chỉ bạn nhập - kéo ghim nếu chưa đúng chỗ.");
    } catch {
      setHint("Không tìm được lúc này. Bạn chạm vào bản đồ để chọn vị trí nhé.");
    } finally {
      setBusy(null);
    }
  };

  const toolBtn =
    "flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-surface px-3 text-xs font-semibold text-gray-700 transition duration-200 hover:border-primary-300 hover:bg-primary-50 hover:text-brand-strong active:scale-95 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        <button type="button" onClick={handleLocate} disabled={status !== "ready" || busy !== null} className={toolBtn}>
          {busy === "locate" ? <Spinner className="h-3.5 w-3.5" /> : <LocateFixed className="h-3.5 w-3.5" />}
          Vị trí của tôi
        </button>
        <button type="button" onClick={handleSearch} disabled={status !== "ready" || busy !== null} className={toolBtn}>
          {busy === "search" ? <Spinner className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
          Tìm theo địa chỉ đã nhập
        </button>
      </div>

      {/* `isolate`: Leaflet stacks its layers up to z-index 1000, which would
          otherwise climb over the sticky header. */}
      <div className="relative isolate h-64 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 sm:h-72">
        <div ref={containerRef} className="h-full w-full" />

        {status === "loading" && (
          <div className="absolute inset-0 z-[1001] flex items-center justify-center gap-2 bg-gray-100 text-xs text-gray-500">
            <Spinner className="h-4 w-4" />
            Đang tải bản đồ...
          </div>
        )}
        {status === "failed" && (
          <div className="absolute inset-0 z-[1001] flex flex-col items-center justify-center gap-2 bg-gray-100 px-4 text-center text-xs text-gray-500">
            Không tải được bản đồ. Kiểm tra kết nối mạng rồi thử lại.
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className={toolBtn}>
              Tải lại bản đồ
            </button>
          </div>
        )}
        {status === "ready" && (
          <span className="pointer-events-none absolute bottom-1 right-1 z-[1001] rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-600">
            © OpenStreetMap
          </span>
        )}
      </div>

      <p
        className={`mt-2 flex items-start gap-1.5 text-xs ${
          value ? "font-medium text-brand" : "text-gray-500"
        }`}
      >
        <MapPin className="mt-px h-3.5 w-3.5 shrink-0" />
        {hint ??
          (value
            ? "Đã chọn vị trí giao hàng. Kéo ghim hoặc chạm chỗ khác để đổi."
            : "Chạm vào bản đồ để đặt ghim đúng nơi nhận hàng.")}
      </p>
    </div>
  );
}
