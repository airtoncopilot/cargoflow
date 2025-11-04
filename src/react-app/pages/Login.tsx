import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, User, Lock, LogIn } from 'lucide-react';
import { supabase } from '@/shared/supabase';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!usuario || !senha) return;

    // busca usuário por login
    const { data: encontrados, error: errSel } = await supabase
      .from('usuario')
      .select('*')
      .eq('login', usuario)
      .limit(1);

    if (errSel) {
      setError('Erro ao autenticar: ' + errSel.message);
      return;
    }

    const registro = encontrados && encontrados.length > 0 ? encontrados[0] : null;
    if (!registro || registro.senha !== senha) {
      setError('Usuário ou senha inválidos.');
      return;
    }

    // guarda o código do usuário logado
    try {
      localStorage.setItem('usuarioCodigo', String(registro.codigo));
      localStorage.setItem('usuarioLogin', String(registro.login));
    } catch {}

    navigate('/menu');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50"></div>
      
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">DocXpress</h1>
            <p className="text-blue-200">Sistema de Logística</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-2xl p-4 text-center">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Usuário"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Entrar</span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-blue-200 text-sm">
              Sistema de gestão de carregamento e expedição
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
