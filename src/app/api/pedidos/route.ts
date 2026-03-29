import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pedido } from "@/types/pedido";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mesa, itens, total } = body;

    if (!mesa || !itens || itens.length === 0) {
      return NextResponse.json(
        { error: "Mesa e itens são obrigatórios" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    const novoPedido: Omit<Pedido, "_id"> = {
      mesa,
      itens,
      total,
      status: "Pendente",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("pedidos").insertOne(novoPedido);

    return NextResponse.json({ 
      message: "Pedido criado com sucesso", 
      id: result.insertedId 
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar pedido" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const history = searchParams.get("history") === "true";
    
    const { db } = await connectToDatabase();
    
    let query = {};
    
    // Filtro para "hoje" considerando o fuso horário de Brasília (UTC-3)
    // Se o servidor estiver em UTC, o "hoje" de Brasília começa às 03:00 UTC
    // Mas para simplificar, usaremos o início do dia do servidor.
    // Se o usuário desejar precisão absoluta de fuso, precisaríamos de date-fns-tz.
    if (!history) {
      const now = new Date();
      // Força o cálculo do início do dia no fuso de Brasília (UTC-3)
      const formatter = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Sao_Paulo', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      const parts = formatter.formatToParts(now);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;

      // 00:00:00 em Brasília é 03:00:00 em UTC
      const startOfToday = new Date(`${year}-${month}-${day}T03:00:00Z`);
      query = { createdAt: { $gte: startOfToday } };
    } else {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Sao_Paulo', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      const parts = formatter.formatToParts(now);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;

      const startOfToday = new Date(`${year}-${month}-${day}T03:00:00Z`);
      query = { createdAt: { $lt: startOfToday } };
    }

    const pedidos = await db
      .collection("pedidos")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(pedidos);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar pedidos" },
      { status: 500 }
    );
  }
}
