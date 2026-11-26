import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { supabase } from "@/shared/supabase";
import { buscarNotasPorTermo, detalharNotas, identificadorNota, type NotaDetalhada, type NotaRow } from "@/shared/notas";
import ListaNotas from "@/react-app/components/ListaNotas";

type TermoAmbiguo = {
  termo: string;
  opcoes: NotaDetalhada[];
  codigosPorNota: Record<string, number[]>;
};

type Pendencia = {
  codigosDiretos: number[];
  ambiguos: TermoAmbiguo[];
  totalTermos: number;
};

export default function DeletarNota() {
  const navigate = useNavigate();
  const [nunotas, setNunotas] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [pendencia, setPendencia] = useState<Pendencia | null>(null);
  const [escolhas, setEscolhas] = useState<Record<string, NotaDetalhada[]>>({});

  const alternarEscolha = (termo: string, nota: NotaDetalhada) =>
    setEscolhas((prev) => {
      const atuais = prev[termo] ?? [];
      const jaEscolhida = atuais.some((n) => n.codigo === nota.codigo);
      return { ...prev, [termo]: jaEscolhida ? atuais.filter((n) => n.codigo !== nota.codigo) : [...atuais, nota] };
    });

  // Uma opção por nota (chave); a mesma nota em várias docas aparece uma vez, com todas as docas.
  const montarOpcoes = async (termo: string, encontrados: NotaRow[]): Promise<TermoAmbiguo> => {
    const detalhadas = await detalharNotas(encontrados);
    const codigosPorNota: Record<string, number[]> = {};
    const opcoes: NotaDetalhada[] = [];
    for (const nota of detalhadas) {
      const id = identificadorNota(nota);
      if (!codigosPorNota[id]) {
        codigosPorNota[id] = [];
        opcoes.push({ ...nota });
      } else {
        const opcao = opcoes.find((o) => identificadorNota(o) === id)!;
        if (nota.doca && !opcao.doca?.split(", ").includes(nota.doca)) {
          opcao.doca = opcao.doca ? `${opcao.doca}, ${nota.doca}` : nota.doca;
        }
      }
      codigosPorNota[id].push(nota.codigo);
    }
    return { termo, opcoes, codigosPorNota };
  };

  const expedir = async (codigos: number[], totalTermos: number) => {
    const { data: removidos, error: errorDelete } = await supabase
      .from("nota")
      .delete()
      .in("codigo", [...new Set(codigos)])
      .select("codigo");

    if (errorDelete) throw errorDelete;

    if (!removidos || removidos.length === 0) {
      setErro(
        "Registros localizados, mas não foi possível remover. Verifique permissões de DELETE (RLS) no Supabase."
      );
      return;
    }

    setMensagem(`${removidos.length} registro(s) removido(s) com sucesso para ${totalTermos} nota(s) informada(s).`);
    setNunotas([""]);
    setPendencia(null);
    setEscolhas({});
  };

  const handleConfirmarEscolhas = async () => {
    if (!pendencia) return;
    try {
      setLoading(true);
      setErro("");
      const codigosEscolhidos = pendencia.ambiguos.flatMap((item) =>
        (escolhas[item.termo] ?? []).flatMap((nota) => item.codigosPorNota[identificadorNota(nota)])
      );
      await expedir([...pendencia.codigosDiretos, ...codigosEscolhidos], pendencia.totalTermos);
    } catch (deleteError) {
      setErro((deleteError as { message?: string }).message || "Erro ao remover registro.");
    } finally {
      setLoading(false);
    }
  };

  const handleNunotaChange = (index: number, value: string) => {
    setPendencia(null);
    setEscolhas({});
    setNunotas((prev) => {
      const next = [...prev];
      next[index] = value;

      const preenchido = value.trim().length > 0;
      const isUltimoCampo = index === next.length - 1;
      if (preenchido && isUltimoCampo && next.length < 5) {
        next.push("");
      }

      return next;
    });
  };

  const handleRemoverNunota = (index: number) => {
    setPendencia(null);
    setEscolhas({});
    setNunotas((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length === 0) return [""];
      return next;
    });
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    const termos = nunotas.map((item) => item.trim()).filter(Boolean);
    if (termos.length === 0) {
      setErro("Informe ao menos um nunota/chavenfe para remover.");
      setMensagem("");
      return;
    }

    try {
      setLoading(true);
      setErro("");
      setMensagem("");

      setPendencia(null);
      setEscolhas({});

      const codigosDiretos: number[] = [];
      const ambiguos: TermoAmbiguo[] = [];
      for (const termo of termos) {
        const encontradosTermo = await buscarNotasPorTermo(termo);
        const notasDistintas = new Set(encontradosTermo.map(identificadorNota));
        if (notasDistintas.size > 1) {
          // Notas diferentes (ex.: mesmo número em empresas diferentes): não apaga sem o operador escolher.
          ambiguos.push(await montarOpcoes(termo, encontradosTermo));
        } else {
          codigosDiretos.push(...encontradosTermo.map((item) => item.codigo));
        }
      }

      if (codigosDiretos.length === 0 && ambiguos.length === 0) {
        setErro("Nenhum registro encontrado para as notas informadas.");
        return;
      }

      if (ambiguos.length > 0) {
        setPendencia({ codigosDiretos, ambiguos, totalTermos: termos.length });
        return;
      }

      await expedir(codigosDiretos, termos.length);
    } catch (deleteError) {
      const message =
        (deleteError as { message?: string }).message || "Erro ao remover registro.";
      setErro(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50"></div>

      <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="px-6 py-4 flex items-center space-x-4">
          <button
            onClick={() => navigate("/menu")}
            className="p-2 text-blue-200 hover:text-white hover:bg-white/20 rounded-xl transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Expedir nota</h1>
              <p className="text-sm text-blue-200">Expedir por nunota</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative p-6">
        <div className="max-w-md mx-auto">
          {mensagem && (
            <div className="mb-6 bg-green-500/20 border border-green-500/50 rounded-2xl p-4 flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <p className="text-green-300 font-semibold">{mensagem}</p>
            </div>
          )}

          {erro && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-2xl p-4 flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-300" />
              <p className="text-red-200">{erro}</p>
            </div>
          )}

          <form onSubmit={handleDelete} className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <Send className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Informar notas para expedir (max. 5)</h3>
              </div>

              {nunotas.map((nunota, index) => (
                <div key={`nunota-${index}`} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Digite o nunota/chavenfe ${index + 1}`}
                    value={nunota}
                    onChange={(e) => handleNunotaChange(index, e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm transition-all"
                    required={index === 0}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoverNunota(index)}
                    disabled={nunotas.length === 1}
                    className="inline-flex items-center justify-center p-3 rounded-xl border border-red-400/50 text-red-300 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Remover esta nota"
                    aria-label={`Remover nota ${index + 1}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || nunotas.every((item) => !item.trim())}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-5 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Send className="w-6 h-6" />
              <span>{loading ? "Expedindo..." : "Confirmar Expedição"}</span>
            </button>
          </form>

          {pendencia && (
            <div className="mt-6 bg-white/10 backdrop-blur-xl border border-yellow-400/50 rounded-2xl p-6 space-y-6">
              <p className="text-yellow-200 font-semibold">
                Nada foi expedido ainda. Marque uma ou mais notas para expedir em cada número abaixo:
              </p>
              {pendencia.ambiguos.map((item) => (
                <ListaNotas
                  key={item.termo}
                  notas={item.opcoes}
                  titulo={`"${item.termo}" corresponde a ${item.opcoes.length} notas diferentes:`}
                  textoBotao="Expedir esta"
                  selecionadas={(escolhas[item.termo] ?? []).map((nota) => nota.codigo)}
                  onEscolher={(nota) => alternarEscolha(item.termo, nota)}
                />
              ))}
              <button
                type="button"
                onClick={handleConfirmarEscolhas}
                disabled={loading || pendencia.ambiguos.some((item) => !escolhas[item.termo]?.length)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                <span>{loading ? "Expedindo..." : "Confirmar notas escolhidas"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
