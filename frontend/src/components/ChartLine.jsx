// src/components/ChartLine.jsx
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/* ───────── Line (unchanged basics) ───────── */
function makeLineData(labels = [], series = [], label = "Series") {
  return {
    labels,
    datasets: [
      {
        label,
        data: series,
        borderWidth: 2,
        fill: false,
        tension: 0.25,
        pointRadius: 2,
      },
    ],
  };
}

const baseLineOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: !!title, text: title },
    tooltip: { mode: "index", intersect: false },
  },
  scales: {
    x: { grid: { display: true } },
    y: { beginAtZero: true, grid: { display: true }, ticks: { precision: 0 } },
  },
});

export function ChartLine({ labels = [], data = [], title = "" }) {
  return (
    <div style={{ height: 280 }}>
      <Line data={makeLineData(labels, data, title)} options={baseLineOptions(title)} />
    </div>
  );
}

/* ───────── Bar: Titles on X, Clicks on Y (top-5, Y max 50) ───────── */
export function ChartBar({ labels = [], data = [], title = "Project Clicks" }) {
  // Pair up, coerce labels to strings, sort by value desc, cap to 5
  const pairs = (labels || []).map((lbl, i) => ({
    label: String(lbl ?? ""),
    value: Number(data?.[i] ?? 0),
  }));
  pairs.sort((a, b) => b.value - a.value);
  const top = pairs.slice(0, 5);

  const chartData = {
    labels: top.map((p) => p.label),           // X axis: project titles
    datasets: [
      {
        label: title,
        data: top.map((p) => p.value),         // Y axis: clicks
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: !!title, text: title },
      tooltip: {
        callbacks: {
          title(items) {
            const idx = items?.[0]?.dataIndex ?? 0;
            return chartData.labels[idx] || "";
          },
          label(ctx) {
            const v = ctx.parsed?.y ?? ctx.parsed ?? 0;
            return `Clicks: ${v}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          // Force string labels even if they "look numeric"
          callback: (val, idx) => chartData.labels[idx] ?? "",
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 50,  // cap target
        max: 50,           // hard cap at 50 as requested
        ticks: { stepSize: 10, precision: 0 },
      },
    },
  };

  return (
    <div style={{ height: 300 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default ChartLine;
