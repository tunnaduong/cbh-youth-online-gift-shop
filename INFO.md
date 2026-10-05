# INFO — cbh-youth-online-gift-shop

> **For AI agents.** Project map for agents working in this repo: how it connects to the sibling repos, features, structure, setup, conventions and recent work. Humans: see `README.md`. Keep this file current - add to **Recent work** and update other sections whenever you change the repo.

- **Default branch: `main`** - work, commit and push there unless the user names another branch.
- **Find code via this file first**: check the project structure / features sections below before grepping the repo by hand.

The **CBH Youth Online gift shop**, served at **https://giftshop.chuyenbienhoa.com**. It sells school merchandise to members of the CBH Youth Online student forum (Trường THPT Chuyên Biên Hòa). The UI is in Vietnamese.

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 and `lucide-react` icons. There's no state library: everything uses React contexts. No UI or animation library either: the look copies the main site's design tokens by hand and all motion is CSS (see Conventions).
- **⚠️ Read [AGENTS.md](AGENTS.md) before writing code.** This Next.js version has breaking changes compared with older versions. The bundled docs are in `node_modules/next/dist/docs/`. `CLAUDE.md` just includes `AGENTS.md`.

---

## 1. How it fits with the other CBH repos

| Repo | What it is |
|---|---|
| `cbh-youth-online-api` | Laravel backend (`https://api.chuyenbienhoa.com`). It owns accounts, the shop catalog, orders, payments and chat. **This shop has no backend of its own.** |
| `cbh-youth-online-next-js` | The main forum site (`www.chuyenbienhoa.com`). It has the only login page. |
| `cbh-youth-online-mobile` | The Expo / React Native app. Its sidebar opens this shop in a WebView. |
| **this repo** | Shop front-end only. |

### Auth: there is no login form here
- **Shared cookie:** the main site sets an `auth_token` cookie (a Sanctum bearer token) on `domain=.chuyenbienhoa.com`. This shop reads it in `app/lib/auth.ts → getAuthToken()` and sends it as `Authorization: Bearer …` to the API.
- **Logging in:** `getLoginUrl()` sends logged-out users to `${NEXT_PUBLIC_SITE_URL}/login?continue=<current url>`.
- **Logging out:** `clearAuthToken()` expires the shared cookie, which also logs the user out of the main site. It's only called when the user presses "Đăng xuất".
- **Refreshing state:** `AuthContext` loads `/v1.0/user` and re-checks whenever the tab regains focus. It treats only a 401/403 as logged out.

### Handoff from the mobile app (`/auth/set-token`)
- **In-app browser:** this is SFSafariViewController or Chrome Custom Tabs, and the app can't write cookies into it. So the app gets a single-use code from `POST /v1.0/web-session/handoff`, which expires after 60 seconds. It then opens `/auth/set-token?code=…&return=/path`.
- **What the page does:** `app/auth/set-token/page.tsx` sends `POST /v1.0/web-session/redeem` with plain `fetch`, receives a separate `web-handoff` token, and writes the shared cookie with `setAuthToken()`. It then does a full reload to `return`, which is limited to same-site paths to prevent open redirects.
- **Matching code elsewhere:** the main site has its own `/auth/set-token`. The mobile side is in `app/utils/webSession.js`.

### App mode (`?app=true`): running inside the mobile app's WebView
- **How the app opens the shop:** the mobile app's `WebAppScreen` loads `https://giftshop.chuyenbienhoa.com/?app=true`.
- **Login:** the WebView has its own web session: the app opens `/auth/set-token?code=…` once per app login (a new code after an account switch) and `/auth/set-token?logout=1` when the app has no account. Its user agent ends in `CBHYouthApp/<version>`.
- **Before every page load**, the app injects a script that:
  - sets `sessionStorage.cbh_app_mode = "1"`;
  - writes the app's theme (`"light"` or `"dark"`) to `localStorage.giftshop_theme`.
- **Domain lock:** the WebView only stays on `giftshop.chuyenbienhoa.com`. Any link to another site is cancelled, and the app shows a "Về trang chủ cửa hàng" (back to shop home) page. **Don't add flows that leave this domain**, such as payment redirects or external auth. They won't work inside the app.
- **What app mode changes:** `app/lib/appMode.ts → useAppMode()` returns true when `?app=true` is in the URL or the sessionStorage flag is set. It's false on the server and on the first render, so hydration stays safe. In app mode:
  - `Header.tsx` shows the avatar and name without linking to the main-site profile, and hides the "Đăng nhập" (log in) link;
  - `SettingsMenu.tsx` hides "Đăng xuất";
  - `PromoBanner.tsx` replaces the "Xác minh ngay" link to `chuyenbienhoa.com/settings` with a note to verify in the app's Settings.

