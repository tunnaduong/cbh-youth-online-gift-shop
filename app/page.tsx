import Header from "./components/Header";
import HeroBanner from "./components/HeroBanner";
import CategoryBar from "./components/CategoryBar";
import FeaturedProducts from "./components/FeaturedProducts";
import FeaturesBar from "./components/FeaturesBar";
import TrustBadges from "./components/sidebar/TrustBadges";
import MiniCart from "./components/sidebar/MiniCart";
import PromoBanner from "./components/sidebar/PromoBanner";

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1280px] px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-9">
            <HeroBanner />
            <CategoryBar />
            <FeaturedProducts />
            <FeaturesBar />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-3">
            <TrustBadges />
            <MiniCart />
            <PromoBanner />
          </div>
        </div>
      </main>
    </>
  );
}
