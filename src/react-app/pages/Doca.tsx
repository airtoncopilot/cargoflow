import { useState } from 'react';
import { supabase } from '@/shared/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Warehouse, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function Doca() {
  const navigate = useNavigate();
  const [doca, setDoca] = useState('');
  const [nota, setNota] = useState('');
  const [success, setSuccess] = useState(false);

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (doca && nota) {
      try {
        // obter codigo do usuário logado (salvo no login)
        const codigoUsuarioStr = localStorage.getItem('usuarioCodigo');
        const codigoUsuario = Number(codigoUsuarioStr);
        if (!Number.isFinite(codigoUsuario)) {
          throw new Error('Sessão inválida. Faça login novamente.');
        }

        // upsert endereço (doca)
        const { data: enderecosExist, error: errBuscaEnd } = await supabase
          .from('endereco')
          .select('*')
          .eq('descricao', doca)
          .eq('codigo_usuario', codigoUsuario)
          .limit(1);
        if (errBuscaEnd) throw errBuscaEnd;

        let endereco = enderecosExist && enderecosExist.length > 0 ? enderecosExist[0] : null;
        if (!endereco) {
          const { data: enderecoNovo, error: errEndIns } = await supabase
            .from('endereco')
            .insert([{ codigo_usuario: codigoUsuario, descricao: doca }])
            .select()
            .single();
          if (errEndIns) throw errEndIns;
          endereco = enderecoNovo;
        }

        if (!endereco) throw new Error('Falha ao obter/criar doca');

        // inserir nota
        // enviar como string para suportar números grandes
        const nunotaVal = nota.trim() || null;
        const { data: notaCriada, error: errNota } = await supabase
          .from('nota')
          .insert([{ codigo_usuario: codigoUsuario, codigo_endereco: endereco.codigo, chavenfe: nunotaVal }])
          .select()
          .single();

        if (errNota) throw errNota;

        if (notaCriada) {
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            setDoca('');
            setNota('');
          }, 3000);
        } else {
          alert('Erro ao inserir nota');
        }
      } catch (error) {
        console.error('Erro ao registrar nota na doca:', error);
        const message = (error as { message?: string }).message || 'Erro ao registrar nota na doca. Tente novamente.';
        alert(message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50"></div>
      
      {/* Header */}
      <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="px-6 py-4 flex items-center space-x-4">
          <button
            onClick={() => navigate('/menu')}
            className="p-2 text-blue-200 hover:text-white hover:bg-white/20 rounded-xl transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Armazenar Nota na Doca</h1>
              <p className="text-sm text-blue-200">Registrar notas fiscais</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative p-6">
        <div className="max-w-md mx-auto">
          {success && (
            <div className="mb-6 bg-green-500/20 border border-green-500/50 rounded-2xl p-4 flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-300 font-semibold">Nota registrada com sucesso!</p>
                <p className="text-green-200 text-sm">Doca: {doca} | Nota: {nota}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Doca */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <Warehouse className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Identificar Doca</h3>
              </div>
              
              <input
                type="text"
                placeholder="Código da doca"
                value={doca}
                onChange={(e) => setDoca(e.target.value)}
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm transition-all"
                required
              />
            </div>

            {/* Campo Nota */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Identificar Nota Fiscal</h3>
              </div>
              
              <input
                type="text"
                placeholder="Número da nota fiscal"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
                required
              />
            </div>

            {/* Botão Registrar */}
            <button
              type="submit"
              disabled={!doca || !nota}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-5 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <CheckCircle className="w-6 h-6" />
              <span>Registrar Nota na Doca</span>
            </button>
          </form>

          {/* Instruções */}
          <div className="mt-8 bg-blue-500/20 border border-blue-500/50 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-blue-300 font-semibold text-sm">Instruções:</p>
                <ul className="text-blue-200 text-sm mt-1 space-y-1">
                  <li>• Digite o código da doca</li>
                  <li>• Digite o número da nota fiscal</li>
                  <li>• Confirme o registro</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
