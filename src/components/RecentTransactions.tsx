import React from 'react';

type Tx = {
  id: string;
  description: string;
  amount: string;
  date: string;
};

export default function RecentTransactions({ items }: { items: Tx[] }) {
  return (
    <div className="rounded-md bg-gray-800/60 p-4 text-white">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-medium">Transações Recentes</div>
        <div className="text-sm text-gray-400">Últimas 7</div>
      </div>
      <ul className="divide-y divide-gray-700">
        {items.map((t) => (
          <li key={t.id} className="flex items-center justify-between py-2">
            <div className="flex flex-col">
              <span className="font-medium">{t.description}</span>
            </div>
            <div className={`font-semibold ${t.amount.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
              {t.amount}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
