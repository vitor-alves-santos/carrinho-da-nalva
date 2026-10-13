import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import {
  TIMEZONE,
  currentMonth,
  monthIndex,
  startOfMonth,
  startOfToday,
} from "@/lib/date-br";

/**
 * Meses mais recentes que nunca podem ser apagados.
 * Camada de negócio da janela de proteção; a UI aplica a mesma regra no seletor.
 */
const MESES_PROTEGIDOS = 3;

const MES_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

type ResultadoValidacao =
  | { ok: true; cutoff: Date }
  | { ok: false; error: string; status: number };

/**
 * Valida o parâmetro `before` (formato "YYYY-MM") e devolve o instante a partir
 * do qual tudo é apagado (exclusive).
 *
 * Barreiras: formato válido → mês anterior ao atual → fora da janela protegida.
 * Além disso, o cutoff é travado em `startOfToday()` para nunca apagar o dia
 * corrente, mesmo que a validação venha a mudar.
 */
function validarLimite(before: string | null): ResultadoValidacao {
  if (!before || !MES_REGEX.test(before)) {
    return {
      ok: false,
      error: "Parâmetro 'before' inválido. Use o formato YYYY-MM.",
      status: 400,
    };
  }

  const atual = currentMonth();

  if (monthIndex(before) >= monthIndex(atual)) {
    return {
      ok: false,
      error: "O limite precisa ser um mês anterior ao atual.",
      status: 400,
    };
  }

  if (monthIndex(before) > monthIndex(atual) - MESES_PROTEGIDOS) {
    return {
      ok: false,
      error: `Os ${MESES_PROTEGIDOS} meses mais recentes são preservados. Escolha um limite mais antigo.`,
      status: 400,
    };
  }

  const [ano, mes] = before.split("-");
  const cutoff = startOfMonth(ano, mes);
  const hoje = startOfToday();

  return { ok: true, cutoff: cutoff < hoje ? cutoff : hoje };
}

/**
 * Contagem do que seria apagado até `before`, agregada por mês (decrescente).
 * A agregação usa o mesmo fuso do backend, então os agrupamentos batem com o
 * que realmente será removido.
 */
async function contarAte(cutoff: Date) {
  const { db } = await connectToDatabase();

  const linhas = await db
    .collection("pedidos")
    .aggregate([
      { $match: { createdAt: { $lt: cutoff } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAt",
              timezone: TIMEZONE,
            },
          },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, month: "$_id", count: 1 } },
      { $sort: { month: -1 } },
    ])
    .toArray();

  const months = linhas.map((linha) => ({
    month: String(linha.month),
    count: Number(linha.count),
  }));

  return { months, total: months.reduce((soma, item) => soma + item.count, 0) };
}

/**
 * GET /api/pedidos/historico?before=YYYY-MM[&count=true]
 *
 * Devolve a prévia da exclusão: quantos pedidos e quais meses seriam removidos.
 * `count=true` é aceito por compatibilidade com o contrato especificado; a rota
 * é exclusivamente de contagem.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validado = validarLimite(searchParams.get("before"));
    if (!validado.ok) {
      return NextResponse.json(
        { error: validado.error },
        { status: validado.status },
      );
    }

    const { total, months } = await contarAte(validado.cutoff);

    return NextResponse.json({ total, months });
  } catch (error) {
    console.error("Erro ao contar histórico:", error);
    return NextResponse.json(
      { error: "Erro interno ao contar o histórico" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/pedidos/historico?before=YYYY-MM
 *
 * Apaga em definitivo todos os pedidos anteriores ao mês limite informado.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validado = validarLimite(searchParams.get("before"));
    if (!validado.ok) {
      return NextResponse.json(
        { error: validado.error },
        { status: validado.status },
      );
    }

    const { db } = await connectToDatabase();
    const result = await db
      .collection("pedidos")
      .deleteMany({ createdAt: { $lt: validado.cutoff } });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Erro ao excluir histórico:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir o histórico" },
      { status: 500 },
    );
  }
}
