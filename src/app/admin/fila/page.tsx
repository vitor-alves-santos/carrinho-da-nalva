"use client";

import { useEffect, useState, useRef } from "react";
import { Pedido, OrderStatus } from "@/types/pedido";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Clock,
  UtensilsCrossed,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FilaPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const prevDataStr = useRef<string>("");

  const fetchPedidos = async (silent = true) => {
    try {
      if (!silent) setRefreshing(true);
      const response = await fetch("/api/pedidos");
      if (response.ok) {
        const data: Pedido[] = await response.json();
        const newDataStr = JSON.stringify(data);

        if (prevDataStr.current !== newDataStr) {
          setPedidos(data);
          prevDataStr.current = newDataStr;
        }
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(() => fetchPedidos(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/pedidos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchPedidos();
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "Pendente":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pendente
          </Badge>
        );
      case "Entregue":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Entregue
          </Badge>
        );
      case "Cancelado":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Cancelado
          </Badge>
        );
    }
  };

  const OrderCard = ({ pedido }: { pedido: Pedido }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="mb-4"
    >
      <Card
        className={
          pedido.status === "Pendente"
            ? "border-l-4 border-l-yellow-400 shadow-md"
            : "opacity-80"
        }
      >
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              Mesa {pedido.mesa}
              {getStatusBadge(pedido.status)}
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(pedido.createdAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-[#2d9da1]">
              {formatPrice(pedido.total)}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pedido.itens.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>
                  {item.quantidade}x {item.nome}
                </span>
                <span className="text-gray-500">
                  {formatPrice(item.preco * item.quantidade)}
                </span>
              </div>
            ))}
          </div>

          {pedido.status === "Pendente" && (
            <>
              <Separator className="my-4" />
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => updateStatus(pedido._id!, "Entregue")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Entregue
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => updateStatus(pedido._id!, "Cancelado")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UtensilsCrossed className="h-8 w-8 text-[#2d9da1]" />
              Fila de Pedidos
            </h1>
            <p className="text-gray-500">Gerencie os pedidos em tempo real</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPedidos(false)}
            disabled={refreshing}
            className="w-fit"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-[#2d9da1] mb-4" />
            <p className="text-gray-500">Carregando pedidos...</p>
          </div>
        ) : (
          <Tabs defaultValue="pendentes" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="pendentes" className="relative">
                Pendentes
                {pedidos.filter((p) => p.status === "Pendente").length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pedidos.filter((p) => p.status === "Pendente").length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="entregues">Entregues</TabsTrigger>
              <TabsTrigger value="cancelados">Cancelados</TabsTrigger>
            </TabsList>

            <TabsContent value="pendentes">
              <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                <AnimatePresence mode="popLayout">
                  {pedidos.filter((p) => p.status === "Pendente").length > 0 ? (
                    pedidos
                      .filter((p) => p.status === "Pendente")
                      .map((pedido) => (
                        <OrderCard key={pedido._id} pedido={pedido} />
                      ))
                  ) : (
                    <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
                      <p className="text-gray-400">
                        Nenhum pedido pendente no momento.
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="entregues">
              <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                {pedidos
                  .filter((p) => p.status === "Entregue")
                  .map((pedido) => (
                    <OrderCard key={pedido._id} pedido={pedido} />
                  ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="cancelados">
              <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                {pedidos
                  .filter((p) => p.status === "Cancelado")
                  .map((pedido) => (
                    <OrderCard key={pedido._id} pedido={pedido} />
                  ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
