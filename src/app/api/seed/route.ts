import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

const seedData = [
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Cervejas",
    nome: "Brahma (lata)",
    preco: 8.0,
    descricao: "",
    ativo: true,
    ordem: 1,
  },
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Cervejas",
    nome: "Skol (lata)",
    preco: 8.0,
    descricao: "",
    ativo: true,
    ordem: 2,
  },
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Cervejas",
    nome: "Brahma puro malte (lata)",
    preco: 10.0,
    descricao: "",
    ativo: true,
    ordem: 3,
  },
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Cervejas",
    nome: "Amstel (lata)",
    preco: 10.0,
    descricao: "",
    ativo: true,
    ordem: 4,
  },
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Cervejas",
    nome: "Corona (lata)",
    preco: 12.0,
    descricao: "",
    ativo: true,
    ordem: 5,
  },
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Cervejas",
    nome: "Spaten (lata)",
    preco: 12.0,
    descricao: "",
    ativo: true,
    ordem: 6,
  },
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Refrigerantes",
    nome: "Coca-Cola (lata)",
    preco: 7.0,
    descricao: "",
    ativo: true,
    ordem: 1,
  },
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Refrigerantes",
    nome: "Guaraná Antarctica (lata)",
    preco: 7.0,
    descricao: "",
    ativo: true,
    ordem: 2,
  },
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Refrigerantes",
    nome: "Sprite (lata)",
    preco: 7.0,
    descricao: "",
    ativo: true,
    ordem: 3,
  },
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Sucos",
    nome: "Suco de Laranja Natural",
    preco: 12.0,
    descricao: "Suco feito na hora",
    ativo: true,
    ordem: 1,
  },
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Sucos",
    nome: "Suco de Abacaxi com Hortelã",
    preco: 14.0,
    descricao: "Refrescante",
    ativo: true,
    ordem: 2,
  },
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Água",
    nome: "Água Mineral (500ml)",
    preco: 5.0,
    descricao: "",
    ativo: true,
    ordem: 1,
  },
  {
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "Água",
    nome: "Água de Coco",
    preco: 8.0,
    descricao: "",
    ativo: true,
    ordem: 2,
  },

  // PORÇÕES
  {
    categoriaPrincipal: "PORÇÕES",
    subcategoria: "Frutos do Mar",
    nome: "Camarão ao Alho e Óleo",
    preco: 65.0,
    descricao: "Porção de camarões fritos no alho",
    ativo: true,
    ordem: 1,
  },
  {
    categoriaPrincipal: "PORÇÕES",
    subcategoria: "Frutos do Mar",
    nome: "Casquinha de Siri",
    preco: 25.0,
    descricao: "Deliciosa casquinha recheada",
    ativo: true,
    ordem: 2,
  },
  {
    categoriaPrincipal: "PORÇÕES",
    subcategoria: "Frutos do Mar",
    nome: "Isca de Peixe",
    preco: 45.0,
    descricao: "Iscas empanadas crocantes",
    ativo: true,
    ordem: 3,
  },
  {
    categoriaPrincipal: "PORÇÕES",
    subcategoria: "Petiscos",
    nome: "Batata Frita",
    preco: 25.0,
    descricao: "Porção generosa",
    ativo: true,
    ordem: 1,
  },
  {
    categoriaPrincipal: "PORÇÕES",
    subcategoria: "Petiscos",
    nome: "Mandioca Frita",
    preco: 22.0,
    descricao: "Crocante por fora, macia por dentro",
    ativo: true,
    ordem: 2,
  },
  {
    categoriaPrincipal: "PORÇÕES",
    subcategoria: "Petiscos",
    nome: "Calabresa Acebolada",
    preco: 35.0,
    descricao: "",
    ativo: true,
    ordem: 3,
  },

  // COMBOS
  {
    categoriaPrincipal: "COMBOS",
    subcategoria: "Combos",
    nome: "Combo Praia",
    preco: 89.0,
    descricao: "2 Cervejas + Porção de Batata + Isca de Peixe",
    ativo: true,
    ordem: 1,
  },
  {
    categoriaPrincipal: "COMBOS",
    subcategoria: "Combos",
    nome: "Combo Família",
    preco: 120.0,
    descricao: "4 Refrigerantes + 2 Porções à escolha",
    ativo: true,
    ordem: 2,
  },
  {
    categoriaPrincipal: "COMBOS",
    subcategoria: "Combos",
    nome: "Combo Casal",
    preco: 75.0,
    descricao: "2 Sucos + Porção de Camarão",
    ativo: true,
    ordem: 3,
  },

  // Recados
  {
    categoriaPrincipal: "RECADOS",
    subcategoria: "Avisos",
    nome: "Será cobrado a taxa de serviço 10%",
    ativo: true,
    ordem: 1,
  },
  {
    categoriaPrincipal: "RECADOS",
    subcategoria: "Avisos",
    nome: "Porções só serão servidas até as 16h",
    ativo: true,
    ordem: 2,
  },
  {
    categoriaPrincipal: "RECADOS",
    subcategoria: "Avisos",
    nome: "Não cobramos cadeiras, mas se quebrar será cobrado 180,00 cada",
    ativo: true,
    ordem: 3,
  },
  {
    categoriaPrincipal: "RECADOS",
    subcategoria: "Avisos",
    nome: "Sentar com cooler em nossas mesas será cobrado R$100,00",
    ativo: true,
    ordem: 4,
  },
  {
    categoriaPrincipal: "RECADOS",
    subcategoria: "Avisos",
    nome: "Não dividimos conta no caixa, agradecemos a compreensão",
    ativo: true,
    ordem: 5,
  },
  {
    categoriaPrincipal: "RECADOS",
    subcategoria: "Avisos",
    nome: "Consumo mínimo: R$50,00 por pessoa",
    ativo: true,
    ordem: 6,
  },
];

export async function POST() {
  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection("produtos");

    const deleteResult = await productsCollection.deleteMany({});
    console.log(`-> ${deleteResult.deletedCount} documentos excluídos.`);

    await productsCollection.insertMany(seedData);

    return NextResponse.json({
      message: "Database successfully reset and re-seeded.",
      deletedCount: deleteResult.deletedCount,
      insertedCount: seedData.length,
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to reset and re-seed database" },
      { status: 500 }
    );
  }
}
