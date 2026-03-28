// app/waterLevel/page.jsx — Server Component
import "server-only";
import Link from "next/link";
import { Suspense } from "react";
import { getRainfallWithImpact } from "@/lib/data/rainfall";
import { getAssociationRules } from "@/lib/data/rules";
import Rainfallimpactpanel from "@/app/components/Rainfallimpactpanel";

export default async function WaterLevelPage() {
  const rainfallData = await getRainfallWithImpact();
  const rulesData = await getAssociationRules();

  return (
    <main
      className="min-h-screen pb-16 font-sans selection:bg-sky-400 selection:text-white"
      style={{ backgroundColor: "#e0f2fe" }}
    >
      <header style={{ backgroundColor: "#e0f2fe" }}>
        <div className="w-full px-4 lg:px-6 pt-6 pb-6 flex flex-col gap-6">
          <div className="w-full">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur-md text-slate-600 hover:text-sky-600 font-bold text-sm border border-white/50 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-white hover:-translate-x-1"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>กลับหน้าหลัก</span>
            </Link>
          </div>

          <div className="flex items-center gap-5 min-w-0 w-full">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-300/50">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                ปริมาณน้ำฝนและแนวโน้มการสืบค้น
              </h1>
            </div>
          </div>
        </div>
      </header>

      <section className="w-full px-4 lg:px-6 pt-2 pb-12 flex flex-col gap-5">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-slate-500 font-semibold text-sm animate-pulse">
                กำลังโหลดข้อมูล...
              </p>
            </div>
          }
        >
          <Rainfallimpactpanel
            initialData={rainfallData}
            initialRules={rulesData}
          />
        </Suspense>
      </section>
    </main>
  );
}
