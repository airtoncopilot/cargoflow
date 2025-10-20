import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { cors } from "hono/cors";
import { RegistrarDocaSchema, type RegistrarDocaResponseType } from "../shared/types";

type Endereco = {
  id: number;
  codigo: number;
  codigo_usuario: number;
  descricao: string;
  created_at: string;
  updated_at: string;
};

type Nota = {
  id: number;
  codigo: number;
  codigo_endereco: number;
  codigo_usuario: number;
  chavenfe?: string | null;
  nunota?: number | null;
  qtdvol?: number | null;
  nomecliente?: string | null;
  cidade?: string | null;
  uf?: string | null;
  vlrnota?: number | null;
  created_at: string;
  updated_at: string;
};

const enderecos: Endereco[] = [];
const notas: Nota[] = [];
let nextEnderecoId = 1;
let nextNotaId = 1;
let nextEnderecoCodigo = 1;
let nextNotaCodigo = 1;

const now = () => new Date().toISOString();

const app = new Hono();

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.post("/api/registrar-doca", zValidator("json", RegistrarDocaSchema), async (c) => {
  try {
    const { codigoDoca, numeroNota, codigoUsuario } = c.req.valid("json");

    let endereco = enderecos.find(
      (e) => e.descricao === codigoDoca && e.codigo_usuario === codigoUsuario
    );

    if (!endereco) {
      endereco = {
        id: nextEnderecoId++,
        codigo: nextEnderecoCodigo++,
        codigo_usuario: codigoUsuario,
        descricao: codigoDoca,
        created_at: now(),
        updated_at: now(),
      };
      enderecos.push(endereco);
    }

    const codigoNotaUsado = Number.parseInt(String(numeroNota)) || nextNotaCodigo++;
    const nota: Nota = {
      id: nextNotaId++,
      codigo: codigoNotaUsado,
      codigo_endereco: endereco.codigo,
      codigo_usuario: codigoUsuario,
      nunota: Number.isNaN(Number(numeroNota)) ? null : Number(numeroNota),
      created_at: now(),
      updated_at: now(),
    } as Nota;
    notas.push(nota);

    return c.json({
      success: true,
      message: "Nota registrada na doca com sucesso!",
      endereco,
      nota,
    } as RegistrarDocaResponseType, 200);
  } catch (error) {
    console.error("Erro ao registrar nota na doca:", error);
    return c.json({ success: false, message: "Erro interno do servidor" } as RegistrarDocaResponseType, 500);
  }
});

app.get("/api/enderecos", async (c) => {
  try {
    const data = [...enderecos].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, message: "Erro ao buscar endereços" }, 500);
  }
});

app.get("/api/notas", async (c) => {
  try {
    const data = [...notas]
      .map((n) => ({
        ...n,
        doca_descricao: enderecos.find((e) => e.codigo === n.codigo_endereco)?.descricao ?? null,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, message: "Erro ao buscar notas" }, 500);
  }
});

export default app;
