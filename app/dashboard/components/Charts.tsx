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
  Title,
  Tooltip,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
);

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
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
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
    labels: ["Organik", "Anorganik", "Lainnya"],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          "rgba(220, 38, 38, 0.8)",
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

  return (
    <div className="h-[300px] w-full">
      <Doughnut data={data} options={options} />
    </div>
  );
}
