'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  // shortLabel ใช้บนจอมือถือ เพราะป้ายเต็มรวมกันกว้างเกินจอ
  const navItems = [
    { href: '/',         label: 'ปริมาณน้ำฝนล่วงหน้า', shortLabel: 'ล่วงหน้า' },
    { href: '/rainfall', label: 'ปริมาณน้ำฝนย้อนหลัง', shortLabel: 'ย้อนหลัง' },
    { href: '/pattern',  label: 'ความเสี่ยงอุทกภัย',   shortLabel: 'ความเสี่ยง' },
  ];

  return (
    <nav className="w-full bg-sky-700 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* ชื่อระบบ — ของเดิมเป็น Link ว่าง ไม่มีข้อความ */}
          {/* <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="p-1.5 rounded-lg bg-white/15 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
              </svg>
            </div>
            <span className="hidden sm:inline text-white font-black text-[15px] tracking-tight">
              ระบบติดตามสถานการณ์น้ำ
            </span>
          </Link> */}

          <div className="flex items-center gap-1 flex-shrink-0">
            {navItems.map(function (item) {
              let isActive = false;
              if (item.href === '/') {
                if (pathname === '/') isActive = true;
              } else {
                if (pathname.startsWith(item.href)) isActive = true;
              }

              // บนพื้นฟ้า สลับสีปุ่มที่เลือกเป็นพื้นขาวตัวหนังสือฟ้า
              let linkClass = 'px-3 md:px-4 py-2 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ';
              if (isActive === true) {
                linkClass += 'bg-white text-sky-700 shadow-sm';
              } else {
                linkClass += 'text-sky-100 hover:text-white hover:bg-white/10';
              }

              return (
                <Link key={item.href} href={item.href} className={linkClass}>
                  {/* จอเล็กใช้ป้ายสั้น จอใหญ่ใช้ป้ายเต็ม */}
                  <span className="md:hidden">{item.shortLabel}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}