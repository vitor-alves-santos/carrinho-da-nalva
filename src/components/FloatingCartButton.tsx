"use client";

import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingCartButton() {
  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const total = useCartStore((state) => state.getTotal());

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50"
      >
        <Link href="/pedido">
          <Button className="w-full bg-[#2d9da1] hover:bg-[#258487] text-white py-6 rounded-xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-2 -right-2 bg-white text-[#2d9da1] rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              </div>
              <span className="font-medium">Pedir no Zap</span>
            </div>
            <span className="font-bold">{formatPrice(total)}</span>
          </Button>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
