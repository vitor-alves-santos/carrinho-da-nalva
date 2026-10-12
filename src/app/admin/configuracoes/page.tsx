"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sun, Moon, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type Tema = "claro" | "escuro";

interface Configuracoes {
  tema: Tema;
  kitRules: string[];
}

export default function ConfiguracoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tema, setTema] = useState<Tema>("claro");
  const [kitRules, setKitRules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  const fetchConfiguracoes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/configuracoes");
      if (!res.ok) throw new Error("Erro ao carregar configurações");
      const data: Configuracoes = await res.json();
      setTema(data.tema);
      setKitRules(data.kitRules);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível carregar as configurações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchConfiguracoes();
  }, [session]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, kitRules }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      toast.success("Configurações salvas com sucesso!");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const updateRule = (index: number, value: string) => {
    setKitRules((prev) => prev.map((r, i) => (i === index ? value : r)));
  };

  const addRule = () => setKitRules((prev) => [...prev, ""]);

  const removeRule = (index: number) =>
    setKitRules((prev) => prev.filter((_, i) => i !== index));

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d9da1]" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between py-4 px-4">
          <Link href="/admin">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-[#2d9da1] p-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Painel
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Configurações</h1>
          <div className="w-[120px]" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* Tema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-[#2d9da1]" />
              Tema do Sistema
            </CardTitle>
            <CardDescription>
              Escolha o tema claro ou escuro para toda a aplicação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {(["claro", "escuro"] as Tema[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTema(t)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-6 transition-all ${
                    tema === t
                      ? "border-[#2d9da1] bg-[#2d9da1]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {t === "claro" ? (
                    <Sun className="h-8 w-8 text-[#2d9da1]" />
                  ) : (
                    <Moon className="h-8 w-8 text-[#2d9da1]" />
                  )}
                  <span className="font-medium capitalize">{t}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regras do KIT TIA NALVA */}
        <Card>
          <CardHeader>
            <CardTitle>Regras do KIT TIA NALVA</CardTitle>
            <CardDescription>
              Estas regras aparecem no cardápio físico (frente). Adicione, edite
              ou remova itens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {kitRules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-[#2d9da1] font-bold shrink-0 w-5 text-right">
                  {index + 1}.
                </span>
                <Input
                  value={rule}
                  onChange={(e) => updateRule(index, e.target.value)}
                  placeholder="Ex: Consumo mínimo: R$150,00"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeRule(index)}
                  aria-label="Remover regra"
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Separator />
            <Button
              type="button"
              variant="outline"
              className="w-full border-[#2d9da1] text-[#2d9da1] hover:bg-[#2d9da1] hover:text-white"
              onClick={addRule}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Regra
            </Button>
          </CardContent>
        </Card>

        {/* Salvar */}
        <div className="sticky bottom-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#2d9da1] hover:bg-[#258487] text-white shadow-lg"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
