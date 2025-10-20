import z from "zod";

// Schema para registrar doca
export const RegistrarDocaSchema = z.object({
  codigoDoca: z.string().min(1, "Código da doca é obrigatório"),
  numeroNota: z.string().min(1, "Número da nota é obrigatório"),
  codigoUsuario: z.number().int().positive().optional().default(1), // Por enquanto usando usuário padrão
});

export type RegistrarDocaType = z.infer<typeof RegistrarDocaSchema>;

// Schema para endereço
export const EnderecoSchema = z.object({
  id: z.number(),
  codigo: z.number(),
  codigo_usuario: z.number(),
  descricao: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type EnderecoType = z.infer<typeof EnderecoSchema>;

// Schema para nota
export const NotaSchema = z.object({
  id: z.number(),
  codigo: z.number(),
  codigo_endereco: z.number(),
  codigo_usuario: z.number(),
  chavenfe: z.string().nullable(),
  nunota: z.number().nullable(),
  qtdvol: z.number().nullable(),
  nomecliente: z.string().nullable(),
  cidade: z.string().nullable(),
  uf: z.string().nullable(),
  vlrnota: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type NotaType = z.infer<typeof NotaSchema>;

// Schema de resposta
export const RegistrarDocaResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  endereco: EnderecoSchema.optional(),
  nota: NotaSchema.optional(),
});

export type RegistrarDocaResponseType = z.infer<typeof RegistrarDocaResponseSchema>;
