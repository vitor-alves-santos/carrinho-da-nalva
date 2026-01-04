"use client";

import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Minus, Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import posthog from "posthog-js";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PedidoPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);
  
  const [mesa, setMesa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return "";
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleSubmitOrder = async () => {
    if (!mesa) {
      alert("Por favor, insira o número da mesa.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mesa,
          itens: items,
          total: getTotal(),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar pedido");
      }

      // Track order submission
      posthog.capture("order_submitted_v2", {
        mesa,
        total_items: items.reduce((acc, item) => acc + item.quantidade, 0),
        total_value: getTotal(),
        item_count: items.length,
      });

      setIsSuccess(true);
      clearCart();
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);

    } catch (error) {
      console.error("Erro:", error);
      alert("Ocorreu um erro ao enviar seu pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    const item = items.find((i) => i._id === itemId);
    if (item) {
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pedido Enviado!</h1>
          <p className="text-gray-600 mb-6">
            Seu pedido para a mesa <strong>{mesa}</strong> foi registrado com sucesso.
            Aguarde enquanto preparamos tudo para você.
          </p>
          <Link href="/">
            <Button className="bg-[#2d9da1] hover:bg-[#258487]">
              Voltar ao Cardápio
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

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

      <div className="p-4 pb-40">
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

        <div className="bg-white rounded-xl shadow-sm mt-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="mesa" className="text-base font-semibold">Número da Mesa</Label>
            <Input 
              id="mesa"
              type="number"
              placeholder="Ex: 12"
              value={mesa}
              onChange={(e) => setMesa(e.target.value)}
              className="text-lg py-6"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <Button
          className="w-full bg-[#2d9da1] hover:bg-[#258487] text-white py-6 rounded-xl text-lg font-semibold flex items-center justify-center gap-2"
          onClick={handleSubmitOrder}
          disabled={isSubmitting || !mesa}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Confirmar Pedido
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
