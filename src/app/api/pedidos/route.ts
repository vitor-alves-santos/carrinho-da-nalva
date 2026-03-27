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

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    const pedidos = await db
      .collection("pedidos")
      .find({})
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
