import { supabase } from '@/shared/supabase';

export type NotaRow = {
  codigo: number;
  codigo_endereco: number;
  auth_id: string | null;
  nunota: string | null;
  chavenfe: string | null;
};

export type NotaDetalhada = NotaRow & {
  empresa: string;
  numero: string | null;
  serie: string | null;
  doca: string | null;
  registradoPor: string | null;
};

// Chave NF-e (44 dígitos): CNPJ do emitente nas posições 7-20, série 23-25, número 26-34.
// Registros antigos guardam a chave em nunota em vez de chavenfe.
const chaveDaNota = (nota: NotaRow) =>
  [nota.chavenfe, nota.nunota].find((valor) => !!valor && /^\d{44}$/.test(valor)) ?? null;

const lerChave = (chave: string | null) => {
  if (!chave) return null;
  return {
    cnpj: chave.substring(6, 20),
    serie: chave.substring(22, 25),
    numero: String(Number(chave.substring(25, 34))),
  };
};

const formatarCnpj = (cnpj: string) =>
  cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

// Mesma nota (mesma chave) pode estar em várias docas.
export const identificadorNota = (nota: NotaRow) =>
  chaveDaNota(nota) || nota.chavenfe || nota.nunota || String(nota.codigo);

export const semDuplicados = <T extends NotaRow>(notas: T[]) =>
  notas.filter((nota, index) => notas.findIndex((n) => n.codigo === nota.codigo) === index);

const COLUNAS_NOTA = 'codigo, codigo_endereco, auth_id, nunota, chavenfe';

const consultarNotas = async (filtro: string) => {
  const { data, error } = await supabase.from('nota').select(COLUNAS_NOTA).or(filtro).limit(100);
  if (error) throw error;
  return semDuplicados((data ?? []) as NotaRow[]);
};

export async function buscarNotasPorTermo(termoInformado: string): Promise<NotaRow[]> {
  const termo = termoInformado.trim();

  // Número da NF (até 9 dígitos): compara só o campo número da chave (posições 26-34),
  // para não trazer outras notas que tenham esses dígitos em outra parte da chave.
  if (/^\d{1,9}$/.test(termo)) {
    const padrao = `${'_'.repeat(25)}${termo.padStart(9, '0')}%`;
    return consultarNotas(
      `chavenfe.like.${padrao},nunota.like.${padrao},chavenfe.eq.${termo},nunota.eq.${termo}`
    );
  }

  // Chave bipada: busca exata; parcial só se não achar (cobre diferenças de formatação).
  const exatos = await consultarNotas(`chavenfe.eq.${termo},nunota.eq.${termo}`);
  if (exatos.length > 0) return exatos;
  return consultarNotas(`chavenfe.like.%${termo}%,nunota.like.%${termo}%`);
}

export async function detalharNotas(notas: NotaRow[]): Promise<NotaDetalhada[]> {
  const codigosEndereco = [...new Set(notas.map((n) => n.codigo_endereco))];
  const authIds = [...new Set(notas.map((n) => n.auth_id).filter((id): id is string => !!id))];

  const [empresas, enderecos, usuarios] = await Promise.all([
    supabase.from('empresa').select('cnpj, nome'),
    supabase.from('endereco').select('codigo, descricao').in('codigo', codigosEndereco),
    supabase.from('usuario').select('auth_id, login').in('auth_id', authIds),
  ]);
  if (empresas.error) throw empresas.error;
  if (enderecos.error) throw enderecos.error;
  if (usuarios.error) throw usuarios.error;

  const nomeEmpresa = new Map((empresas.data ?? []).map((e) => [e.cnpj as string, e.nome as string]));
  const descricaoDoca = new Map((enderecos.data ?? []).map((e) => [e.codigo as number, e.descricao as string | null]));
  const loginUsuario = new Map((usuarios.data ?? []).map((u) => [u.auth_id as string, u.login as string]));

  return notas.map((nota) => {
    const dados = lerChave(chaveDaNota(nota));
    return {
      ...nota,
      empresa: dados ? nomeEmpresa.get(dados.cnpj) ?? formatarCnpj(dados.cnpj) : 'Empresa não identificada',
      numero: dados?.numero ?? nota.nunota ?? nota.chavenfe,
      serie: dados?.serie ?? null,
      doca: descricaoDoca.get(nota.codigo_endereco) ?? null,
      registradoPor: nota.auth_id ? loginUsuario.get(nota.auth_id) ?? null : null,
    };
  });
}
