"use client";

import { useState } from "react";
import { Produto } from "@/types/produto";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";

interface ProductCardProps {
  produto: Produto;
}

export default function ProductCard({ produto }: ProductCardProps) {
  const [quantidade, setQuantidade] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    for (let i = 0; i < quantidade; i++) {
      addItem(produto);
    }

    // Track product added to cart event
    posthog.capture("product_added_to_cart", {
      product_id: produto._id,
      product_name: produto.nome,
      product_category: produto.categoriaPrincipal,
      product_subcategory: produto.subcategoria,
      product_price: produto.preco,
      quantity: quantidade,
      total_value: produto.preco * quantidade,
    });

    setQuantidade(1);
    setShowControls(false);
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return "";
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const isRecado = produto.categoriaPrincipal.toUpperCase().includes("RECADO");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-1 border-b border-gray-100 last:border-b-0"
    >
      <div className="flex-1">
        <h3 className="font-medium text-[smaller] text-gray-800">
          {produto.nome}
        </h3>
        {produto.descricao && (
          <p className="text-xs text-gray-500 mt-0.5">{produto.descricao}</p>
        )}
      </div>

      {!isRecado && (
        <div className="flex items-center gap-1">
          <span className="text-[#2d9da1] text-[14px] font-semibold whitespace-nowrap">
            {formatPrice(produto.preco)}
          </span>

          {showControls ? (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6 rounded-full"
                onClick={() => {
                  const newQuantidade = Math.max(1, quantidade - 1);
                  posthog.capture("product_quantity_decreased", {
                    product_id: produto._id,
                    product_name: produto.nome,
                    old_quantity: quantidade,
                    new_quantity: newQuantidade,
                  });
                  setQuantidade(newQuantidade);
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className=" text-center font-medium">{quantidade}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6 rounded-full"
                onClick={() => {
                  const newQuantidade = quantidade + 1;
                  posthog.capture("product_quantity_increased", {
                    product_id: produto._id,
                    product_name: produto.nome,
                    old_quantity: quantidade,
                    new_quantity: newQuantidade,
                  });
                  setQuantidade(newQuantidade);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                className="bg-[#2d9da1] hover:bg-[#258487] text-white rounded-full px-2 h-7 text-[10px]"
                onClick={handleAdd}
              >
                Adicionar
              </Button>
            </div>
          ) : (
            <Button
              size="icon"
              className="h-8 w-8 rounded-full bg-[#2d9da1] hover:bg-[#258487]"
              onClick={() => setShowControls(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