---

## 2. Features

| Feature | Where |
|---|---|
| **Members-only home:** hero, category bar, featured products, sidebar with mini cart, promo and trust badges | `app/page.tsx`, `HomeGate.tsx`, `HeroBanner.tsx`, `CategoryBar.tsx`, `FeaturedProducts.tsx`, `components/sidebar/*` |
| **Product listing** with search (`?search=`) and category filter | `app/products/` (`ProductsContent.tsx`), `CatalogContext.tsx` |
| **Product detail** with option/variant picking (for example a Size option), stock, and a "contact shop" button that opens support chat | `app/product/[id]/page.tsx` |
| **Cart,** kept in `localStorage.giftshop_cart` and, when signed in, synced with the account (`GET`/`PUT /v1.0/shop/cart`) so it follows the user across devices | `app/cart/page.tsx`, `CartContext.tsx`, `CartLineItem.tsx` |
| **Checkout:** a typed address plus a **required pin on a map** (`LocationPicker.tsx`, Leaflet + OpenStreetMap, no key), a digits-only phone, 15,000đ shipping and three payment methods.<br>• **Points** (`vndToPoints`: 1,000đ = 10 points), deducted on the server.<br>• **QR bank transfer** (SePay): an in-page QR code with payment status polling. Each attempt is a new order with a fresh code.<br>• **COD** | `app/checkout/page.tsx`, `PaymentMethodSelector.tsx`, `lib/shop.ts` |
| **My orders:** status and payment badges, cancelling any order that isn't out for delivery yet (points come back at once, a transfer is refunded by the shop) | `app/orders/page.tsx` |
| **Student discount:** a percentage for verified students from `/v1.0/student-verification/status`, shown as a struck-through original price | `StudentDiscountContext.tsx`, `Price.tsx` |
| **Support chat widget:** floating chat with shop admins (the button is always there for a signed-in user; the first press opens or creates their thread), images (10MB max), reactions, admins-online status and an **AI assistant switch** (the "AI" pill in the header: on = Yoyo AI answers every message, off = wait for staff; a toast announces the change). The AI can also **show product photos, draw up an order slip to confirm, and show the QR to pay** - cards under its answers, see `chat/ShopAttachments.tsx`. State is kept in `localStorage.giftshop_chat_widget` together with the account it belongs to, and is dropped on sign-out or account change | `ChatWidget.tsx`, `ChatWidgetContext.tsx`, `lib/chat.ts` |
| **Theme:** light, dark or auto, in `localStorage.giftshop_theme`. An inline script in `layout.tsx` sets it before paint, and dark mode works by redefining the colour variables (`gray-*`, `surface`, `page`, `brand`…) under `.dark` in `globals.css` - components have no `dark:` classes | `ThemeContext.tsx`, `SettingsMenu.tsx` |
| **Look and motion:** the main site's design (brand green `#319527`, Inter, 69px translucent top bar, `rounded-2xl` bordered cards, charcoal dark theme) plus CSS-only animation: page fade-up, staggered grids, scroll reveal, card lift and image zoom, menus that pop in, top route progress bar, cart badge bump, image shimmer, typing dots. All of it stops under `prefers-reduced-motion` | `globals.css`, `lib/ui.ts`, `components/ui/*` |
| **Toasts:** `useToast()(text, "success" \| "error")` - a pill at the top centre (add to cart, errors) | `contexts/ToastContext.tsx` |
| **Mobile drawer navigation** | `MobileDrawer.tsx`, `MobileDrawerTrigger.tsx` |

**API endpoints used** (all `${NEXT_PUBLIC_API_URL}/v1.0/...`):
- **Shop:** `shop/categories`, `shop/products`, `shop/products/{id}`, `shop/products/{id}/contact`, `shop/my-orders`, `shop/orders`, `shop/orders/{id}/cancel`, `shop/orders/{id}/payment-status`, `shop/support/status`
- **Chat:** `chat/...`
- **Account:** `user`, `users/{username}/avatar`, `student-verification/status`
- **Mobile handoff:** `web-session/redeem`

---

## 3. Project structure

