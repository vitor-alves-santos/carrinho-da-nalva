"use client";

import { useEffect, useState } from "react";
import { Produto } from "@/types/produto";
import ProductCard from "./ProductCard";
import { Separator } from "@/components/ui/separator";

interface ProductListProps {
  produtos: Produto[];
  activeCategory: string;
}

export default function ProductList({
  produtos,
  activeCategory,
}: ProductListProps) {
  const [avisos, setAvisos] = useState<string[]>([]);
  const [kitRules, setKitRules] = useState<string[]>([]);

  useEffect(() => {
    const fetchConfiguracoes = async () => {
      try {
        const res = await fetch("/api/configuracoes");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const cfg = await res.json();
        setAvisos(Array.isArray(cfg.avisos) ? cfg.avisos : []);
        setKitRules(Array.isArray(cfg.kitRules) ? cfg.kitRules : []);
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      }
    };
    fetchConfiguracoes();
  }, []);

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

  const showAvisos = activeCategory.toUpperCase().includes("RECADOS");

  return (
    <div className="px-4 pb-24">
      <h2 className="text-center text-lg font-semibold text-gray-400 tracking-wider my-4">
        {activeCategory}
      </h2>

      {showAvisos && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-700">Avisos</h3>
            <span className="text-xs text-gray-400">{avisos.length} ITENS</span>
          </div>
          <Separator className="mb-2" />
          <ul className="space-y-1">
            {avisos.map((aviso) => (
              <li key={aviso} className="flex gap-2 text-sm text-gray-800">
                <span className="font-bold">•</span>
                <span>{aviso}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-blue-500 mt-2">
            Curtam a praia, bebam muita água e não esqueçam o protetor solar
          </p>
          <div className="border border-black rounded-2xl p-2 mt-4">
            <h3 className="text-gray-800 border-b border-black">KIT TIA NALVA</h3>
            <p className="text-sm mt-1">
              {kitRules.map((regra) => (
                <span key={regra}>
                  • {regra} <br />
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {Object.entries(groupedBySubcategoria)
        .filter(([subcategoria]) => isAvisosLegado(subcategoria, showAvisos))
        .map(([subcategoria, items]) => (
          <div key={subcategoria} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-gray-700">
                {subcategoria}
              </h3>
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

/** Evita duplicar: quando a seção de avisos é renderizada pela config,
 *  ignora produtos legados da subcategoria "Avisos". */
function isAvisosLegado(subcategoria: string, showAvisos: boolean) {
  return !(showAvisos && subcategoria === "Avisos");
}
