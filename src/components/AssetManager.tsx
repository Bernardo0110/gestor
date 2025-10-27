"use client";
import React, { useEffect, useState } from 'react';

type Category =
  | 'Renda Fixa'
  | 'Acoes'
  | 'Tesouro Direto'
  | 'ETFs'
  | 'Cryptomoedas'
  | 'BDRs'
  | 'FIIs'
  | 'Outros';

type Asset = {
  id: string;
  ticker?: string;
  quantidade?: number;
  precoMedio?: number;
  category: Category;
  // renda fixa specific
  rfType?: string; // cdb, cri, cra, lci, lca...
  valorInvestido?: number;
  dataOperacao?: string; // ISO date
  dataVencimento?: string; // ISO date
  taxa?: number;
  totalPago?: number;
  indexador?: 'CDI' | 'IPCA' | 'Prefixado' | 'SELIC';
  // renda fixa nome and percentual
  nome?: string;
  // tesouro direto subtype
  tdType?: string;
  precoUnitario?: number;
  corretora?: string;
  descricao?: string;
  dataAplicacao?: string;
  percentual?: number; // taxa a.a.
  transactions?: Transaction[];
};

type Transaction = {
  id: string;
  date: string; // ISO
  quantidade?: number;
  preco?: number;
  valorInvestido?: number;
  tipo?: 'compra' | 'venda' | 'aporte';
};

function storageKey(walletId: string) {
  return `carteira:${walletId}:assets`;
}

