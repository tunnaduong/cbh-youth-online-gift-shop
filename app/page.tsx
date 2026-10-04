import { Suspense } from "react";
import HeroBanner from "./components/HeroBanner";
import CategoryBar from "./components/CategoryBar";
import FeaturedProducts from "./components/FeaturedProducts";
import FeaturesBar from "./components/FeaturesBar";
import TrustBadges from "./components/sidebar/TrustBadges";
import MiniCart from "./components/sidebar/MiniCart";
import PromoBanner from "./components/sidebar/PromoBanner";
import HomeGate from "./components/HomeGate";
import Reveal from "./components/ui/Reveal";
import { CatalogProvider } from "./contexts/CatalogContext";

export default function Home() {
  return (
    // Same proportions as the main site's home page: a 1240px page with a
    // 320px column on the right.
    <main className="mx-auto w-full max-w-[1240px] px-3 pb-8 pt-4 sm:px-4 lg:px-6 lg:pt-6">
      <HomeGate>
        {/* CatalogProvider reads the ?search= query param via
            useSearchParams, which Next.js requires a Suspense boundary
            around. */}
        <Suspense>
          <CatalogProvider>
            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
                <HeroBanner />
                <CategoryBar />
                <FeaturedProducts />
                <Reveal>
                  <FeaturesBar />
                </Reveal>
              </div>

              {/* Stays in view beside the catalog on desktop; below lg the
                  same three cards are also in the drawer. */}
              <aside className="scrollbar-hide flex min-w-0 flex-col gap-4 lg:sticky lg:top-[85px] lg:max-h-[calc(100vh-101px)] lg:self-start lg:overflow-y-auto">
                <MiniCart />
                <PromoBanner />
                <TrustBadges />
              </aside>
            </div>
          </CatalogProvider>
        </Suspense>
      </HomeGate>
    </main>
  );
}
