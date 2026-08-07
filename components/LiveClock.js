'use client';

import { useEffect, useState } from 'react';

export default function LiveClock() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(function () {
      setTime(new Date());
    }, 1000);
    return function () {
      clearInterval(interval);
    };
  }, []);

  let displayText = '';
  if (time !== null) {
    displayText = time.toLocaleString('th-TH', {
      dateStyle: 'full',
      timeStyle: 'medium',
      timeZone: 'Asia/Bangkok',
    });
  }

  return (
    <p className="text-sm text-slate-500 min-h-[20px]" suppressHydrationWarning>
      {displayText}
    </p>
  );
}
