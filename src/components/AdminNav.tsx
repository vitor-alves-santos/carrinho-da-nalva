"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import posthog from "posthog-js";
import {
  ClipboardList,
  LayoutList,
  Utensils,
  Printer,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ATALHOS = [
  { href: "/admin", label: "Gerenciar Cardápio", Icone: ClipboardList },
  { href: "/admin/fila", label: "Fila de Pedidos", Icone: LayoutList },
  { href: "/", label: "Cardápio", Icone: Utensils },
  { href: "/admin/cardapio-fisico", label: "Cardápio Físico", Icone: Printer },
  { href: "/admin/configuracoes", label: "Configurações", Icone: Settings },
] as const;

/**
 * Barra de atalhos do painel administrativo.
 *
 * Usada nas telas "Gerenciar Cardápio", "Fila de Pedidos", "Cardápio Físico"
 * e "Configurações". Não deve ser usada no cardápio público ("/").
 *
 * Inclui o atalho "Gerenciar Cardápio" para que as demais telas tenham como
 * voltar ao painel principal.
 */
export default function AdminNav() {
  return (
    <div className="flex items-center gap-0.5">
      {ATALHOS.map(({ href, label, Icone }) => (
        <Link key={href} href={href}>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex border-[#2d9da1] text-[#2d9da1] hover:bg-[#2d9da1] hover:text-white"
          >
            <Icone className="h-4 w-4" />
            {label}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="sm:hidden border-[#2d9da1] text-[#2d9da1]"
            aria-label={label}
          >
            <Icone className="h-4 w-4" />
          </Button>
        </Link>
      ))}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sair"
        onClick={() => {
          posthog.capture("admin_logged_out");
          posthog.reset();
          signOut();
        }}
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
}
