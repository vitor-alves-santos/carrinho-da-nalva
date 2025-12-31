import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const produtos = await db
      .collection("produtos")
      .find({})
      .sort({ categoriaPrincipal: 1, subcategoria: 1, ordem: 1 })
      .toArray();

    const formattedProdutos = produtos.map((p) => ({
      ...p,
      _id: p._id.toString(),
    }));

    return NextResponse.json(formattedProdutos);
  } catch (error) {
    console.error("Error fetching admin produtos:", error);
    return NextResponse.json(
      { error: "Failed to fetch produtos" },
      { status: 500 }
    );
  }
}
