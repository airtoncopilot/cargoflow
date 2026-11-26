import { Building2, MapPin } from 'lucide-react';
import type { NotaDetalhada } from '@/shared/notas';

type Props = {
  notas: NotaDetalhada[];
  titulo: string;
  textoBotao?: string;
  onEscolher?: (nota: NotaDetalhada) => void;
  selecionadas?: number[];
};

export default function ListaNotas({ notas, titulo, textoBotao, onEscolher, selecionadas }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-yellow-200 text-sm">{titulo}</p>
      {notas.map((nota) => {
        const marcada = selecionadas?.includes(nota.codigo) ?? false;
        return (
        <div
          key={nota.codigo}
          className={`bg-slate-900/40 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
            marcada ? 'border-green-400' : 'border-white/20'
          }`}
        >
          <div className="flex-1 space-y-1 text-sm text-blue-100">
            <p className="flex items-center gap-2 font-semibold text-white">
              <Building2 className="w-4 h-4" />
              {nota.empresa}
            </p>
            <p>
              NF {nota.numero ?? '-'}
              {nota.serie ? ` · Série ${Number(nota.serie)}` : ''}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Doca: {nota.doca || 'Não informada'}
            </p>
            {nota.registradoPor && <p>Registrado por: {nota.registradoPor}</p>}
          </div>
          {onEscolher && (
            <button
              type="button"
              onClick={() => onEscolher(nota)}
              className={`w-full sm:w-auto px-4 py-3 sm:py-2 rounded-xl border text-white transition-all ${
                marcada ? 'bg-green-500/30 border-green-400' : 'bg-white/10 border-white/20 hover:bg-white/20'
              }`}
            >
              {marcada ? 'Marcada ✓' : textoBotao ?? 'Escolher'}
            </button>
          )}
        </div>
        );
      })}
    </div>
  );
}
