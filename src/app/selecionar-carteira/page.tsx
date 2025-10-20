// Esta página será interativa, então a marcamos como um Client Component.
"use client"; 

// Importaremos o Link para navegar para a página do dashboard no futuro
import Link from 'next/link'; 

export default function SelecionarCarteiraPage() {
  // Dados fictícios para nossas carteiras
  const carteiras = [
    { id: 'principal', nome: 'Carteira Principal', tipo: 'Pessoal', avatar: '💼' },
    { id: 'cripto', nome: 'Criptomoedas', tipo: 'Pessoal', avatar: '🪙' },
    { id: 'simulacao', nome: 'Simulação Risco', tipo: 'Simulação', avatar: '🧪' },
    { id: 'buffett', nome: 'Warren Buffett', tipo: 'Tracking', avatar: '👴' },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="mb-12 text-4xl font-light md:text-5xl">Selecione uma Carteira</h1>
      
      {/* Grid com os perfis das carteiras */}
      <div className="flex flex-wrap items-center justify-center gap-8">
        {carteiras.map((carteira) => (
          // O Link fará cada card ser um link para o dashboard específico
          <Link key={carteira.id} href={`/carteira/${carteira.id}`}>
            <div className="group flex w-40 cursor-pointer flex-col items-center gap-4 text-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-md bg-gray-700 text-6xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-gray-600">
                {carteira.avatar}
              </div>
              <span className="text-xl text-gray-400 transition-colors group-hover:text-white">
                {carteira.nome}
              </span>
              <span className="rounded-full bg-blue-800 px-3 py-1 text-xs font-semibold">
                {carteira.tipo}
              </span>
            </div>
          </Link>
        ))}

        {/* Card para Adicionar Nova Carteira */}
        <div className="group flex w-40 cursor-pointer flex-col items-center gap-4 text-center">
          <div className="flex h-40 w-40 items-center justify-center rounded-md border-2 border-dashed border-gray-600 text-6xl text-gray-600 transition-all duration-300 group-hover:scale-110 group-hover:border-white group-hover:text-white">
            +
          </div>
          <span className="text-xl text-gray-400 transition-colors group-hover:text-white">
            Adicionar
          </span>
        </div>
      </div>
    </div>
  );
}