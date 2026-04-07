import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/shared/supabase";

export default function DeletarNota() {
  const navigate = useNavigate();
  const [nunota, setNunota] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    const termo = nunota.trim();
    if (!termo) {
      setErro("Informe o nunota para remover.");
      setMensagem("");
      return;
    }

    try {
      setLoading(true);
      setErro("");
      setMensagem("");

      // 1) Busca exata por nunota/chavenfe
      const { data: encontradosExatos, error: errorBuscaExata } = await supabase
        .from("nota")
        .select("codigo, nunota, chavenfe")
        .or(`nunota.eq.${termo},chavenfe.eq.${termo}`)
        .limit(100);

      if (errorBuscaExata) throw errorBuscaExata;

      let encontrados = encontradosExatos ?? [];

      // 2) Fallback por LIKE (cobre diferenças de formatação)
      if (encontrados.length === 0) {
        const { data: encontradosParciais, error: errorBuscaParcial } = await supabase
          .from("nota")
          .select("codigo, nunota, chavenfe")
          .or(`nunota.like.%${termo}%,chavenfe.like.%${termo}%`)
          .limit(100);

        if (errorBuscaParcial) throw errorBuscaParcial;
        encontrados = encontradosParciais ?? [];
      }

      if (encontrados.length === 0) {
        setErro("Nenhum registro encontrado para o nunota informado.");
        return;
      }

      // 3) Remove pelos códigos encontrados para evitar falhas de filtro no DELETE
      const codigos = encontrados.map((item) => item.codigo);
      const { data: removidos, error: errorDelete } = await supabase
        .from("nota")
        .delete()
        .in("codigo", codigos)
        .select("codigo");

      if (errorDelete) throw errorDelete;

      if (!removidos || removidos.length === 0) {
        setErro(
          "Registros localizados, mas não foi possível remover. Verifique permissões de DELETE (RLS) no Supabase."
        );
        return;
      }

      setMensagem(`${removidos.length} registro(s) removido(s) com sucesso.`);
      setNunota("");
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
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Remover Registro</h1>
              <p className="text-sm text-blue-200">Excluir por nunota</p>
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
                <Trash2 className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Informar nunota</h3>
              </div>

              <input
                type="text"
                placeholder="Digite o nunota"
                value={nunota}
                onChange={(e) => setNunota(e.target.value)}
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !nunota.trim()}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-5 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Trash2 className="w-6 h-6" />
              <span>{loading ? "Removendo..." : "Confirmar Remoção"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
