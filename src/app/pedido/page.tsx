"use client";

import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import posthog from "posthog-js";

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999";

export default function PedidoPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return "";
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleWhatsAppOrder = () => {
    const orderLines = items.map(
      (item) =>
        `• ${item.quantidade}x ${item.nome} - ${formatPrice(
          item.preco * item.quantidade
        )}`
    );

    const message = `🏖️ *Pedido - Carrinho da Nalva*\n\n${orderLines.join(
      "\n"
    )}\n\n💰 *Total: ${formatPrice(getTotal())}*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    // Track order submission - key conversion event
    posthog.capture("order_submitted_whatsapp", {
      total_items: items.reduce((acc, item) => acc + item.quantidade, 0),
      total_value: getTotal(),
      item_count: items.length,
      items: items.map((item) => ({
        product_id: item._id,
        product_name: item.nome,
        quantity: item.quantidade,
        price: item.preco,
        category: item.categoriaPrincipal,
      })),
    });

    window.open(whatsappUrl, "_blank");
    clearCart();
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    const item = items.find((i) => i._id === itemId);
    if (item) {
      // Track quantity update event
      posthog.capture("cart_item_quantity_updated", {
        product_id: item._id,
        product_name: item.nome,
        old_quantity: item.quantidade,
        new_quantity: newQuantity,
        price: item.preco,
      });
    }
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    const item = items.find((i) => i._id === itemId);
    if (item) {
      // Track item removal event
      posthog.capture("cart_item_removed", {
        product_id: item._id,
        product_name: item.nome,
        quantity: item.quantidade,
        price: item.preco,
        category: item.categoriaPrincipal,
      });
    }
    removeItem(itemId);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-xl font-semibold text-gray-700 mb-2">
            Seu pedido está vazio
          </h1>
          <p className="text-gray-500 mb-6">
            Adicione itens do cardápio para fazer seu pedido
          </p>
          <Link href="/">
            <Button className="bg-[#2d9da1] hover:bg-[#258487]">
              Ver Cardápio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center p-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold ml-2">Seu Pedido</h1>
        </div>
      </header>

      <div className="p-4 pb-32">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {items.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.nome}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatPrice(item.preco)} cada
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#2d9da1]">
                      {formatPrice(item.preco * item.quantidade)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      onClick={() =>
                        handleUpdateQuantity(item._id!, item.quantidade - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantidade}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      onClick={() =>
                        handleUpdateQuantity(item._id!, item.quantidade + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleRemoveItem(item._id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {index < items.length - 1 && <Separator />}
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm mt-4 p-4">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-[#2d9da1]">{formatPrice(getTotal())}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <Button
          className="w-full bg-green-500 hover:bg-green-600 text-white py-6 rounded-xl text-lg font-semibold flex items-center justify-center gap-2"
          onClick={handleWhatsAppOrder}
        >
          <MessageCircle className="h-5 w-5" />
          Pedir no WhatsApp
        </Button>
      </div>
    </div>
  );
}
