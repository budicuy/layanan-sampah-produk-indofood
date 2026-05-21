"use client";

import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Legend,
  Tooltip,
);

// ─── Line chart: monthly waste weight ────────────────────────────────────────

interface MonthlyPoint {
  label: string;
  value: number;
}

export function ConsumerLineChart({ data }: { data: MonthlyPoint[] }) {
  const hasData = data.length > 0 && data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="h-60 flex items-center justify-center text-zinc-400 text-sm">
        Belum ada data setoran
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "Berat (kg)",
        data: data.map((d) => d.value),
        borderColor: "rgb(220, 38, 38)",
        backgroundColor: "rgba(220, 38, 38, 0.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
        pointBorderColor: "rgb(220, 38, 38)",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: { callback: (v: number | string) => `${v} kg` },
      },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="h-60 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}

// ─── Donut chart: waste type composition ─────────────────────────────────────

interface TypeData {
  plastik: number;
  karton: number;
  paperCup: number;
}

export function ConsumerDonutChart({ data }: { data: TypeData }) {
  const total = data.plastik + data.karton + data.paperCup;

  if (total === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-zinc-400 text-sm">
        Belum ada data komposisi
      </div>
    );
  }

  const chartData = {
    labels: ["Plastik", "Karton", "Paper Cup"],
    datasets: [
      {
        data: [data.plastik, data.karton, data.paperCup],
        backgroundColor: [
          "rgba(220, 38, 38, 0.85)",
          "rgba(251, 146, 60, 0.85)",
          "rgba(59, 130, 246, 0.85)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { boxWidth: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) =>
            ` ${ctx.label}: ${ctx.raw} kg (${total > 0 ? ((Number(ctx.raw) / total) * 100).toFixed(1) : 0}%)`,
        },
      },
    },
    cutout: "68%",
  };

  return (
    <div className="h-60 w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
