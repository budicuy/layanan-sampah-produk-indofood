"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function TrendFilters({
  currentYear,
  currentMonth,
}: {
  currentYear: string;
  currentMonth: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("trendYear", year);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleMonthChange = (month: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("trendMonth", month);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const years = Array.from({ length: 4 }, (_, i) =>
    String(new Date().getFullYear() - 2 + i),
  );
  const months = [
    { value: "ALL", label: "Semua Bulan" },
    { value: "0", label: "Januari" },
    { value: "1", label: "Februari" },
    { value: "2", label: "Maret" },
    { value: "3", label: "April" },
    { value: "4", label: "Mei" },
    { value: "5", label: "Juni" },
    { value: "6", label: "Juli" },
    { value: "7", label: "Agustus" },
    { value: "8", label: "September" },
    { value: "9", label: "Oktober" },
    { value: "10", label: "November" },
    { value: "11", label: "Desember" },
  ];

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentMonth}
        onChange={(e) => handleMonthChange(e.target.value)}
        className="text-xs font-bold border border-zinc-200 rounded-lg p-1.5 bg-white text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary">
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        value={currentYear}
        onChange={(e) => handleYearChange(e.target.value)}
        className="text-xs font-bold border border-zinc-200 rounded-lg p-1.5 bg-white text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary">
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CompFilters({ currentYear }: { currentYear: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("compYear", year);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const years = Array.from({ length: 4 }, (_, i) =>
    String(new Date().getFullYear() - 2 + i),
  );

  return (
    <select
      value={currentYear}
      onChange={(e) => handleYearChange(e.target.value)}
      className="text-xs font-bold border border-zinc-200 rounded-lg p-1.5 bg-white text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary">
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
