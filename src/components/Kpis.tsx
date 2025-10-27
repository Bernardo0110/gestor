import React from 'react';

type Kpi = {
  title: string;
  value: string;
  sub?: string;
};

export default function Kpis({ items }: { items: Kpi[] }) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((k) => (
        <div
          key={k.title}
          className="rounded-md bg-gray-800/60 p-4 text-white shadow-md"
        >
          <div className="text-sm text-gray-300">{k.title}</div>
          <div className="mt-2 text-2xl font-semibold">{k.value}</div>
          {k.sub && <div className="mt-1 text-xs text-gray-400">{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}
