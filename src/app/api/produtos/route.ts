import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const produtos = await db
      .collection("produtos")
      .find({ ativo: true })
      .sort({ ordem: 1 })
      .toArray();

    const formattedProdutos = produtos.map((p) => ({
      ...p,
      _id: p._id.toString(),
    }));

    return NextResponse.json(formattedProdutos);
  } catch (error) {
    console.error("Error fetching produtos:", error);
    return NextResponse.json(
      { error: "Failed to fetch produtos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { db } = await connectToDatabase();

    const result = await db.collection("produtos").insertOne({
      categoriaPrincipal: body.categoriaPrincipal,
      subcategoria: body.subcategoria,
      nome: body.nome,
      preco: Number(body.preco),
      descricao: body.descricao || "",
      ativo: body.ativo ?? true,
      ordem: body.ordem ?? 0,
    });

    return NextResponse.json({
      _id: result.insertedId.toString(),
      ...body,
    });
  } catch (error) {
    console.error("Error creating produto:", error);
    return NextResponse.json(
      { error: "Failed to create produto" },
      { status: 500 }
    );
  }
}
