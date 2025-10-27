import React from 'react';
import Kpis from '@/components/Kpis';
import LineChart from '@/components/LineChart';
import RecentTransactions from '@/components/RecentTransactions';
import AssetManager from '@/components/AssetManager';

type Props = {
  params: {
    id: string;
  };
};

// Simple fake data generator depending on id
function makeFakeData(id: string) {
  // small deterministic PRNG based on id so server/client render match
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
  function rand() {
    // xorshift32
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 0xffffffff;
  }

  const base = id === 'cripto' ? 12000 : id === 'buffett' ? 250000 : 48000;
  const growth = id === 'simulacao' ? -0.02 : 0.012;

  const kpis = [
    { title: 'Valor Total', value: `R$ ${Intl.NumberFormat('pt-BR').format(base)}` },
    { title: 'Variação 30d', value: `${(growth * 100).toFixed(2)}%`, sub: growth >= 0 ? 'Positivo' : 'Negativo' },
    { title: 'Retorno Ano', value: `${(rand() * 30 - 5).toFixed(2)}%` },
  ];

  const points = Array.from({ length: 20 }).map((_, i) => base * (1 + (Math.sin(i / 3) * 0.05 + (i / 20) * growth)));

  const txs = Array.from({ length: 6 }).map((_, i) => ({
    id: `${id}-tx-${i}`,
    description: i % 2 === 0 ? 'Compra' : 'Venda',
    amount: (i % 2 === 0 ? '-' : '+') + `R$ ${(rand() * 2000 + 50).toFixed(2)}`,
    date: new Date(Date.now() - i * 86400000).toLocaleDateString('pt-BR'),
  }));

  return { kpis, points, txs };
}

export default async function CarteiraDashboard({ params }: Props) {
  // Next.js requires awaiting params for sync-dynamic-apis safety
  const { id } = (await params) as { id: string };
  const name = id.replace('-', ' ');

  const isPrincipal = id === 'principal';
  const { kpis, points, txs } = isPrincipal ? { kpis: [], points: [], txs: [] } : makeFakeData(id);

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light capitalize">Carteira: {name}</h1>
            <div className="mt-1 text-sm text-gray-400">ID: {id}</div>
          </div>
          <div className="text-sm text-gray-300">Dashboard (dados fictícios)</div>
        </header>

        {isPrincipal ? (
          <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-md bg-gray-800/50 p-4 text-gray-300">
                <div className="mb-2 text-lg font-medium">Carteira Principal</div>
                <div className="text-sm">Esta carteira não possui dados pré-cadastrados. Use o botão abaixo para cadastrar ativos na categoria <strong>Ações</strong>.</div>
              </div>
            </div>
            <div>
              <AssetManager walletId={id} />
            </div>
          </section>
        ) : (
          <>
            <section className="mb-6">
              <Kpis items={kpis} />
            </section>

            <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-md bg-gray-800/50 p-4">
                  <div className="mb-3 text-sm text-gray-300">Performance</div>
                  <LineChart points={points.map((p) => Math.round(p))} />
                </div>
              </div>

              <div>
                <RecentTransactions items={txs} />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
