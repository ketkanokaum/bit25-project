'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'พยากรณ์ฝน' },
    { href: '/rainfall', label: 'ข้อมูลน้ำฝน' },
    { href: '/pattern', label: 'รูปแบบการค้นหา' },
  ];

  return (
    <nav className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-black text-slate-800 text-[15px] tracking-tight">
            
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map(function (item) {
              let isActive = false;
              if (item.href === '/') {
                if (pathname === '/') isActive = true;
              } else {
                if (pathname.startsWith(item.href)) isActive = true;
              }

              let linkClass = 'px-4 py-2 rounded-xl text-[13px] font-bold transition-all ';
              if (isActive === true) {
                linkClass += 'bg-sky-500 text-white';
              } else {
                linkClass += 'text-slate-500 hover:text-sky-600 hover:bg-sky-50';
              }

              return (
                <Link key={item.href} href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}