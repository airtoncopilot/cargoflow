import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Search, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { supabase } from '@/shared/supabase';

type NotaRegistro = {
  codigo: number;
  codigo_endereco: number;
  codigo_usuario: number;
  nunota: string | null;
};

type EnderecoRegistro = {
  codigo: number;
  descricao: string | null;
};

export default function ConsultaXML() {
  const navigate = useNavigate();
  const [buscaTexto, setBuscaTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    encontrado: boolean;
    doca?: string | null;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setResultado(null);
    const termo = buscaTexto.trim();
    if (!termo) {
      setErro('Informe o valor a buscar no campo nunota.');
      return;
    }

    setCarregando(true);
    try {
      // Busca direta em nunota pelo valor informado
      const { data: notas, error: errNota } = await supabase
        .from('nota')
        .select('codigo, codigo_endereco, codigo_usuario, nunota')
        .eq('nunota', termo)
        .limit(1);
      if (errNota) throw errNota;

      const notasRows: NotaRegistro[] = (notas as unknown as NotaRegistro[] | null) ?? [];
      const nota: NotaRegistro | null = notasRows.length > 0 ? notasRows[0] : null;

      if (!nota) {
        setResultado({ encontrado: false });
        return;
      }

      // Busca o endereço vinculado
      const { data: enderecos, error: errEnd } = await supabase
        .from('endereco')
        .select('codigo, descricao')
        .eq('codigo', nota.codigo_endereco)
        .limit(1);
      if (errEnd) throw errEnd;

      const endRows: EnderecoRegistro[] = (enderecos as unknown as EnderecoRegistro[] | null) ?? [];
      const endereco: EnderecoRegistro | null = endRows.length > 0 ? endRows[0] : null;
      setResultado({ encontrado: true, doca: endereco?.descricao ?? null });
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao consultar o XML');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50"></div>

      {/* Header */}
      <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/menu')}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/20 rounded-xl transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Consulta de XML</h1>
                <p className="text-sm text-blue-200">Verificar vínculo de nota por XML</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="relative p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-blue-200 text-sm">Informe o valor para buscar no campo nunota</label>
          <input
            value={buscaTexto}
            onChange={(e) => setBuscaTexto(e.target.value)}
            className="w-full rounded-2xl bg-white/10 border border-white/20 p-4 text-white placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="Ex.: 163748281 ou 2925...6734632"
          />
          <button
            type="submit"
            disabled={carregando}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl transition-all"
          >
            <Search className="w-4 h-4" />
            <span>{carregando ? 'Consultando...' : 'Consultar'}</span>
          </button>
        </form>

        {/* Feedback */}
        {erro && (
          <div className="mt-4 flex items-center space-x-2 text-red-200">
            <AlertCircle className="w-5 h-5" />
            <span>{erro}</span>
          </div>
        )}

        {resultado && (
          <div className="mt-6">
            {resultado.encontrado ? (
              <div className="flex items-center space-x-3 text-green-200">
                <CheckCircle className="w-5 h-5" />
                <span>Nota encontrada.</span>
              <div className="flex items-center space-x-2 text-blue-200 ml-4">
                  <MapPin className="w-5 h-5" />
                  <span>Doca vinculada: {resultado.doca || 'Não informada'}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-yellow-200">
                <AlertCircle className="w-5 h-5" />
              <span>Nota não encontrada para o número informado.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


