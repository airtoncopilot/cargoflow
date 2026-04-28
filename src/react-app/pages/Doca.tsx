import { useState } from 'react';
import { supabase } from '@/shared/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Warehouse, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

export default function Doca() {
  const navigate = useNavigate();
  const [doca, setDoca] = useState('');
  const [notas, setNotas] = useState<string[]>(['']);
  const [success, setSuccess] = useState(false);

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const notasValidas = notas.map((item) => item.trim()).filter(Boolean);
    if (doca && notasValidas.length > 0) {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const authId = authData.user?.id;
        if (!authId) {
          throw new Error('Sessão inválida. Faça login novamente.');
        }

        const { data: usuarios, error: errUsuario } = await supabase
          .from('usuario')
          .select('codigo')
          .eq('auth_id', authId)
          .limit(1);
        if (errUsuario) throw errUsuario;
        const codigoUsuario = usuarios?.[0]?.codigo;
        if (!codigoUsuario) {
          throw new Error('Usuário sem vínculo na tabela usuario.');
        }

        // upsert endereço (doca)
        const { data: enderecosByAuth, error: errBuscaEndAuth } = await supabase
          .from('endereco')
          .select('*')
          .eq('descricao', doca)
          .eq('auth_id', authId)
          .limit(1);
        if (errBuscaEndAuth) throw errBuscaEndAuth;

        let endereco = enderecosByAuth && enderecosByAuth.length > 0 ? enderecosByAuth[0] : null;
        if (!endereco) {
          const { data: enderecosByCodigo, error: errBuscaEndCodigo } = await supabase
            .from('endereco')
            .select('*')
            .eq('descricao', doca)
            .eq('codigo_usuario', codigoUsuario)
            .limit(1);
          if (errBuscaEndCodigo) throw errBuscaEndCodigo;
          endereco = enderecosByCodigo && enderecosByCodigo.length > 0 ? enderecosByCodigo[0] : null;
        }
        if (!endereco) {
          const { data: enderecoNovo, error: errEndIns } = await supabase
            .from('endereco')
            .insert([{ auth_id: authId, codigo_usuario: codigoUsuario, descricao: doca }])
            .select()
            .single();
          if (errEndIns) throw errEndIns;
          endereco = enderecoNovo;
        }

        if (!endereco) throw new Error('Falha ao obter/criar doca');

        // insere todas as notas informadas para a mesma doca
        const payloadNotas = notasValidas.map((notaAtual) => ({
          auth_id: authId,
          codigo_usuario: codigoUsuario,
          codigo_endereco: endereco.codigo,
          chavenfe: notaAtual,
        }));
        const { data: notasCriadas, error: errNota } = await supabase
          .from('nota')
          .insert(payloadNotas)
          .select()
;

        if (errNota) throw errNota;

        if (notasCriadas && notasCriadas.length > 0) {
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            setDoca('');
            setNotas(['']);
          }, 3000);
        } else {
          alert('Erro ao inserir notas');
        }
      } catch (error) {
        console.error('Erro ao registrar nota na doca:', error);
        const message = (error as { message?: string }).message || 'Erro ao registrar nota na doca. Tente novamente.';
        alert(message);
      }
    }
  };

  const handleNotaChange = (index: number, value: string) => {
    setNotas((prev) => {
      const next = [...prev];
      next[index] = value;

      const preenchido = value.trim().length > 0;
      const isUltimoCampo = index === next.length - 1;
      if (preenchido && isUltimoCampo && next.length < 5) {
        next.push('');
      }

      return next;
    });
  };

  const handleRemoverNota = (index: number) => {
    setNotas((prev) => {
      const next = prev.filter((_, idx) => idx !== index);

      if (next.length === 0) {
        return [''];
      }

      return next;
    });
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
                <p className="text-green-300 font-semibold">Notas registradas com sucesso!</p>
                <p className="text-green-200 text-sm">Doca: {doca}</p>
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
                <h3 className="text-lg font-semibold text-white">Identificar Notas Fiscais (máx. 5)</h3>
              </div>

              {notas.map((nota, index) => (
                <div key={`nota-${index}`} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Número da nota fiscal ${index + 1}`}
                    value={nota}
                    onChange={(e) => handleNotaChange(index, e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
                    required={index === 0}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoverNota(index)}
                    disabled={notas.length === 1}
                    className="inline-flex items-center justify-center p-3 rounded-xl border border-red-400/50 text-red-300 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Remover esta nota"
                    aria-label={`Remover nota ${index + 1}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Botão Registrar */}
            <button
              type="submit"
              disabled={!doca || notas.every((item) => !item.trim())}
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
