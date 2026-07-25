import { Shirt, KeyRound, PenLine, NotebookText } from "lucide-react";

export default function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 via-slate-50 to-green-100/60 p-8">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-3xl font-extrabold leading-tight text-slate-800 sm:text-4xl">
            Quà tặng lưu niệm
            <br />
            <span className="text-green-600">Chuyên Biên Hòa</span>
          </h1>
          <p className="mt-4 max-w-sm text-slate-500">
            Mang dấu ấn Chuyên Biên Hòa đến mọi nơi bạn đi!
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700">
              Mua ngay
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-green-600/40 hover:text-green-700">
              Xem bộ sưu tập
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="grid w-full max-w-md grid-cols-2 gap-4">
            <div className="col-span-2 flex items-center justify-center rounded-2xl bg-white p-6 shadow-sm">
              <Shirt className="h-20 w-20 text-green-700" strokeWidth={1.2} />
            </div>
            <div className="flex items-center justify-center rounded-2xl bg-white p-5 shadow-sm">
              <KeyRound className="h-10 w-10 text-green-600" strokeWidth={1.4} />
            </div>
            <div className="flex items-center justify-center rounded-2xl bg-white p-5 shadow-sm">
              <PenLine className="h-10 w-10 text-slate-700" strokeWidth={1.4} />
            </div>
            <div className="col-span-2 flex items-center justify-center rounded-2xl bg-green-700 p-5 shadow-sm">
              <NotebookText className="h-10 w-10 text-white" strokeWidth={1.4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
