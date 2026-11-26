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
const lerChave = (chave: string | null) => {
  if (!chave || !/^\d{44}$/.test(chave)) return null;
  return {
    cnpj: chave.substring(6, 20),
    serie: chave.substring(22, 25),
    numero: String(Number(chave.substring(25, 34))),
  };
};

const formatarCnpj = (cnpj: string) =>
  cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

// Mesma nota (mesma chave) pode estar em várias docas.
export const identificadorNota = (nota: NotaRow) => nota.chavenfe || nota.nunota || String(nota.codigo);

export const semDuplicados = <T extends NotaRow>(notas: T[]) =>
  notas.filter((nota, index) => notas.findIndex((n) => n.codigo === nota.codigo) === index);

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
    const dados = lerChave(nota.chavenfe);
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
