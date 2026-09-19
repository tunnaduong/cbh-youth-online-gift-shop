export default function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl" style={{ aspectRatio: "2 / 1" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero.png"
        alt="Quà tặng lưu niệm Chuyên Biên Hòa"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* gradient chỉ phủ nửa trái để không che sản phẩm bên phải */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-900/70 via-green-900/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
        <h1 className="text-xl font-extrabold leading-tight text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.4)] sm:text-3xl lg:text-4xl">
          Quà tặng lưu niệm
          <br />
          <span className="text-green-300">Chuyên Biên Hòa</span>
        </h1>
        <p className="mt-2 max-w-[200px] text-xs text-white/85 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] sm:mt-3 sm:max-w-xs sm:text-sm">
          Mang dấu ấn Chuyên Biên Hòa đến mọi nơi bạn đi!
        </p>
        <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
          <a
            href="#catalog"
            className="rounded-xl bg-green-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-green-400 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Mua ngay
          </a>
          <a
            href="#catalog"
            className="rounded-xl border border-white/50 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Xem bộ sưu tập
          </a>
        </div>
      </div>
    </div>
  );
}
