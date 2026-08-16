"use client";

import { useState } from "react";

type DataPoint = [string, number];

export default function ConversationLineChart({ data }: { data: DataPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const width = 700;
  const height = 260;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map((d) => d[1]);
  const maxVal = Math.max(...values, 1);
  const yMax = Math.ceil(maxVal * 1.15);

  // FIX: guard against division by zero when only 1 data point
  const getX = (i: number) =>
    padding.left +
    (data.length <= 1 ? 0.5 : i / (data.length - 1)) * chartWidth;

  const getY = (v: number) =>
    padding.top + chartHeight - (v / yMax) * chartHeight;

  // Build smooth SVG path
  const pathD = data.reduce((acc, d, i) => {
    const x = getX(i);
    const y = getY(d[1]);
    if (i === 0) return `M ${x} ${y}`;
    const prevX = getX(i - 1);
    const prevY = getY(data[i - 1][1]);
    const cp1x = prevX + (x - prevX) / 2;
    const cp1y = prevY;
    const cp2x = prevX + (x - prevX) / 2;
    const cp2y = y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
  }, "");

  // Area fill path
  const areaD =
    pathD +
    ` L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((yMax / yTicks) * i),
  );

  // X-axis labels (show every nth label to avoid crowding)
  const xStep = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-64 min-w-[500px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines - horizontal */}
        {yTickValues.map((val, i) => {
          const y = getY(val);
          return (
            <g key={`grid-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.08}
                className="text-gray-900 dark:text-white"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-gray-400 dark:fill-dark-muted"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGradient)" opacity={0.15} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Data points + hover targets */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = getY(d[1]);
          const isHovered = hoveredIndex === i;
          const segmentWidth =
            data.length <= 1 ? chartWidth : chartWidth / data.length;

          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 5 : 3.5}
                className="fill-primary-blue dark:fill-accent-cyan"
                stroke="white"
                strokeWidth={2}
                style={{ transition: "r 0.15s ease" }}
              />
              {/* Invisible hover target */}
              <rect
                x={x - segmentWidth / 2}
                y={padding.top}
                width={segmentWidth}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: "pointer" }}
              />
              {/* Tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={x - 36}
                    y={y - 38}
                    width={72}
                    height={28}
                    rx={6}
                    className="fill-gray-900 dark:fill-dark-surface"
                  />
                  <text
                    x={x}
                    y={y - 20}
                    textAnchor="middle"
                    className="fill-white text-[10px] font-semibold"
                  >
                    {d[1]} chat{d[1] !== 1 ? "s" : ""}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % xStep !== 0 && i !== data.length - 1) return null;
          const date = new Date(d[0]);
          const label = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return (
            <text
              key={`xlabel-${i}`}
              x={getX(i)}
              y={height - 12}
              textAnchor="middle"
              className="text-[10px] fill-gray-400 dark:fill-dark-muted"
            >
              {label}
            </text>
          );
        })}

        {/* Y-axis label */}
        <text
          x={12}
          y={padding.top - 6}
          className="text-[10px] fill-gray-400 dark:fill-dark-muted font-medium"
        >
          Conversations
        </text>

        {/* Gradients */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2B59FF" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2B59FF" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