export default function AssetManager({ walletId }: { walletId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [ticker, setTicker] = useState('');
  const [quantidade, setQuantidade] = useState<number | ''>('');
  const [precoMedio, setPrecoMedio] = useState<number | ''>('');
  const [category, setCategory] = useState<Category>('Acoes');
  // renda fixa states
  const [rfType, setRfType] = useState('CDB');
  const [tdType, setTdType] = useState('Tesouro IPCA');
  const [dataCompra, setDataCompra] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState<number | ''>('');
  const [corretora, setCorretora] = useState('');
  const [descricao, setDescricao] = useState('');
  const [taxa, setTaxa] = useState<number | ''>('');
  const [totalPago, setTotalPago] = useState<number | ''>('');
  const [valorInvestido, setValorInvestido] = useState<number | ''>('');
  const [dataOperacao, setDataOperacao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [indexador, setIndexador] = useState<'CDI' | 'IPCA' | 'Prefixado' | 'SELIC'>('CDI');
  const [nome, setNome] = useState('');
  const [percentual, setPercentual] = useState<number | ''>('');
  const [formVisible, setFormVisible] = useState(false);
  const [formStep, setFormStep] = useState<'select' | 'form'>('select');
  const [tempCategory, setTempCategory] = useState<Category>('Acoes');
  const [txModalAsset, setTxModalAsset] = useState<Asset | null>(null);
  const [sellModal, setSellModal] = useState<{
    assetId: string;
    quantidade: number | '';
    preco: number | '';
    date: string;
  } | null>(null);

  function isPercentualValidForIndexador(idx: typeof indexador, val: number) {
    if (isNaN(val)) return false;
    if (idx === 'CDI' || idx === 'SELIC') {
      // percent as % of CDI/SELIC: 80% - 130%
      return val >= 80 && val <= 130;
    }
    if (idx === 'IPCA') {
      // IPCA + X% : allow -100..100 (but realistically 0..100). We'll require >= -100 and <= 1000 to be flexible
      return val >= -100 && val <= 1000;
    }
    if (idx === 'Prefixado') {
      // absolute annual rate in percent, reasonable 0..100
      return val >= 0 && val <= 100;
    }
    return false;
  }

  function formatPercentualDisplay(idx: typeof indexador | undefined, val: number | undefined) {
    if (val === undefined) return '-';
    if (idx === 'CDI' || idx === 'SELIC') return `${val}% do ${idx}`;
    if (idx === 'IPCA') return `IPCA + ${val}%`;
    if (idx === 'Prefixado') return `${val}% a.a.`;
    return `${val}%`;
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(walletId));
      if (raw) setAssets(JSON.parse(raw));
    } catch (e) {
      console.error('failed to read assets', e);
    }
  }, [walletId]);

  function persist(next: Asset[]) {
    setAssets(next);
    try {
      localStorage.setItem(storageKey(walletId), JSON.stringify(next));
    } catch (e) {
      console.error('failed to persist assets', e);
    }
  }

  function addAsset(e?: React.FormEvent) {
    e?.preventDefault();

    // basic validations
    if (category === 'Renda Fixa') {
      if (!nome.trim()) return;
      if (!valorInvestido || Number(valorInvestido) <= 0) return;
      if (percentual === '' || !isPercentualValidForIndexador(indexador, Number(percentual))) {
        console.error('Percentual inválido para o indexador selecionado');
        return;
      }
    } else if (category === 'Tesouro Direto') {
      if (!dataCompra) return;
      if (!dataVencimento) return;
      if (!quantidade || Number(quantidade) <= 0) return;
      if (!precoUnitario || Number(precoUnitario) <= 0) return;
      if (!corretora.trim()) return;
    } else {
      if (category === 'Cryptomoedas') {
        if (!nome.trim()) return;
      } else {
        if (!ticker.trim()) return;
      }
    }

    const idLabel = category === 'Renda Fixa' ? (nome || rfType) : category === 'Tesouro Direto' ? (tdType + (descricao ? ` - ${descricao}` : '')) : ticker;

    const asset: Asset = {
      id: `${idLabel || category}-${Date.now()}`,
      category,
      ticker: category === 'Renda Fixa' ? undefined : (ticker ? ticker.toUpperCase().trim() : undefined),
      quantidade: category === 'Renda Fixa' ? undefined : Number(quantidade) || 0,
      precoMedio: category === 'Renda Fixa'
        ? undefined
        : category === 'Cryptomoedas'
        ? (Number(quantidade) ? (((totalPago === '' ? 0 : Number(totalPago)) - (taxa === '' ? 0 : Number(taxa))) / Number(quantidade)) : 0)
        : Number(precoMedio) || 0,
      rfType: category === 'Renda Fixa' ? rfType : undefined,
      tdType: category === 'Tesouro Direto' ? tdType : undefined,
      precoUnitario: category === 'Tesouro Direto' ? Number(precoUnitario) || 0 : undefined,
      corretora: category === 'Tesouro Direto' ? (corretora.trim() || undefined) : category === 'Cryptomoedas' ? (corretora.trim() || undefined) : undefined,
      descricao: category === 'Tesouro Direto' ? (descricao.trim() || undefined) : undefined,
      dataAplicacao: category === 'Tesouro Direto' ? (dataCompra || undefined) : undefined,
      valorInvestido: category === 'Renda Fixa' ? (Number(valorInvestido) || 0) : category === 'Tesouro Direto' ? (Number(valorInvestido) || (Number(quantidade) || 0) * (Number(precoUnitario) || 0)) : undefined,
      dataOperacao: category === 'Renda Fixa' ? (dataOperacao || undefined) : category === 'Tesouro Direto' ? (dataCompra || undefined) : dataOperacao || undefined,
      dataVencimento: category === 'Renda Fixa' || category === 'Tesouro Direto' ? dataVencimento || undefined : undefined,
      nome: category === 'Renda Fixa' ? nome.trim() || undefined : category === 'Cryptomoedas' ? nome.trim() || undefined : undefined,
  taxa: category === 'Cryptomoedas' ? (taxa === '' ? undefined : Number(taxa)) : undefined,
  totalPago: category === 'Cryptomoedas' ? (totalPago === '' ? undefined : Number(totalPago)) : undefined,
  indexador: category === 'Renda Fixa' ? indexador : undefined,
      percentual: category === 'Renda Fixa' ? (Number(percentual) || 0) : undefined,
    };

    // merge with existing if same ticker/category (non renda fixa)
    if (category !== 'Renda Fixa' && asset.ticker) {
      const key = asset.ticker.toUpperCase().trim();
      const existing = assets.find((a) => (a.ticker ?? '').toUpperCase().trim() === key && a.category === category);
      if (existing) {
        const oldQty = Number(existing.quantidade ?? 0);
        const oldAvg = Number(existing.precoMedio ?? 0);
        const addQty = Number(asset.quantidade ?? 0);
        const addAvg = Number(asset.precoMedio ?? 0);
        const totalQty = oldQty + addQty;
        const mergedAvg = totalQty === 0 ? 0 : ((oldQty * oldAvg) + (addQty * addAvg)) / totalQty;
        const txDate = asset.dataOperacao ? new Date(asset.dataOperacao).toISOString() : new Date().toISOString();
        const merged: Asset = {
          ...existing,
          quantidade: totalQty,
          precoMedio: mergedAvg,
          dataOperacao: asset.dataOperacao || existing.dataOperacao,
          dataVencimento: asset.dataVencimento || existing.dataVencimento,
          transactions: [
            ...(existing.transactions ?? []),
            { id: `tx-${Date.now()}`, date: txDate, quantidade: addQty, preco: addAvg, tipo: 'compra' },
          ],
        };
        persist([merged, ...assets.filter((a) => a !== existing)]);
      } else {
        const initialDate = asset.dataOperacao ? new Date(asset.dataOperacao).toISOString() : new Date().toISOString();
        if (asset.category === 'Renda Fixa') {
          asset.transactions = [{ id: `tx-${Date.now()}`, date: initialDate, valorInvestido: asset.valorInvestido, tipo: 'compra' }];
        } else if (asset.category === 'Tesouro Direto') {
          asset.quantidade = Number(quantidade) || 0;
          asset.precoUnitario = Number(precoUnitario) || 0;
          asset.transactions = [{ id: `tx-${Date.now()}`, date: initialDate, quantidade: asset.quantidade, preco: asset.precoUnitario, tipo: 'compra' }];
        } else {
          asset.transactions = [{ id: `tx-${Date.now()}`, date: initialDate, quantidade: asset.quantidade, preco: asset.precoMedio, tipo: 'compra' }];
        }
        persist([asset, ...assets]);
      }
    } else {
      persist([asset, ...assets]);
    }

    // reset fields
    setTicker('');
    setQuantidade('');
    setPrecoMedio('');
    setCategory('Acoes');
    setRfType('CDB');
    setValorInvestido('');
    setDataOperacao('');
    setDataVencimento('');
    setIndexador('CDI');
    setNome('');
    setTotalPago('');
    setTaxa('');
    setPercentual('');
    setTdType('Tesouro IPCA');
    setDataCompra('');
    setPrecoUnitario('');
    setCorretora('');
    setDescricao('');
  }

  function removeAsset(id: string) {
    persist(assets.filter((a) => a.id !== id));
  }

  function handleSell() {
    if (!sellModal) return;
    const { assetId, quantidade: qty, preco, date } = sellModal;
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return setSellModal(null);
    const available = Number(asset.quantidade ?? 0);
    const sellQty = Number(qty ?? 0);
    if (sellQty <= 0 || sellQty > available) {
      console.error('Quantidade de venda inválida');
      return;
    }

    // create venda transaction
    const venda: Transaction = { id: `tx-${Date.now()}`, date: new Date(date).toISOString(), quantidade: sellQty, preco: Number(preco) || undefined, tipo: 'venda' };

    const updated: Asset = { ...asset, quantidade: available - sellQty, transactions: [ ...(asset.transactions ?? []), venda ] };
    let next = assets.map((a) => (a.id === assetId ? updated : a));
    // remove if zero
    if (updated.quantidade === 0) next = next.filter((a) => a.id !== assetId);
    persist(next);
    setSellModal(null);
    setTxModalAsset(updated);
  }

  return (
    <div className="rounded-md bg-gray-800/60 p-4 text-white">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-medium">Gerenciar Ativos</h3>
        {!formVisible ? (
          <button onClick={() => { setFormVisible(true); setFormStep('select'); setTempCategory('Acoes'); }} className="rounded bg-blue-600 px-3 py-2 font-medium">Cadastrar Ativo</button>
        ) : (
          <button onClick={() => { setFormVisible(false); setFormStep('select'); }} className="rounded bg-gray-600 px-3 py-2">Fechar</button>
        )}
      </div>

      {formVisible && (
        <div className="mb-4">
          {formStep === 'select' ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <select className="rounded p-2 bg-white text-black" value={tempCategory} onChange={(e) => setTempCategory(e.target.value as Category)}>
                <option>Renda Fixa</option>
                <option>Acoes</option>
                <option>Tesouro Direto</option>
                <option>ETFs</option>
                <option>Cryptomoedas</option>
                <option>BDRs</option>
                <option>FIIs</option>
                <option>Outros</option>
              </select>
              <div className="sm:col-span-3 flex gap-2">
                <button onClick={() => { setCategory(tempCategory); setFormStep('form'); }} className="rounded bg-blue-600 px-3 py-2">Continuar</button>
                <button onClick={() => { setFormVisible(false); setFormStep('select'); }} className="rounded bg-gray-600 px-3 py-2">Cancelar</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-2">Cadastrando: <strong>{category}</strong></div>
              <form onSubmit={addAsset} className="grid gap-2 sm:grid-cols-4">
                {category === 'Renda Fixa' ? (
                  <>
                    <input className="rounded p-2 bg-white text-black placeholder-gray-500" placeholder="Nome (ex: CDB do Banco X)" value={nome} onChange={(e) => setNome(e.target.value)} />
                    <select className="rounded p-2 bg-white text-black" value={rfType} onChange={(e) => setRfType(e.target.value)}>
                      <option>CDB</option>
                      <option>CRI</option>
                      <option>CRA</option>
                      <option>LCI</option>
                      <option>LCA</option>
                      <option>Outros</option>
                    </select>
                    <input className="rounded p-2 bg-white text-black placeholder-gray-500" placeholder="Valor investido" type="number" step="0.01" value={valorInvestido as any} onChange={(e) => setValorInvestido(e.target.value === '' ? '' : Number(e.target.value))} />
                    <input className="rounded p-2 bg-white text-black" placeholder="Data operação" type="date" value={dataOperacao} onChange={(e) => setDataOperacao(e.target.value)} />
                    <input className="rounded p-2 bg-white text-black" placeholder="Data vencimento" type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
                    <select className="rounded p-2 bg-white text-black" value={indexador} onChange={(e) => { setIndexador(e.target.value as any); setPercentual(''); }}>
                      <option>CDI</option>
                      <option>IPCA</option>
                      <option>Prefixado</option>
                      <option>SELIC</option>
                    </select>
                    <input className="rounded p-2 bg-white text-black placeholder-gray-500" placeholder={indexador === 'CDI' || indexador === 'SELIC' ? '80 - 130 (ex: 100)' : indexador === 'IPCA' ? 'ex: 8 (IPCA + 8%)' : 'ex: 15 (15% a.a.)'} type="number" step="0.01" value={percentual as any} onChange={(e) => setPercentual(e.target.value === '' ? '' : Number(e.target.value))} />
                  </>
                ) : category === 'Tesouro Direto' ? (
                  <>
                    <label className="text-sm text-gray-200 sm:col-span-4">Tipo de Tesouro</label>
                    <select className="rounded p-2 bg-white text-black sm:col-span-4" value={tdType} onChange={(e) => setTdType(e.target.value)}>
                      <option>Tesouro IPCA</option>
                      <option>Tesouro IPCA com Juros Semestrais</option>
                      <option>Tesouro IGPM com Juros Semestrais</option>
                      <option>Pré-fixado</option>
                      <option>Pré-fixado com Juros Semestrais</option>
                      <option>Renda/Educa+</option>
                      <option>SELIC</option>
                    </select>

                    <label className="text-sm text-gray-200 sm:col-span-4">Datas</label>
                    <div className="sm:col-span-4 flex gap-2 flex-wrap">
                      <input className="rounded p-2 bg-white text-black flex-1 min-w-0" aria-label="Data de compra" title="Data de compra" placeholder="Data de compra" type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} />
                      <input className="rounded p-2 bg-white text-black flex-1 min-w-0" aria-label="Data de vencimento" title="Data de vencimento" placeholder="Data de vencimento" type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
                    </div>

                    <label className="text-sm text-gray-200 sm:col-span-4">Quantidade e preço</label>
                    <div className="sm:col-span-4 flex gap-2 flex-wrap">
                      <input className="rounded p-2 bg-white text-black placeholder-gray-500 flex-1 min-w-0" placeholder="Quantidade" type="number" value={quantidade as any} onChange={(e) => setQuantidade(e.target.value === '' ? '' : Number(e.target.value))} />
                      <input className="rounded p-2 bg-white text-black placeholder-gray-500 flex-1 min-w-0" placeholder="Preço unitário (R$)" type="number" step="0.01" value={precoUnitario as any} onChange={(e) => setPrecoUnitario(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>

                    <label className="text-sm text-gray-200 sm:col-span-4">Corretora / Descrição</label>
                    <div className="sm:col-span-4 flex gap-2 flex-wrap">
                      <input className="rounded p-2 bg-white text-black placeholder-gray-500 flex-1 min-w-0" placeholder="Corretora" value={corretora} onChange={(e) => setCorretora(e.target.value)} />
                      <input className="rounded p-2 bg-white text-black placeholder-gray-500 flex-1 min-w-0" placeholder="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    {category === 'Cryptomoedas' ? (
                      <>
                        <input className="rounded p-2 bg-white text-black placeholder-gray-500" placeholder="Nome (ex: BTC/BRL)" value={nome} onChange={(e) => setNome(e.target.value)} />
                        <input className="rounded p-2 bg-white text-black placeholder-gray-500" placeholder="Quantidade" type="number" value={quantidade as any} onChange={(e) => setQuantidade(e.target.value === '' ? '' : Number(e.target.value))} />
                        <input className="rounded p-2 bg-white text-black placeholder-gray-500" placeholder="Total pago (R$)" type="number" step="0.01" value={totalPago as any} onChange={(e) => setTotalPago(e.target.value === '' ? '' : Number(e.target.value))} />
                        <input className="rounded p-2 bg-white text-black placeholder-gray-500" placeholder="Taxa (opcional)" type="number" step="0.01" value={taxa as any} onChange={(e) => setTaxa(e.target.value === '' ? '' : Number(e.target.value))} />
                        <input className="rounded p-2 bg-white text-black placeholder-gray-500" placeholder="Corretora" value={corretora} onChange={(e) => setCorretora(e.target.value)} />
                      </>
                    ) : (
                      <>
                        <input className="rounded p-2 bg-white text-black placeholder-gray-500" placeholder="Ticket" value={ticker} onChange={(e) => setTicker(e.target.value)} />
                        <input className="rounded p-2 bg-white text-black placeholder-gray-500" placeholder="Quantidade" type="number" value={quantidade as any} onChange={(e) => setQuantidade(e.target.value === '' ? '' : Number(e.target.value))} />
                        <input className="rounded p-2 bg-white text-black placeholder-gray-500" placeholder="Preço médio" type="number" step="0.01" value={precoMedio as any} onChange={(e) => setPrecoMedio(e.target.value === '' ? '' : Number(e.target.value))} />
                        <input className="rounded p-2 bg-white text-black" placeholder="Data operação" type="date" value={dataOperacao} onChange={(e) => setDataOperacao(e.target.value)} />
                      </>
                    )}
                  </>
                )}

                <div className="sm:col-span-4 flex gap-2">
                  <button type="submit" className="w-full rounded bg-blue-600 px-3 py-2 font-medium">Cadastrar</button>
                  <button type="button" onClick={() => setFormStep('select')} className="rounded bg-gray-600 px-3 py-2">Voltar</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {assets.length === 0 ? (
        <div className="text-sm text-gray-400">Nenhum ativo cadastrado nesta carteira.</div>
      ) : (
        <div className="space-y-4">
          {(['Renda Fixa','Acoes','Tesouro Direto','ETFs','Cryptomoedas','BDRs','FIIs','Outros'] as Category[]).map((cat) => {
            const group = assets.filter((a) => a.category === cat);
            if (group.length === 0) return null;
            return (
              <div key={cat}>
                <div className="mb-2 text-sm font-semibold text-gray-300">{cat} ({group.length})</div>
                <ul className="space-y-2">
                  {group.map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded bg-gray-700/40 p-2">
                      <div>
                        <div>
                          <button onClick={() => setTxModalAsset(a)} className="font-medium underline hover:text-blue-300">{a.category === 'Renda Fixa' ? (a.nome ?? a.rfType ?? '-') : (a.ticker ?? a.nome ?? '-')}</button>
                        </div>
                        {a.category === 'Renda Fixa' ? (
                          <div className="text-xs text-gray-300">
                            <div>Nome: {a.nome ?? a.rfType}</div>
                            <div>Tipo: {a.rfType} • Valor investido: R$ {(a.valorInvestido ?? 0).toFixed(2)}</div>
                              <div>Vencimento: {a.dataVencimento ?? '-'}</div>
                            <div>Indexador: {a.indexador ?? '-'} • {formatPercentualDisplay(a.indexador, a.percentual)}</div>
                          </div>
                        ) : a.category === 'Tesouro Direto' ? (
                          <div className="text-xs text-gray-300">
                            <div>Tipo TD: {a.tdType ?? '-'}</div>
                            <div>Quantidade: {a.quantidade ?? 0} • Preço unit.: R$ {(a.precoUnitario ?? 0).toFixed(2)}</div>
                            <div>Valor investido: R$ {(a.valorInvestido ?? 0).toFixed(2)}</div>
                            <div>Vencimento: {a.dataVencimento ?? '-'}</div>
                            <div>Corretora: {a.corretora ?? '-'}{a.descricao ? ` • ${a.descricao}` : ''}</div>
                          </div>
                        ) : (
                          a.category === 'Cryptomoedas' ? (
                            <div className="text-xs text-gray-300">
                              <div>Qtd: {a.quantidade ?? 0}</div>
                              <div>Financeiro: R$ {a.totalPago !== undefined ? Number(a.totalPago).toFixed(2) : '0.00'}</div>
                              <div>P. Médio: R$ {a.precoMedio !== undefined ? Number(a.precoMedio).toFixed(2) : '0.00'}</div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-300">Qtd: {a.quantidade ?? 0} • Preço médio: R$ {(a.precoMedio ?? 0).toFixed(2)}</div>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {(a.quantidade && a.quantidade > 0) ? (
                          <button onClick={() => setSellModal({ assetId: a.id, quantidade: '', preco: '', date: new Date().toISOString().slice(0,10) })} className="rounded bg-yellow-600 px-2 py-1 text-sm">Vender</button>
                        ) : null}
                        <button onClick={() => removeAsset(a.id)} className="rounded bg-red-600 px-2 py-1 text-sm">Apagar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      {txModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="max-w-md w-full rounded bg-gray-900 p-4 text-white">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">Transações — {txModalAsset.ticker ?? txModalAsset.nome}</div>
              <button onClick={() => setTxModalAsset(null)} className="rounded bg-gray-700 px-2 py-1">Fechar</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {(txModalAsset.transactions ?? []).map((t) => (
                <div key={t.id} className="rounded bg-gray-800 p-2">
                  <div className="text-sm">{new Date(t.date).toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-gray-300">Qtd: {t.quantidade ?? '-'} • Preço: {t.preco ? `R$ ${t.preco.toFixed(2)}` : '-'} • Tipo: {t.tipo}</div>
                </div>
              ))}
              {(txModalAsset.transactions ?? []).length === 0 && <div className="text-sm text-gray-400">Nenhuma transação encontrada.</div>}
            </div>
          </div>
        </div>
      )}
      {sellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="max-w-md w-full rounded bg-gray-900 p-4 text-white">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">Vender — {assets.find(a=>a.id===sellModal.assetId)?.ticker ?? assets.find(a=>a.id===sellModal.assetId)?.nome}</div>
              <button onClick={() => setSellModal(null)} className="rounded bg-gray-700 px-2 py-1">Fechar</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSell(); }} className="grid gap-2">
              <input className="rounded p-2 bg-white text-black" placeholder="Quantidade" type="number" value={sellModal.quantidade as any} onChange={(e)=> setSellModal(s=> s ? {...s, quantidade: e.target.value === '' ? '' : Number(e.target.value)} : s)} />
              <input className="rounded p-2 bg-white text-black" placeholder="Preço" type="number" step="0.01" value={sellModal.preco as any} onChange={(e)=> setSellModal(s=> s ? {...s, preco: e.target.value === '' ? '' : Number(e.target.value)} : s)} />
              <input className="rounded p-2 bg-white text-black" placeholder="Data venda" type="date" value={sellModal.date} onChange={(e)=> setSellModal(s=> s ? {...s, date: e.target.value} : s)} />
              <div className="flex gap-2">
                <button type="submit" className="rounded bg-yellow-600 px-3 py-2">Confirmar Venda</button>
                <button type="button" onClick={()=> setSellModal(null)} className="rounded bg-gray-600 px-3 py-2">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
