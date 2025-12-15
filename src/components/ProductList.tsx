"use client";

import { Produto } from "@/types/produto";
import ProductCard from "./ProductCard";
import { Separator } from "@/components/ui/separator";

interface ProductListProps {
  produtos: Produto[];
  activeCategory: string;
}

export default function ProductList({ produtos, activeCategory }: ProductListProps) {
  const filteredProdutos = produtos.filter(
    (p) => p.categoriaPrincipal === activeCategory
  );

  const groupedBySubcategoria = filteredProdutos.reduce((acc, produto) => {
    if (!acc[produto.subcategoria]) {
      acc[produto.subcategoria] = [];
    }
    acc[produto.subcategoria].push(produto);
    return acc;
  }, {} as Record<string, Produto[]>);

  return (
    <div className="px-4 pb-24">
      <h2 className="text-center text-lg font-semibold text-gray-400 tracking-wider my-4">
        {activeCategory}
      </h2>
      
      {Object.entries(groupedBySubcategoria).map(([subcategoria, items]) => (
        <div key={subcategoria} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-700">{subcategoria}</h3>
            <span className="text-xs text-gray-400">{items.length} ITENS</span>
          </div>
          <Separator className="mb-2" />
          <div>
            {items.map((produto) => (
              <ProductCard key={produto._id} produto={produto} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
