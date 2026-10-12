"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Pedido, OrderStatus } from "@/types/pedido";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  XCircle,
  Clock,
  UtensilsCrossed,
  RefreshCw,
  Search,
  MessageCircle,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminNav from "@/components/AdminNav";
import {
  currentMonth,
  formatMonthLabel,
  monthIndex,
  monthOf,
} from "@/lib/date-br";
import { toast } from "sonner";

const formatPrice = (price: number) => {
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

/**
 * Meses mais recentes que a exclusão nunca atinge.
 * Regra espelhada na API (fonte de verdade); aqui serve para limitar o seletor.
 */
const MESES_PROTEGIDOS = 3;

type PreviaExclusao = {
  total: number;
  months: { month: string; count: number }[];
};

/** "jun/2024 a jun/2026" a partir da lista desc (decrescente) da API. */
const formatarFaixa = (months: { month: string }[]) => {
  if (months.length === 0) return "";
  if (months.length === 1) return formatMonthLabel(months[0].month);
  return `${formatMonthLabel(months[months.length - 1].month)} a ${formatMonthLabel(
    months[0].month,
  )}`;
};

export default function FilaPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosHistorico, setPedidosHistorico] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterMesa, setFilterMesa] = useState("");
  const [activeTab, setActiveTab] = useState("pendentes");
  const prevDataStr = useRef<string>("");
  // Exclusão do histórico (aba Histórico)
  const [painelExclusaoAberto, setPainelExclusaoAberto] = useState(false);
  const [mesLimite, setMesLimite] = useState("");
  const [previa, setPrevia] = useState<PreviaExclusao | null>(null);
  const [carregandoPrevia, setCarregandoPrevia] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [palavraConfirmacao, setPalavraConfirmacao] = useState("");
  const [dialogoExclusaoAberto, setDialogoExclusaoAberto] = useState(false);
  const buscaPreviaIdRef = useRef(0);
  // 🎵 SOM
  const playNotificationSound = () => {
    new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    )
      .play()
      .catch(console.error);
  };

  // 🔔 BROWSER NOTIF
  const showBrowserNotification = (mesa: string) => {
    if (!("Notification" in window) || Notification.permission !== "granted")
      return;
    new Notification("Novo pedido recebido!", {
      body: `Mesa ${mesa} fez pedido.`,
      icon: "/favicon.ico",
    });
  };

  const fetchPedidos = useCallback(async (silent = true) => {
    try {
      if (!silent) setRefreshing(true);
      const response = await fetch("/api/pedidos");
      if (response.ok) {
        const data: Pedido[] = await response.json();
        const newDataStr = JSON.stringify(data);

        if (prevDataStr.current !== newDataStr) {
          // Detecta novos pedidos comparando os IDs
          const prevPedidos = JSON.parse(
            prevDataStr.current || "[]",
          ) as Pedido[];
          const newPedidos = data.filter(
            (np) => !prevPedidos.some((op) => op._id === np._id),
          );

          if (newPedidos.length > 0 && prevDataStr.current !== "") {
            const newest = newPedidos[0];
            toast.success("Novo pedido!", {
              description: `Mesa ${newest.mesa} fez pedido de ${formatPrice(newest.total)}`,
              duration: 10000,
            });
            playNotificationSound();
            showBrowserNotification(newest.mesa);
          }

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
  }, []);

  const fetchHistorico = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch("/api/pedidos?history=true");
      if (response.ok) {
        const data = await response.json();
        setPedidosHistorico(data);
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  /** Busca a contagem do que seria apagado até `before` (prévia no painel). */
  const buscarPrevia = useCallback(async (before: string) => {
    if (!before) {
      setPrevia(null);
      setCarregandoPrevia(false);
      return;
    }

    const id = ++buscaPreviaIdRef.current;
    setCarregandoPrevia(true);

    try {
      const response = await fetch(
        `/api/pedidos/historico?before=${before}&count=true`,
      );
      const data = await response.json();

      // Descarta resposta obsoleta (seleção trocada durante o voo).
      if (id !== buscaPreviaIdRef.current) return;

      if (response.ok) {
        setPrevia(data as PreviaExclusao);
      } else {
        setPrevia(null);
        toast.error(data.error || "Não foi possível verificar o impacto.");
      }
    } catch {
      if (id === buscaPreviaIdRef.current) {
        setPrevia(null);
        toast.error("Não foi possível verificar o impacto.");
      }
    } finally {
      if (id === buscaPreviaIdRef.current) setCarregandoPrevia(false);
    }
  }, []);

  useEffect(() => {
    if (!painelExclusaoAberto) {
      setPrevia(null);
      setCarregandoPrevia(false);
      return;
    }

    buscarPrevia(mesLimite);
  }, [painelExclusaoAberto, mesLimite, buscarPrevia]);

  const excluirHistorico = async () => {
    if (!mesLimite) return;

    setExcluindo(true);
    try {
      const response = await fetch(`/api/pedidos/historico?before=${mesLimite}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Histórico excluído", {
          description: `${data.deletedCount} pedidos removidos até ${formatMonthLabel(mesLimite)}.`,
        });
        setPainelExclusaoAberto(false);
        setMesLimite("");
        setPalavraConfirmacao("");
        setPrevia(null);
        await fetchHistorico();
      } else {
        toast.error(data.error || "Não foi possível excluir o histórico.");
      }
    } catch (error) {
      console.error("Erro ao excluir histórico:", error);
      toast.error("Não foi possível excluir o histórico.");
    } finally {
      setExcluindo(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(() => fetchPedidos(true), 10000);

    // Request permission for notifications
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, [fetchPedidos]);

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

  const generateWhatsAppUrl = (pedido: Pedido) => {
    const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "12988699703";
    const text =
      `*Pedido - Mesa ${pedido.mesa}*%0A%0A` +
      pedido.itens
        .map(
          (item) =>
            `- ${item.quantidade}x ${item.nome} (${formatPrice(item.preco * item.quantidade)})`,
        )
        .join("%0A") +
      `%0A%0A*Total: ${formatPrice(pedido.total)}*`;

    return `https://wa.me/${number}?text=${text}`;
  };

  const filteredPedidos = pedidos.filter((pedido) =>
    pedido.mesa.toLowerCase().includes(filterMesa.toLowerCase()),
  );

  const filteredHistorico = pedidosHistorico.filter((pedido) =>
    pedido.mesa.toLowerCase().includes(filterMesa.toLowerCase()),
  );

  /**
   * Meses realmente disponíveis para exclusão: apenas os que existem no histórico
   * e que estão fora da janela protegida (3 meses mais recentes).
   */
  const mesesElegiveis = useMemo(() => {
    const limiteMaximo = monthIndex(currentMonth()) - MESES_PROTEGIDOS;
    const meses = new Set<string>();

    for (const pedido of pedidosHistorico) {
      const data = new Date(pedido.createdAt);
      if (Number.isNaN(data.getTime())) continue;

      const mes = monthOf(data);
      if (monthIndex(mes) <= limiteMaximo) meses.add(mes);
    }

    return Array.from(meses).sort((a, b) => monthIndex(b) - monthIndex(a));
  }, [pedidosHistorico]);

  /** Motivo de o controle de exclusão estar indisponível, se houver. */
  const motivoBloqueio = filterMesa
    ? "Limpe o filtro de mesa para excluir o histórico."
    : pedidosHistorico.length === 0
      ? "Não há histórico para excluir."
      : mesesElegiveis.length === 0
        ? "Nenhum mês disponível para exclusão: os últimos 3 meses são sempre preservados."
        : null;

  const podeExcluir =
    !motivoBloqueio &&
    !!mesLimite &&
    !!previa &&
    previa.total > 0 &&
    palavraConfirmacao === "EXCLUIR" &&
    !excluindo;

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
              <div className="space-y-2">
                <a
                  href={generateWhatsAppUrl(pedido)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar no WhatsApp
                </a>
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
        <div className="flex justify-end">
          <AdminNav />
        </div>
        <header className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UtensilsCrossed className="h-8 w-8 text-[#2d9da1]" />
              Fila de Pedidos
            </h1>
            <p className="text-gray-500">Gerencie os pedidos em tempo real</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Filtrar por mesa..."
                className="pl-9"
                value={filterMesa}
                onChange={(e) => setFilterMesa(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPedidos(false)}
              disabled={refreshing}
              className="w-full sm:w-fit"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-[#2d9da1] mb-4" />
            <p className="text-gray-500">Carregando pedidos...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pendentes" className="relative">
                Pendentes
                {filteredPedidos.filter((p) => p.status === "Pendente").length >
                  0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {
                      filteredPedidos.filter((p) => p.status === "Pendente")
                        .length
                    }
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="entregues">Entregues</TabsTrigger>
              <TabsTrigger value="cancelados">Cancelados</TabsTrigger>
              <TabsTrigger 
                value="historico" 
                onClick={() => fetchHistorico()}
              >
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pendentes">
              <ScrollArea className="pr-4">
                <AnimatePresence mode="popLayout">
                  {filteredPedidos.filter((p) => p.status === "Pendente")
                    .length > 0 ? (
                    filteredPedidos
                      .filter((p) => p.status === "Pendente")
                      .map((pedido) => (
                        <OrderCard key={pedido._id} pedido={pedido} />
                      ))
                  ) : (
                    <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
                      <p className="text-gray-400">
                        {filterMesa
                          ? `Nenhum pedido pendente para a mesa ${filterMesa}.`
                          : "Nenhum pedido pendente no momento."}
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="entregues">
              <ScrollArea className="pr-4">
                {filteredPedidos
                  .filter((p) => p.status === "Entregue")
                  .map((pedido) => (
                    <OrderCard key={pedido._id} pedido={pedido} />
                  ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="cancelados">
              <ScrollArea className="pr-4">
                {filteredPedidos
                  .filter((p) => p.status === "Cancelado")
                  .map((pedido) => (
                    <OrderCard key={pedido._id} pedido={pedido} />
                  ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="historico">
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPainelExclusaoAberto((aberto) => !aberto)}
                  className="border-[#2d9da1] text-[#2d9da1] hover:bg-[#2d9da1] hover:text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir histórico
                  <ChevronDown
                    className={`h-4 w-4 ml-2 transition-transform ${
                      painelExclusaoAberto ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {motivoBloqueio && (
                  <p className="mt-2 text-xs text-gray-500">{motivoBloqueio}</p>
                )}

                {painelExclusaoAberto && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-white p-4 space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">
                        Apagar tudo antes de...
                      </p>
                      <p className="text-xs text-gray-500">
                        Remove em definitivo os pedidos de todos os meses anteriores
                        ao selecionado. Os {MESES_PROTEGIDOS} meses mais recentes
                        são sempre preservados.
                      </p>
                    </div>

                    <Select value={mesLimite} onValueChange={setMesLimite}>
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Escolha um mês limite" />
                      </SelectTrigger>
                      <SelectContent>
                        {mesesElegiveis.map((mes) => (
                          <SelectItem key={mes} value={mes}>
                            {formatMonthLabel(mes)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {carregandoPrevia ? (
                      <p className="text-xs text-gray-500">
                        Verificando o impacto...
                      </p>
                    ) : previa && previa.total > 0 ? (
                      <p className="text-sm text-gray-700">
                        <strong>{previa.total}</strong> pedidos de{" "}
                        <strong>{formatarFaixa(previa.months)}</strong> serão
                        apagados.
                      </p>
                    ) : previa ? (
                      <p className="text-xs text-gray-500">
                        Não há pedidos neste período para excluir.
                      </p>
                    ) : null}

                    <div className="space-y-1">
                      <label
                        htmlFor="confirmacao-exclusao-historico"
                        className="text-xs font-medium text-gray-700"
                      >
                        Digite <span className="font-bold">EXCLUIR</span> para
                        confirmar
                      </label>
                      <Input
                        id="confirmacao-exclusao-historico"
                        value={palavraConfirmacao}
                        onChange={(e) => setPalavraConfirmacao(e.target.value)}
                        placeholder="EXCLUIR"
                        className="max-w-xs"
                        autoComplete="off"
                      />
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!podeExcluir}
                      onClick={() => setDialogoExclusaoAberto(true)}
                    >
                      {excluindo ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Excluir histórico
                    </Button>
                  </div>
                )}
              </div>

              <ScrollArea className="pr-4">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#2d9da1] mb-2" />
                    <p className="text-sm text-gray-500">
                      Buscando histórico...
                    </p>
                  </div>
                ) : filteredHistorico.length > 0 ? (
                  (() => {
                    const grouped = filteredHistorico.reduce(
                      (acc, pedido) => {
                        const date = new Date(pedido.createdAt);
                        const month = date.toLocaleString("pt-BR", {
                          month: "long",
                        });
                        const year = date.getFullYear();
                        const key = `${month} de ${year}`;

                        if (!acc[key]) {
                          acc[key] = [];
                        }
                        acc[key].push(pedido);
                        return acc;
                      },
                      {} as Record<string, Pedido[]>,
                    );

                    return Object.entries(grouped).map(([monthYear, items]) => (
                      <div key={monthYear} className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider shrink-0">
                            {monthYear}
                          </h3>
                          <div className="h-px bg-gray-200 w-full" />
                        </div>
                        <div className="space-y-4">
                          {items.map((pedido) => (
                            <OrderCard key={pedido._id} pedido={pedido} />
                          ))}
                        </div>
                      </div>
                    ));
                  })()
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
                    <p className="text-gray-400">
                      Nenhum pedido no histórico.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        <AlertDialog
          open={dialogoExclusaoAberto}
          onOpenChange={setDialogoExclusaoAberto}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir histórico em definitivo?</AlertDialogTitle>
              <AlertDialogDescription>
                {previa && previa.total > 0 ? (
                  <>
                    Serão apagados <strong>{previa.total}</strong> pedidos de{" "}
                    <strong>{formatarFaixa(previa.months)}</strong>. Esta ação não
                    pode ser desfeita.
                  </>
                ) : (
                  <>Esta ação não pode ser desfeita.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={excluirHistorico}
              >
                Excluir definitivamente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
