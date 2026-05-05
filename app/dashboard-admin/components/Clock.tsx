"use client";

import { Clock as ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function LiveClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Makassar", // WITA
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-primary shadow-sm">
      <ClockIcon className="w-3.5 h-3.5 animate-pulse" />
      <span className="text-xs font-black tabular-nums tracking-tight">
        {time} WITA
      </span>
    </div>
  );
}
