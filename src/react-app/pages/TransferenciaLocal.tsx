import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRightLeft,
  Search,
  MapPin,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/shared/supabase';

type NotaRegistro = {
  codigo: number;
  codigo_endereco: number;
  codigo_usuario: number;
  nunota: string | null;
  chavenfe: string | null;
};

type EnderecoRegistro = {
  codigo: number;
  descricao: string | null;
};

type AuditoriaTransferencia = {
  codigoNota: number;
  codigoEnderecoOrigem: number;
  descricaoEnderecoOrigem: string;
  codigoEnderecoDestino: number;
  descricaoEnderecoDestino: string;
};

export default function TransferenciaLocal() {
  const navigate = useNavigate();
  const [buscaNota, setBuscaNota] = useState('');
  const [novoEndereco, setNovoEndereco] = useState('');
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [carregandoTransferencia, setCarregandoTransferencia] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [notaEncontrada, setNotaEncontrada] = useState<NotaRegistro | null>(null);
  const [enderecoAtual, setEnderecoAtual] = useState<EnderecoRegistro | null>(null);
  const [auditoriaTransferencia, setAuditoriaTransferencia] = useState<AuditoriaTransferencia | null>(null);

  const buscarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setNotaEncontrada(null);
    setEnderecoAtual(null);
    setAuditoriaTransferencia(null);
    setNovoEndereco('');

    const termo = buscaNota.trim();
    if (!termo) {
      setErro('Informe o número da nota ou o XML para continuar.');
      return;
    }

    setCarregandoBusca(true);
    try {
      let nota: NotaRegistro | null = null;

      // Mesmo critério da tela Deletar Nota:
      // 1) busca exata por nunota/chavenfe
      const { data: encontradosExatos, error: errorBuscaExata } = await supabase
        .from('nota')
        .select('codigo, codigo_endereco, codigo_usuario, nunota, chavenfe')
        .or(`nunota.eq.${termo},chavenfe.eq.${termo}`)
        .limit(100);
      if (errorBuscaExata) throw errorBuscaExata;

      let encontrados = (encontradosExatos as NotaRegistro[] | null) ?? [];

      // 2) fallback por LIKE para cobrir diferenças de formatação
      if (encontrados.length === 0) {
        const { data: encontradosParciais, error: errorBuscaParcial } = await supabase
          .from('nota')
          .select('codigo, codigo_endereco, codigo_usuario, nunota, chavenfe')
          .or(`nunota.like.%${termo}%,chavenfe.like.%${termo}%`)
          .limit(100);
        if (errorBuscaParcial) throw errorBuscaParcial;
        encontrados = (encontradosParciais as NotaRegistro[] | null) ?? [];
      }

      // Mantido exatamente como na tela Deletar Nota:
      // usa o primeiro registro encontrado após busca exata/parcial.
      nota = encontrados.length > 0 ? encontrados[0] : null;

      if (!nota) {
        setErro('Nota não encontrada para o número/XML informado.');
        return;
      }

      let endereco: EnderecoRegistro | null = null;

      // Busca principal: codigo_endereco -> endereco.codigo
      const { data: enderecosPorCodigo, error: errEnderecoCodigo } = await supabase
        .from('endereco')
        .select('codigo, descricao')
        .eq('codigo', nota.codigo_endereco)
        .limit(1);
      if (errEnderecoCodigo) throw errEnderecoCodigo;

      const enderecosCodigoRows: EnderecoRegistro[] = (enderecosPorCodigo as EnderecoRegistro[] | null) ?? [];
      endereco = enderecosCodigoRows.length > 0 ? enderecosCodigoRows[0] : null;

      // Fallback: alguns registros antigos podem gravar codigo_endereco apontando para endereco.id
      if (!endereco) {
        const { data: enderecosPorId, error: errEnderecoId } = await supabase
          .from('endereco')
          .select('codigo, descricao')
          .eq('id', nota.codigo_endereco)
          .limit(1);
        if (errEnderecoId) throw errEnderecoId;

        const enderecosIdRows: EnderecoRegistro[] = (enderecosPorId as EnderecoRegistro[] | null) ?? [];
        endereco = enderecosIdRows.length > 0 ? enderecosIdRows[0] : null;
      }

      setNotaEncontrada(nota);
      setEnderecoAtual(endereco);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar nota.';
      setErro(message);
    } finally {
      setCarregandoBusca(false);
    }
  };

  const transferirLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!notaEncontrada) {
      setErro('Primeiro localize a nota para transferir.');
      return;
    }

    const descricaoDestino = novoEndereco.trim();
    if (!descricaoDestino) {
      setErro('Informe o endereço de destino.');
      return;
    }

    setCarregandoTransferencia(true);
    try {
      const codigoEnderecoOrigem = notaEncontrada.codigo_endereco;
      const descricaoEnderecoOrigem = enderecoAtual?.descricao ?? 'Origem não informada';

      const enderecoAtualTexto = enderecoAtual?.descricao?.trim().toLowerCase();
      if (enderecoAtualTexto && enderecoAtualTexto === descricaoDestino.toLowerCase()) {
        setErro('O endereço de destino deve ser diferente do endereço atual.');
        return;
      }

      const { data: enderecosExist, error: errBuscaEnd } = await supabase
        .from('endereco')
        .select('codigo, descricao')
        .eq('descricao', descricaoDestino)
        .limit(1);
      if (errBuscaEnd) throw errBuscaEnd;

      let enderecoDestino = (enderecosExist as EnderecoRegistro[] | null)?.[0] ?? null;
      if (!enderecoDestino) {
        const { data: novoEnderecoCriado, error: errCriarEnd } = await supabase
          .from('endereco')
          .insert([{ descricao: descricaoDestino }])
          .select('codigo, descricao')
          .single();
        if (errCriarEnd) throw errCriarEnd;
        enderecoDestino = novoEnderecoCriado as EnderecoRegistro;
      }

      // Transferência real por chave primária:
      // remove da origem ao atualizar o FK da nota para o codigo do destino.
      const { data: linhasAtualizadas, error: errUpdate } = await supabase
        .from('nota')
        .update({ codigo_endereco: enderecoDestino.codigo })
        .eq('codigo', notaEncontrada.codigo)
        .select('codigo, codigo_endereco');
      if (errUpdate) throw errUpdate;
      if (!linhasAtualizadas || linhasAtualizadas.length === 0) {
        throw new Error('Nenhuma linha foi atualizada. Verifique permissão de UPDATE (RLS) para a tabela nota.');
      }

      // Confirmação real: reconsulta a nota no banco após update.
      const { data: notaAtualizadaRows, error: errNotaAtualizada } = await supabase
        .from('nota')
        .select('codigo, codigo_endereco, codigo_usuario, nunota, chavenfe')
        .eq('codigo', notaEncontrada.codigo)
        .limit(1);
      if (errNotaAtualizada) throw errNotaAtualizada;

      const notaAtualizadaList: NotaRegistro[] = (notaAtualizadaRows as NotaRegistro[] | null) ?? [];
      const notaAtualizada = notaAtualizadaList.length > 0 ? notaAtualizadaList[0] : null;
      if (!notaAtualizada) {
        throw new Error('Não foi possível confirmar a nota após a transferência.');
      }
      if (notaAtualizada.codigo_endereco !== enderecoDestino.codigo) {
        throw new Error('A nota não foi movida para o endereço de destino.');
      }

      setNotaEncontrada(notaAtualizada);
      setEnderecoAtual(enderecoDestino);
      setAuditoriaTransferencia({
        codigoNota: notaAtualizada.codigo,
        codigoEnderecoOrigem,
        descricaoEnderecoOrigem,
        codigoEnderecoDestino: enderecoDestino.codigo,
        descricaoEnderecoDestino: enderecoDestino.descricao ?? 'Sem descrição',
      });
      setSucesso(
        `Nota transferida com sucesso de "${descricaoEnderecoOrigem}" para "${enderecoDestino.descricao ?? 'Sem descrição'}".`,
      );
      setNovoEndereco('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao transferir local.';
      setErro(message);
    } finally {
      setCarregandoTransferencia(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50"></div>

      <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="px-6 py-4 flex items-center space-x-4">
          <button
            onClick={() => navigate('/menu')}
            className="p-2 text-blue-200 hover:text-white hover:bg-white/20 rounded-xl transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Transferência de Local</h1>
              <p className="text-sm text-blue-200">Mover nota entre endereços</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative p-6 max-w-2xl mx-auto space-y-6">
        <form onSubmit={buscarNota} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-4">
          <label className="block text-blue-200 text-sm">Número da nota ou XML</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={buscaNota}
              onChange={(e) => setBuscaNota(e.target.value)}
              className="w-full sm:flex-1 px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ex.: 180165 ou chave XML"
            />
            <button
              type="submit"
              disabled={carregandoBusca}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-60 text-white px-5 py-4 sm:py-2 rounded-xl transition-all"
            >
              <Search className="w-4 h-4" />
              <span>{carregandoBusca ? 'Buscando...' : 'Localizar Nota'}</span>
            </button>
          </div>
        </form>

        {notaEncontrada && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-green-200">
              <CheckCircle className="w-5 h-5" />
              <span>Nota localizada no banco de dados.</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-200">
              <MapPin className="w-5 h-5" />
              <span>Endereço atual: {enderecoAtual?.descricao || 'Não informado'}</span>
            </div>

            <form onSubmit={transferirLocal} className="space-y-4 pt-2">
              <label className="block text-blue-200 text-sm">Para qual endereço deseja transferir?</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={novoEndereco}
                  onChange={(e) => setNovoEndereco(e.target.value)}
                  className="w-full sm:flex-1 px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Digite o endereço de destino"
                />
                <button
                  type="submit"
                  disabled={carregandoTransferencia}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-60 text-white px-5 py-4 sm:py-2 rounded-xl transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{carregandoTransferencia ? 'Transferindo...' : 'Transferir'}</span>
                </button>
              </div>
            </form>

            {auditoriaTransferencia && (
              <div className="mt-2 bg-slate-900/40 border border-white/20 rounded-xl p-4 text-sm text-blue-100">
                <p className="font-semibold text-white mb-3">Auditoria da Transferência</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <p>Nota (código): {auditoriaTransferencia.codigoNota}</p>
                  <p>Origem (código): {auditoriaTransferencia.codigoEnderecoOrigem}</p>
                  <p className="sm:col-span-2">Origem (descrição): {auditoriaTransferencia.descricaoEnderecoOrigem}</p>
                  <p>Destino (código): {auditoriaTransferencia.codigoEnderecoDestino}</p>
                  <p className="sm:col-span-2">Destino (descrição): {auditoriaTransferencia.descricaoEnderecoDestino}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {erro && (
          <div className="flex items-center space-x-2 text-red-200">
            <AlertCircle className="w-5 h-5" />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="flex items-center space-x-2 text-green-200">
            <CheckCircle className="w-5 h-5" />
            <span>{sucesso}</span>
          </div>
        )}
      </div>
    </div>
  );
}
