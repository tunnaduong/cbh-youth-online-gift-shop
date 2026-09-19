export default function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero.png"
        alt="Quà tặng lưu niệm Chuyên Biên Hòa"
        className="w-full object-cover"
        style={{ aspectRatio: "3 / 1" }}
      />
      <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12">
        <h1 className="text-2xl font-extrabold leading-tight text-white drop-shadow sm:text-4xl">
          Quà tặng lưu niệm
          <br />
          <span className="text-green-200">Chuyên Biên Hòa</span>
        </h1>
        <p className="mt-3 max-w-xs text-sm text-white/80 drop-shadow sm:text-base">
          Mang dấu ấn Chuyên Biên Hòa đến mọi nơi bạn đi!
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="#catalog"
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-green-700 shadow transition-colors hover:bg-green-50"
          >
            Mua ngay
          </a>
          <a
            href="#catalog"
            className="rounded-xl border border-white/60 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Xem bộ sưu tập
          </a>
        </div>
      </div>
    </div>
  );
}