```
app/
├── layout.tsx              Root layout: Inter font, viewport (device-width, no zoom), theme-init script, provider stack, Header + Footer + route progress bar
├── template.tsx            Re-mounts on every navigation so the page-transition CSS animation replays (header/footer are outside it)
├── globals.css             Tailwind v4 @theme tokens (main site's palette), dark theme via redefined variables, keyframes + motion classes, html/body overflow-x: clip
├── page.tsx                Home (/)
├── products/               /products listing (page.tsx + ProductsContent.tsx client part)
├── product/[id]/page.tsx   Product detail
├── cart/page.tsx           Cart
├── checkout/page.tsx       Checkout + QR payment polling
├── orders/page.tsx         My orders
├── auth/set-token/page.tsx Mobile-app login handoff (?code= → redeem → shared cookie)
├── components/
│   ├── Header.tsx          Top bar (rendered once in layout.tsx): logo, nav pills, search, cart, account link (app-mode aware), SettingsMenu
│   ├── Footer.tsx          Green link strip + brand line (the link to the forum is hidden in app mode)
│   ├── SettingsMenu.tsx    Theme picker + sign-out (hidden in app mode)
│   ├── HomeGate.tsx        Spinner while auth state loads
│   ├── HeroBanner.tsx      Green gradient hero: headline, search, quick-action tiles
│   ├── FeaturesBar.tsx, CategoryBar.tsx, FeaturedProducts.tsx
│   ├── LocationPicker.tsx  Checkout map: drop a pin where to deliver (Leaflet from a CDN, OpenStreetMap tiles)
│   ├── ProductThumb.tsx    Product photo (lazy, shimmer until loaded, fade-in) or icon fallback
│   ├── Price.tsx, CartLineItem.tsx, PaymentMethodSelector.tsx
│   ├── ChatWidget.tsx      Floating support chat
│   ├── chat/ShopAttachments.tsx  What the AI attaches to an answer: product photos, order slip (confirm → order), QR payment with live status
│   ├── MobileDrawer.tsx, MobileDrawerTrigger.tsx
│   ├── sidebar/            MiniCart, PromoBanner (student verification CTA), TrustBadges
│   └── ui/                 Shared pieces: ProductCard (+ skeleton, the only product card), SectionHeader, EmptyState, Spinner, Reveal (scroll reveal), RouteProgress
├── contexts/               Auth, Cart, Catalog, ChatWidget, StudentDiscount, Theme, Toast providers
└── lib/
    ├── ui.ts               Shared class strings: card, btnPrimary, btnOutline, iconBtn, input, pageTitle, skeleton, stagger()
    ├── useInView.ts        IntersectionObserver hook behind Reveal
    ├── api.ts              API_URL, getCurrentUser, avatar URL, student verification status
    ├── auth.ts             Shared auth_token cookie read/write/clear, main-site login URL
    ├── appMode.ts          useAppMode(): ?app=true / sessionStorage cbh_app_mode
    ├── shop.ts             Shop types + API calls, vndToPoints, variantLabel
    ├── chat.ts             Support chat API (messages, images, reactions)
    └── categoryIcons.ts    Category → lucide icon mapping
public/                     images/logo.png, default Next svgs
AGENTS.md / CLAUDE.md       Agent rules (read the Next.js docs in node_modules first)
```

---

## 4. Setup and running

```bash
npm install          # node_modules is NOT installed in the shared dev environment - do this first
npm run dev          # next dev → http://localhost:3000
npm run build        # production build
npm run start        # serve the build
npm run lint         # eslint (eslint-config-next)
```

**Environment variables** (both optional; the defaults point at production):

| Var | Default | Use |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.chuyenbienhoa.com` | Backend base URL |
| `NEXT_PUBLIC_SITE_URL` | `https://www.chuyenbienhoa.com` | Main site, used for the login redirect |

**Notes for local development:**
- **Login:** the shared cookie only works on `*.chuyenbienhoa.com`. On `localhost`, `setAuthToken` and `clearAuthToken` fall back to host-only cookies, so to test logged-in flows locally you set `auth_token` by hand or go through `/auth/set-token?code=…`.
- **Type-check:** `npx tsc --noEmit` needs the dependencies installed first.

---

## 5. Conventions

- **Language:** UI text is Vietnamese, and commit messages are usually Vietnamese too, conventional style (`feat(scope): …`, `fix: …`).
- **Pushing:** `main` isn't branch-protected, so changes go straight to `main`. Bigger features have gone through PRs (for example #1, the chat widget).
- **Comments:** code comments explain *why*, often at length. Keep that density when editing.
- **Pages:** client components use `"use client"`. Anything that reads `window` or storage does it in an effect, so the server render matches the client.
- **Styling:** use the tokens in `globals.css` and the strings in `lib/ui.ts`. Green is `primary-*` (fills, borders) and `brand` / `brand-strong` (green *text*, which is lighter in dark mode); neutrals are `gray-*`; backgrounds are `page`, `surface` (cards), `popover`, `chip`, `nav`. Don't use `slate-*`, `green-*` or `bg-white` for a surface: only the names above are redefined by the dark theme. Plain `white` is for things that sit on green (button text, overlays) and stays white in both themes. New product lists use `components/ui/ProductCard`.
- **Motion:** CSS only (`animate-*` utilities and the `.stagger`, `.shimmer`, `.reveal-*` classes in `globals.css`); no animation library. Anything fixed-position or sticky must not sit under a lingering `transform`.
- **Prices** are in VND throughout. Points come from `vndToPoints`, using the same rate as the backend `PointsService`.

