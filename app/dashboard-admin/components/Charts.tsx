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

// ─── Generic charts (sekarang dinamis untuk admin & konsumen) ─────────────────

export function WasteLineChart({
  labels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
  data = [0, 0, 0, 0, 0, 0],
}: {
  labels?: string[];
  data?: number[];
}) {
  const chartData = {
    labels,
    datasets: [
      {
        label: "Berat Sampah (kg)",
        data,
        borderColor: "#dc2626", // primary red
        backgroundColor: "rgba(220, 38, 38, 0.05)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHitRadius: 20,
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#18181b",
        bodyColor: "#18181b",
        borderColor: "#f4f4f5",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.03)" },
        ticks: { color: "#a1a1aa", font: { size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#a1a1aa", font: { size: 10 } },
      },
    },
  };

  return (
    <div className="h-70 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}

export function WasteTypeChart({
  plastik = 0,
  karton = 0,
  paperCup = 0,
}: {
  plastik?: number;
  karton?: number;
  paperCup?: number;
}) {
  const chartData = {
    labels: ["Plastik", "Karton", "Paper Cup"],
    datasets: [
      {
        data: [plastik, karton, paperCup],
        backgroundColor: ["#dc2626", "#fb923c", "#3b82f6"], // Red, Orange, Blue
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 11, weight: "bold" as const },
          color: "#71717a",
        },
      },
    },
    cutout: "80%",
  };

  return (
    <div className="h-60 w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

// ─── Laporan charts (menerima data real) ─────────────────────────────────────

interface MonthlyData {
  label: string; // "Jan 2026"
  plastik: number; // berat kg
  karton: number;
  paperCup: number;
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
      {
        label: "Paper Cup (kg)",
        data: data.map((d) => d.paperCup),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
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
    <div className="h-70 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}

interface TypeData {
  plastik: number; // berat total kg
  karton: number;
  paperCup: number;
}

export function LaporanDonutChart({ data }: { data: TypeData }) {
  const total = data.plastik + data.karton + data.paperCup;
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
    <div className="h-70 w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
