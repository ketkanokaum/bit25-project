// components/LiveClock.js
'use client';

import { useEffect, useState } from 'react';

export default function LiveClock() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-sm text-slate-500 min-h-[20px]" suppressHydrationWarning>
      {time
        ? time.toLocaleString("th-TH", {
            dateStyle: "full",
            timeStyle: "medium",
            timeZone: "Asia/Bangkok",
          })
        : ''}
    </p>
  );
}