---

## 6. Recent work (newest first)

| Commit | Change |
|---|---|
| (this commit) | **Checkout map pin (required) and cancelling paid orders (needs the API PR with `php artisan migrate`; built on Vercel only).** `components/LocationPicker.tsx`: a Leaflet map on OpenStreetMap tiles, loaded from cdnjs on demand (no API key, no npm dependency). The customer taps the map or drags the pin; "Vị trí của tôi" uses geolocation and "Tìm theo địa chỉ đã nhập" moves the pin near the typed address (Photon search). Checkout refuses to continue without a pin and sends it as `shipping_lat` / `shipping_lng`; the API keeps it on the order and gives admins a Google Maps link. No link on the map leaves the domain (own plain-text credit instead of Leaflet's). **Orders:** "Hủy đơn" now shows for any pending/processing order, paid or not, asks for confirmation and toasts the API's answer (points returned at once; a bank transfer is refunded by the shop - such an order shows "Chờ hoàn tiền"). Nothing can be cancelled from "đang giao" on. |
| PR #4 | **Chat button always there (goes with the API's place-lookup PR; built on Vercel only).** The floating chat button now shows for every signed-in user, not only after "Nhắn tin" on a product: the first press calls `openSupport()` → `POST /shop/support/open`, which returns (or creates) the account's support thread without posting anything. An empty thread shows a short greeting saying what Yoyo AI can do. The mobile drawer button sits above it whenever someone is signed in. |
| PR #3 | **AI ordering, payment and product photos in the support chat (goes with API PR 50; built on Vercel only).** The API now attaches extras to the AI's answers in `message.metadata`, and `components/chat/ShopAttachments.tsx` draws them under the bubble: product photo cards (`shop_images`, link to the product page), an order slip (`shop_order_draft`: items, recipient, phone, address, payment method, totals) with **Xác nhận đặt hàng** - nothing is ordered until it is pressed (`confirmChatOrder()` → `POST /shop/support/messages/{id}/order`) - and a QR payment card (`shop_payment`, also shown inside a confirmed slip paid by transfer) that polls `payment-status` every 4s for up to ~15 min and flips to "đã thanh toán". Attachments are only drawn for messages whose sender is the AI. Chat bubbles keep line breaks now. **Checkout:** the phone field takes digits only (non-digits are dropped as typed/pasted, max 11, numeric keypad) and must be 9-11 digits. |
| `9fffda5` (PR #2) | **UI revamp to match the main site, with motion (not built or run: no Node on this machine - run `npm run build` and look at it before trusting it).** Tokens in `globals.css` now carry the main site's palette (`primary-*` = `#319527` scale, neutral greys, `#F8F8F8` page, charcoal dark theme `#2c2f2e` / `#3c3c3c`); `--color-white` is no longer remapped in dark mode (it used to turn the text on green buttons dark). Font is Inter. `Header` moved into `layout.tsx` and restyled after the main navbar (69px, blur, pill nav with green glow, round icon buttons, red count badge); nav links are `next/link` now. New `Footer`, `ToastContext`, `components/ui/*` (one `ProductCard` replacing three copies, `SectionHeader`, `EmptyState`, `Spinner`, `Reveal`, `RouteProgress`), `lib/ui.ts`. Home: green gradient hero with search and quick-action tiles (`public/hero.png` deleted), 320px sticky right column. Every page restyled; orders and product pages got skeletons; checkout inputs got labels; the product breadcrumb's category link now goes to `/products?category=`. Motion: page fade-up, staggered grids, scroll reveal, hover lift/zoom, pop-in menus, route progress bar, cart badge bump, add-to-cart toast and tick, image shimmer/fade-in, animated success tick, chat panel/messages/typing dots. The drawer button moves above the chat button instead of hiding under it. `prefers-reduced-motion` now really disables all of it. |
| `cd8d6c3` | **Fix: support chat AI switch + chat and cart bugs (not built or run: no Node on this machine; goes with an API change).** The switch failed for anyone whose widget pointed at a thread that isn't their own: an admin account (the API put their inquiry into another customer's thread - fixed in the API) or a thread id remembered in `localStorage` from another account. `ChatWidgetContext` now stores the owning account with the thread and drops it on sign-out or account change; `ChatWidget` also takes `conversation_id` from `shop/support/status`. The AI pill stays disabled until the server has said on/off, uses the PUT's answer, and a poll that overlapped a switch is ignored (sequence counter instead of timestamps). Also: no more jump to the bottom every 4s (scrolls on new messages only), a sent message can't appear twice or vanish for one poll, system lines render as centred notes, a failed send shows a toast. `CartContext`: a change not yet saved (tab closed within the debounce, failed save) is flagged in `localStorage.giftshop_cart_dirty` and sent on the next load instead of being replaced by the older account cart; a focus refresh can't overwrite the cart while a save is in flight. |
| `874b638` | **App sessions.** `/auth/set-token?logout=1` drops the session (revoking it on the API when the app handed it over); a new handoff revokes the previous app-handed session; `cbh_session_source=app` cookie (shared with the main site) marks app-handed sessions. `lib/clientInfo.ts` sends the same device headers as the main site, labelling WebView sessions ("WebView trong ứng dụng CBH Youth") and app-handed browsers ("· mở từ ứng dụng") in the logged-in devices list. |
| `9035033` | **Cart sync and support chat fixes (not built or run).** `CartContext`: a local cart is merged into the account only when it was built as a guest (`giftshop_cart_user` unset) - a cart left by another account is replaced by the server's, never merged; signing out (also from another CBH site, since the login cookie is shared) empties a cart that belonged to an account; a change made while the account cart is still loading is saved instead of being overwritten; a pending save is dropped when the user changes. `ChatWidget`: a status poll that started before an AI on/off switch can't undo it; the "Yoyo AI đang trả lời..." line gives up after 45s. |
| `36a31d5` / `f469ffc` | **Support chat AI switch + cart synced with the account (not built or run: no Node on the machine it was written on).** `ChatWidget` has an "AI" pill: while on, the API answers each customer message with Yoyo AI (product, variant and recent orders are given to it server-side); turning it off calls `PUT /shop/support/{id}/ai` and shows a toast. AI replies carry an "AI" badge and a "Yoyo AI đang trả lời..." line shows while waiting. "Nhắn tin" now sends the picked `variant_id`. `CartContext` loads the account cart after sign-in (a guest cart is merged in once), pushes changes (debounced 600 ms), re-reads it when the tab regains focus, and empties the browser copy on sign-out. |
| (latest) | **Fix: header and pages fit 360px phones.** The header was about 50px wider than a 360px screen (full logo text + icon row with 16px gaps). Now it uses tighter gaps below `sm`, a logo that shrinks and truncates, `px-4` page gutters below `sm`, `min-w-0` on grid/flex children (home columns, category buttons, breadcrumb) and `overflow-wrap:anywhere` on category labels. |
| `527ad7a` | **Fix: no sideways scrolling on phones or in the app WebView.** `html, body { overflow-x: clip }` (`clip`, not `hidden`, so the sticky header still works), plus an explicit `viewport` export with `maximumScale: 1` so iOS doesn't zoom into inputs. |
| `dfc7bc4` | **App mode.** `lib/appMode.ts`; in app mode the header account link isn't a link, the login link and sign-out are hidden, and the verify CTA becomes a note. |
| `c74bc38` | **`/auth/set-token`:** redeems the mobile app's one-time code and writes the shared cookie. `setAuthToken()` was added to `lib/auth.ts`. |
| `3007b28` / `df137ac` | In-page support chat widget (PR #1). |
| `ecb6dd7` | Hide the verification invite for students who are already verified. |
| `b5fda9e`, `a8ef505` | Student 10% discount: struck-through prices and applied at checkout. |
| `92f271e` | Header search redirects to `/products?search=`, with mobile support. |
| `996f7db` | 15,000đ shipping fee at checkout. |
| `aeb6255` | "Xác minh ngay" links to `chuyenbienhoa.com/settings?tab=student-kyc`. |
| `536c33f` | `/products` listing page. |

**Related changes in the other repos, made in the same session:**
- **API:** added the `web-session/handoff` and `web-session/redeem` endpoints.
- **Mobile:** a sidebar "Gift shop" entry opens `WebAppScreen` (a WebView with a plain header, domain lock, session handoff and theme injection), and links to this domain in the in-app browser go through the `/auth/set-token` handoff.
- **Main site:** PR #29 (merged) added `/auth/set-token?code=`, app mode for admin, and hides the splash and banner in app mode.
