import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redireciona permanentemente o usuário para a página de seleção
  redirect('/selecionar-carteira');

  // Retornamos null porque o redirecionamento acontece no servidor
  return null;
}