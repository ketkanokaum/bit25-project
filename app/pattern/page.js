
import Navbar from '../components/Navbar';
import FloodPatternInsight from '../components/FloodPatternInsight';

export default async function PatternPage() {
  return (
    <div className="min-h-screen pb-24 md:pb-0 font-sans" style={{ backgroundColor: '#e0f2fe' }}>
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            พฤติกรรมการค้นหา
          </h1>
          <p className="text-slate-500 text-[15px]">
            รูปแบบพฤติกรรมการค้นหาข้อมูลจาก Google Trends ปี 2561–2568
          </p>
        </div>

        
        <FloodPatternInsight />

      </div>
    </div>
  );
}