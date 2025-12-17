"use client";

import { useState } from "react";
import { Produto } from "@/types/produto";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
    setQuantidade(1);
    setShowControls(false);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

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

      <div className="flex items-center gap-1">
        <span
          className={cn(
            produto.categoriaPrincipal === "RECADOS"
              ? "hidden"
              : "text-[#2d9da1] text-[14px] font-semibold whitespace-nowrap"
          )}
        >
          {formatPrice(produto.preco)}
        </span>

        {showControls ? (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6 rounded-full"
              onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className=" text-center font-medium">{quantidade}</span>
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6 rounded-full"
              onClick={() => setQuantidade(quantidade + 1)}
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
            className={cn(
              produto.categoriaPrincipal === "RECADOS"
                ? "hidden"
                : "h-8 w-8 rounded-full bg-[#2d9da1] hover:bg-[#258487]"
            )}
            onClick={() => setShowControls(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
