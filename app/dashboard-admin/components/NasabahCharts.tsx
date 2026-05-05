"use client";

import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Doughnut, Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

interface NasabahData {
  kategori: string;
  status: string;
}

export function NasabahCategoryChart({ data }: { data: NasabahData[] }) {
  const categories = data.reduce((acc: Record<string, number>, curr) => {
    acc[curr.kategori] = (acc[curr.kategori] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(categories).map((k) => k.replace("_", " ")),
    datasets: [
      {
        data: Object.values(categories),
        backgroundColor: [
          "rgba(220, 38, 38, 0.8)", // Primary red
          "rgba(220, 38, 38, 0.5)",
          "rgba(220, 38, 38, 0.2)",
        ],
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
      },
    },
    cutout: "70%",
  };

  return <Doughnut data={chartData} options={options} />;
}

export function NasabahStatusChart({ data }: { data: NasabahData[] }) {
  const status = data.reduce((acc: Record<string, number>, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(status),
    datasets: [
      {
        data: Object.values(status),
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)", // Green for Active
          "rgba(161, 161, 170, 0.5)", // Zinc for Nonactive
        ],
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
      },
    },
  };

  return <Pie data={chartData} options={options} />;
}
