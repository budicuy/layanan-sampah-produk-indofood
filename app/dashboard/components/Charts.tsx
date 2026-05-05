"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
);

// ─── Generic charts (masih dipakai di konsumen dashboard) ────────────────────

export function WasteLineChart() {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
    datasets: [
      {
        label: "Berat Sampah (kg)",
        data: [12, 19, 15, 25, 22, 30],
        borderColor: "rgb(220, 38, 38)",
        backgroundColor: "rgba(220, 38, 38, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="h-[300px] w-full">
      <Line data={data} options={options} />
    </div>
  );
}

export function WasteTypeChart() {
  const data = {
    labels: ["Plastik", "Karton"],
    datasets: [
      {
        data: [45, 55],
        backgroundColor: ["rgba(220, 38, 38, 0.8)", "rgba(220, 38, 38, 0.3)"],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" as const } },
    cutout: "70%",
  };

  return (
    <div className="h-[300px] w-full">
      <Doughnut data={data} options={options} />
    </div>
  );
}

// ─── Laporan charts (menerima data real) ─────────────────────────────────────

interface MonthlyData {
  label: string; // "Jan 2026"
  plastik: number; // berat kg
  karton: number;
}

export function LaporanBarChart({ data }: { data: MonthlyData[] }) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "Plastik (kg)",
        data: data.map((d) => d.plastik),
        backgroundColor: "rgba(220, 38, 38, 0.8)",
        borderRadius: 6,
      },
      {
        label: "Karton (kg)",
        data: data.map((d) => d.karton),
        backgroundColor: "rgba(251, 146, 60, 0.8)",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { boxWidth: 12 } },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { callback: (v: number | string) => `${v} kg` },
      },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="h-[280px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}

interface TypeData {
  plastik: number; // berat total kg
  karton: number;
}

export function LaporanDonutChart({ data }: { data: TypeData }) {
  const total = data.plastik + data.karton;
  const chartData = {
    labels: ["Plastik", "Karton"],
    datasets: [
      {
        data: [data.plastik, data.karton],
        backgroundColor: [
          "rgba(220, 38, 38, 0.85)",
          "rgba(251, 146, 60, 0.85)",
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
    <div className="h-[280px] w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
