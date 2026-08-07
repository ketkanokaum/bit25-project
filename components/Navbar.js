'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'ปริมาณน้ำฝนล่วงหน้า', shortLabel: 'ล่วงหน้า' },
    { href: '/pattern', label: 'ความเสี่ยงอุทกภัย', shortLabel: 'ความเสี่ยง' },
    { href: '/rainfall', label: 'ปริมาณน้ำฝนย้อนหลัง', shortLabel: 'ย้อนหลัง' },
  ];

  const navLinks = [];
  for (let i = 0; i < navItems.length; i++) {
    const item = navItems[i];

    let isActive = false;
    if (item.href === '/') {
      if (pathname === '/') {
        isActive = true;
      }
    } else {
      if (pathname.startsWith(item.href)) {
        isActive = true;
      }
    }

    let linkClass = 'px-3 md:px-4 py-2 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ';
    if (isActive === true) {
      linkClass += 'bg-white text-sky-700 shadow-sm';
    } else {
      linkClass += 'text-sky-100 hover:text-white hover:bg-white/10';
    }

    navLinks.push(
      <Link key={item.href} href={item.href} className={linkClass}>
        <span className="md:hidden">{item.shortLabel}</span>
        <span className="hidden md:inline">{item.label}</span>
      </Link>
    );
  }

  return (
    <nav className="w-full bg-sky-700 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          <div className="flex items-center gap-1 flex-shrink-0">
            {navLinks}
          </div>
        </div>
      </div>
    </nav>
  );
}
