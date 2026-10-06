'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'ปริมาณน้ำฝนล่วงหน้า',
      shortLabel: 'ล่วงหน้า',
    },
    {
      href: '/pattern',
      label: 'เฝ้าระวังอุทกภัย',
      shortLabel: 'เฝ้าระวัง',
    },
    {
      href: '/rainfall',
      label: 'ปริมาณน้ำฝนย้อนหลัง',
      shortLabel: 'ย้อนหลัง',
    },
  ];

  const navLinkItems = [];
  for (let i = 0; i < navItems.length; i++) {
    const item = navItems[i];

    let isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    if (item.href === '/') {
      isActive = pathname === '/';
    }

    let linkColorClasses = 'text-sky-100 hover:text-white hover:bg-white/10';
    if (isActive) {
      linkColorClasses = 'bg-white text-sky-700 shadow-sm';
    }

    navLinkItems.push(
      <Link
        key={item.href}
        href={item.href}
        className={`px-3.5 md:px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-200 whitespace-nowrap ${linkColorClasses}`}
      >
        <span className="md:hidden">{item.shortLabel}</span>
        <span className="hidden md:inline">{item.label}</span>
      </Link>
    );
  }

  return (
    <div className="sticky top-4 z-50 w-full flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between gap-1.5 md:gap-3 bg-sky-700/90 backdrop-blur-md p-2 rounded-full border border-sky-500/30 shadow-xl shadow-sky-950/20 max-w-fit">
        
        
        <Link
          href="/"
          className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-white text-sky-700 rounded-full shadow-md hover:scale-105 transition-transform"
          title="หน้าแรก"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M16 14v6" />
            <path d="M8 14v6" />
            <path d="M12 16v6" />
          </svg>
        </Link>

        {/* รายการเมนูหลัก */}
        <div className="flex items-center gap-1 md:gap-2">
          {navLinkItems}
        </div>

      </nav>
    </div>
  );
}