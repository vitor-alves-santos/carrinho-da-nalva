import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await connectToDatabase();
    const produto = await db
      .collection("produtos")
      .findOne({ _id: new ObjectId(id) });

    if (!produto) {
      return NextResponse.json(
        { error: "Produto not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...produto,
      _id: produto._id.toString(),
    });
  } catch (error) {
    console.error("Error fetching produto:", error);
    return NextResponse.json(
      { error: "Failed to fetch produto" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { db } = await connectToDatabase();

    const updateData = {
      categoriaPrincipal: body.categoriaPrincipal,
      subcategoria: body.subcategoria,
      nome: body.nome,
      preco: Number(body.preco),
      descricao: body.descricao || "",
      ativo: body.ativo ?? true,
      ordem: body.ordem ?? 0,
    };

    await db
      .collection("produtos")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    return NextResponse.json({
      _id: id,
      ...updateData,
    });
  } catch (error) {
    console.error("Error updating produto:", error);
    return NextResponse.json(
      { error: "Failed to update produto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { db } = await connectToDatabase();

    await db.collection("produtos").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting produto:", error);
    return NextResponse.json(
      { error: "Failed to delete produto" },
      { status: 500 }
    );
  }
}
