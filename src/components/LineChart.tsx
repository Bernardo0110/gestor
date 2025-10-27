import React from 'react';

export default function LineChart({ points = [] }: { points?: number[] }) {
  const max = Math.max(...points, 1);
  const w = 600;
  const h = 120;

  const path = points
    .map((p, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * w;
      const y = h - (p / max) * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <div className="rounded-md bg-gray-800/50 p-4">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="#60a5fa" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.length > 0 && (
          <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#g)" opacity={0.6} />
        )}
      </svg>
    </div>
  );
}
