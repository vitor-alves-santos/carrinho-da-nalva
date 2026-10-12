import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { ObjectId } from "mongodb";

const SETTINGS_ID = new ObjectId("000000000000000000000001");

export const DEFAULT_SETTINGS = {
  tema: "claro" as "claro" | "escuro",
  kitRules: [
    "Consumo mínimo: R$150,00",
    "3 cadeiras",
    "2 guarda-sol",
  ],
};

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const doc = await db.collection("configuracoes").findOne({ _id: SETTINGS_ID });

    if (!doc) {
      return NextResponse.json({
        _id: SETTINGS_ID,
        ...DEFAULT_SETTINGS,
      });
    }

    return NextResponse.json({
      _id: doc._id.toString(),
      tema: doc.tema ?? DEFAULT_SETTINGS.tema,
      kitRules: Array.isArray(doc.kitRules) ? doc.kitRules : DEFAULT_SETTINGS.kitRules,
    });
  } catch (error) {
    console.error("Error fetching configuracoes:", error);
    return NextResponse.json(
      { error: "Failed to fetch configuracoes" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { db } = await connectToDatabase();

    const tema = body.tema === "escuro" ? "escuro" : "claro";
    const kitRules = Array.isArray(body.kitRules)
      ? body.kitRules.filter((r: unknown) => typeof r === "string" && r.trim().length > 0)
      : DEFAULT_SETTINGS.kitRules;

    await db.collection("configuracoes").updateOne(
      { _id: SETTINGS_ID },
      { $set: { tema, kitRules } },
      { upsert: true }
    );

    return NextResponse.json({ _id: SETTINGS_ID.toString(), tema, kitRules });
  } catch (error) {
    console.error("Error updating configuracoes:", error);
    return NextResponse.json(
      { error: "Failed to update configuracoes" },
      { status: 500 }
    );
  }
}
