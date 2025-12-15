import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

const seedData = [
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Cervejas", nome: "Brahma (lata)", preco: 8.00, descricao: "", ativo: true, ordem: 1 },
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Cervejas", nome: "Skol (lata)", preco: 8.00, descricao: "", ativo: true, ordem: 2 },
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Cervejas", nome: "Brahma puro malte (lata)", preco: 10.00, descricao: "", ativo: true, ordem: 3 },
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Cervejas", nome: "Amstel (lata)", preco: 10.00, descricao: "", ativo: true, ordem: 4 },
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Cervejas", nome: "Corona (lata)", preco: 12.00, descricao: "", ativo: true, ordem: 5 },
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Cervejas", nome: "Spaten (lata)", preco: 12.00, descricao: "", ativo: true, ordem: 6 },
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Refrigerantes", nome: "Coca-Cola (lata)", preco: 7.00, descricao: "", ativo: true, ordem: 1 },
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Refrigerantes", nome: "Guaraná Antarctica (lata)", preco: 7.00, descricao: "", ativo: true, ordem: 2 },
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Refrigerantes", nome: "Sprite (lata)", preco: 7.00, descricao: "", ativo: true, ordem: 3 },
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Sucos", nome: "Suco de Laranja Natural", preco: 12.00, descricao: "Suco feito na hora", ativo: true, ordem: 1 },
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Sucos", nome: "Suco de Abacaxi com Hortelã", preco: 14.00, descricao: "Refrescante", ativo: true, ordem: 2 },
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Água", nome: "Água Mineral (500ml)", preco: 5.00, descricao: "", ativo: true, ordem: 1 },
  { categoriaPrincipal: "BEBIDAS", subcategoria: "Água", nome: "Água de Coco", preco: 8.00, descricao: "", ativo: true, ordem: 2 },
  { categoriaPrincipal: "PORÇÕES", subcategoria: "Frutos do Mar", nome: "Camarão ao Alho e Óleo", preco: 65.00, descricao: "Porção de camarões fritos no alho", ativo: true, ordem: 1 },
  { categoriaPrincipal: "PORÇÕES", subcategoria: "Frutos do Mar", nome: "Casquinha de Siri", preco: 25.00, descricao: "Deliciosa casquinha recheada", ativo: true, ordem: 2 },
  { categoriaPrincipal: "PORÇÕES", subcategoria: "Frutos do Mar", nome: "Isca de Peixe", preco: 45.00, descricao: "Iscas empanadas crocantes", ativo: true, ordem: 3 },
  { categoriaPrincipal: "PORÇÕES", subcategoria: "Petiscos", nome: "Batata Frita", preco: 25.00, descricao: "Porção generosa", ativo: true, ordem: 1 },
  { categoriaPrincipal: "PORÇÕES", subcategoria: "Petiscos", nome: "Mandioca Frita", preco: 22.00, descricao: "Crocante por fora, macia por dentro", ativo: true, ordem: 2 },
  { categoriaPrincipal: "PORÇÕES", subcategoria: "Petiscos", nome: "Calabresa Acebolada", preco: 35.00, descricao: "", ativo: true, ordem: 3 },
  { categoriaPrincipal: "COMBOS", subcategoria: "Combos", nome: "Combo Praia", preco: 89.00, descricao: "2 Cervejas + Porção de Batata + Isca de Peixe", ativo: true, ordem: 1 },
  { categoriaPrincipal: "COMBOS", subcategoria: "Combos", nome: "Combo Família", preco: 120.00, descricao: "4 Refrigerantes + 2 Porções à escolha", ativo: true, ordem: 2 },
  { categoriaPrincipal: "COMBOS", subcategoria: "Combos", nome: "Combo Casal", preco: 75.00, descricao: "2 Sucos + Porção de Camarão", ativo: true, ordem: 3 },
];

export async function POST() {
  try {
    const { db } = await connectToDatabase();
    
    const existingCount = await db.collection("produtos").countDocuments();
    if (existingCount > 0) {
      return NextResponse.json({ message: "Database already seeded", count: existingCount });
    }

    await db.collection("produtos").insertMany(seedData);
    
    return NextResponse.json({ message: "Database seeded successfully", count: seedData.length });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
