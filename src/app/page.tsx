"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import CategoryTabs from "@/components/CategoryTabs";
import ProductList from "@/components/ProductList";
import FloatingCartButton from "@/components/FloatingCartButton";
import { Produto } from "@/types/produto";

export default function Home() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProdutos() {
      try {
        const response = await fetch("/api/produtos");
        const data = await response.json();
        setProdutos(data);

        const uniqueCategories = [
          ...new Set(data.map((p: Produto) => p.categoriaPrincipal)),
        ] as string[];

        const categoryOrder = ["RECADOS", "COMBOS", "BEBIDAS", "PORÇÕES"];
        
        const sortedCategories = uniqueCategories.sort((a, b) => {
          const indexA = categoryOrder.indexOf(a);
          const indexB = categoryOrder.indexOf(b);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

        setCategories(sortedCategories);
        if (sortedCategories.length > 0) {
          setActiveCategory(sortedCategories[0]);
        }
      } catch (error) {
        console.error("Error fetching produtos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProdutos();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d9da1] mx-auto"></div>
          <p className="mt-4 text-gray-500">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      {categories.length > 0 && (
        <>
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          <ProductList produtos={produtos} activeCategory={activeCategory} />
        </>
      )}
      <FloatingCartButton />
    </main>
  );
}
