"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Info, Download } from "lucide-react";
import { Produto } from "@/types/produto";
import { Button } from "@/components/ui/button";

/* ============================================================
   HELPERS
   ============================================================ */

const formatPrice = (preco: number) =>
  preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const isRecados = (p: Produto) =>
  (p.categoriaPrincipal ?? "").toUpperCase().includes("RECADOS");

interface Grupo {
  subcategoria: string;
  itens: Produto[];
}

/** Agrupa por subcategoria preservando a ordem de chegada (mesma lógica do ProductList do app). */
function groupBySubcategoria(lista: Produto[]): Grupo[] {
  const grupos: Grupo[] = [];
  const mapa = new Map<string, Grupo>();
  for (const p of lista) {
    let grupo = mapa.get(p.subcategoria);
    if (!grupo) {
      grupo = { subcategoria: p.subcategoria, itens: [] };
      mapa.set(p.subcategoria, grupo);
      grupos.push(grupo);
    }
    grupo.itens.push(p);
  }
  return grupos;
}

const temPreco = (p: Produto) =>
  typeof p.preco === "number" && !Number.isNaN(p.preco);

/* ============================================================
   COMPONENTES DAS FOLHAS (somente informação — sem botões)
   ============================================================ */

function CabecalhoFolha() {
  return (
    <header className="text-center mb-1">
      <h1 className="text-[22px] font-bold tracking-[0.22em] text-gray-900">
        CARRINHO DA NALVA
      </h1>
      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        <span className="h-[2px] w-14 bg-[#2d9da1] rounded-full" />
        <span className="h-[2px] w-1.5 bg-[#2d9da1] rounded-full" />
        <span className="h-[2px] w-1.5 bg-[#2d9da1] rounded-full" />
        <span className="h-[2px] w-14 bg-[#2d9da1] rounded-full" />
      </div>
    </header>
  );
}

function TituloSecao({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mt-5 mb-2.5 first:mt-3">
      <span className="h-px flex-1 bg-[#2d9da1]/30" />
      <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#2d9da1] whitespace-nowrap">
        {children}
      </h2>
      <span className="h-px flex-1 bg-[#2d9da1]/30" />
    </div>
  );
}

function LinhaItem({ produto }: { produto: Produto }) {
  return (
    <div className="avoid-break py-[2px]">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] leading-snug font-medium text-gray-800">
          {produto.nome}
        </span>
        {temPreco(produto) ? (
          <>
            <span
              aria-hidden
              className="flex-1 -translate-y-[2px] border-b border-dotted border-gray-400"
            />
            <span className="text-[10px] leading-snug font-semibold text-gray-900 whitespace-nowrap">
              {formatPrice(produto.preco as number)}
            </span>
          </>
        ) : null}
      </div>
      {produto.descricao ? (
        <p className="pl-1 text-[8.5px] leading-snug text-gray-500 mt-[1px]">
          {produto.descricao}
        </p>
      ) : null}
    </div>
  );
}

function BlocoSubcategoria({ titulo, itens }: { titulo: string; itens: Produto[] }) {
  return (
    <section className="avoid-break mb-2">
      <h3 className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#2d9da1] mb-0.5">
        {titulo}
      </h3>
      <div>
        {itens.map((produto) => (
          <LinhaItem key={produto._id ?? produto.nome} produto={produto} />
        ))}
      </div>
    </section>
  );
}

function BoxKitTiaNalva({ regras }: { regras: string[] }) {
  return (
    <div className="avoid-break rounded-xl border-2 border-[#2d9da1]/50 px-4 py-3 mt-1">
      <div className="flex items-center justify-between border-b border-gray-300 pb-1.5 mb-2">
        <h3 className="text-[12px] font-black uppercase tracking-[0.16em] text-[#2d9da1]">
          KIT TIA NALVA
        </h3>
      </div>
      <ul className="text-[11.5px] leading-relaxed text-gray-700">
        {regras.map((regra) => (
          <li key={regra} className="flex gap-2">
            <span className="text-[#2d9da1] font-bold">•</span>
            <span>{regra}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
   PÁGINA
   ============================================================ */

export default function CardapioFisicoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [kitRules, setKitRules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProdutos = async () => {
    try {
      setError(false);
      setLoading(true);
      const [produtosRes, configuracoesRes] = await Promise.all([
        fetch("/api/produtos"),
        fetch("/api/configuracoes"),
      ]);
      if (!produtosRes.ok) throw new Error(`HTTP error! status: ${produtosRes.status}`);
      const data = await produtosRes.json();
      setProdutos(data);
      if (!configuracoesRes.ok) throw new Error(`HTTP error! status: ${configuracoesRes.status}`);
      const cfg = await configuracoesRes.json();
      setKitRules(Array.isArray(cfg.kitRules) ? cfg.kitRules : []);
    } catch (err) {
      console.error("Erro ao carregar cardápio físico:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const { recados, bebidas, combos, porcoes } = useMemo(() => {
    return {
      recados: produtos.filter(isRecados),
      bebidas: produtos.filter((p) => p.categoriaPrincipal === "BEBIDAS"),
      combos: produtos.filter((p) => p.categoriaPrincipal === "COMBOS"),
      porcoes: produtos.filter((p) => p.categoriaPrincipal === "PORÇÕES"),
    };
  }, [produtos]);

  /* ---------- Face 1: RECADOS e KIT TIA NALVA + BEBIDAS ---------- */
  const face1 = useMemo(() => {
    const gruposBebidas = groupBySubcategoria(bebidas);
    return (
      <div className="sheet face1">
        <CabecalhoFolha />

        <TituloSecao>RECADOS E KIT TIA NALVA</TituloSecao>
        {recados.length > 0 && (
          <ul className="text-[11.5px] leading-relaxed text-gray-700">
            {recados.map((recado) => (
              <li key={recado._id ?? recado.nome} className="flex gap-2 py-[2px] avoid-break">
                <span className="text-[#2d9da1] font-bold shrink-0">•</span>
                <span>{recado.nome}</span>
              </li>
            ))}
          </ul>
        )}
        <BoxKitTiaNalva regras={kitRules} />

        {gruposBebidas.length > 0 && (
          <>
            <TituloSecao>Bebidas</TituloSecao>
            <div className="duas-colunas">
              {gruposBebidas.map((grupo) => (
                <BlocoSubcategoria
                  key={grupo.subcategoria}
                  titulo={grupo.subcategoria}
                  itens={grupo.itens}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }, [recados, bebidas, kitRules]);

  /* ---------- Face 2: COMBOS + PORÇÕES ---------- */
  const face2 = useMemo(() => {
    const gruposPorcoes = groupBySubcategoria(porcoes);
    return (
      <div className="sheet face2">
        <CabecalhoFolha />

        {combos.length > 0 && (
          <>
            <TituloSecao>Combos</TituloSecao>
            <div>
              {combos.map((combo) => (
                <LinhaItem key={combo._id ?? combo.nome} produto={combo} />
              ))}
            </div>
          </>
        )}

        {gruposPorcoes.length > 0 && (
          <>
            <TituloSecao>Porções</TituloSecao>
            <div className="duas-colunas">
              {gruposPorcoes.map((grupo) => (
                <BlocoSubcategoria
                  key={grupo.subcategoria}
                  titulo={grupo.subcategoria}
                  itens={grupo.itens}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }, [combos, porcoes]);

  const EtiquetaFace = ({ children }: { children: React.ReactNode }) => (
    <p className="no-print text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-2 text-center">
      {children}
    </p>
  );

  return (
    <main className="min-h-screen bg-gray-50 py-6 md:py-10 print:bg-white print:py-0">
      {/* Chrome da tela — escondido na impressão */}
      <div className="no-print mx-auto max-w-4xl px-6 mb-10">
        <div>
          <Link href="/admin">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-[#2d9da1] p-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Painel do Cardápio
            </Button>
          </Link>
        </div>
        <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between mt-2">
          <div className="flex items-center gap-3">
            <Printer className="h-8 w-8 text-[#2d9da1] shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cardápio Físico</h1>
              <p className="text-gray-500">
                Prévia do cardápio impresso — frente (RECADOS e KIT TIA NALVA +
                BEBIDAS) e verso (COMBOS + PORÇÕES), direto do catálogo.
              </p>
            </div>
          </div>
          <Button
            onClick={() => window.print()}
            disabled={loading || error}
            className="bg-[#2d9da1] hover:bg-[#258487] text-white shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </header>
        <div className="mt-4 rounded-xl border border-[#2d9da1]/30 bg-[#2d9da1]/5 p-3.5 flex gap-2.5">
          <Info className="h-4 w-4 text-[#2d9da1] shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-gray-600 leading-relaxed">
            Ao clicar em <strong>Baixar PDF</strong> (ou Ctrl+P), escolha o
            destino <strong>&quot;Salvar como PDF&quot;</strong> e ative{" "}
            <strong>&quot;Imprimir em frente e verso&quot;</strong> para a
            frente e o verso saírem em uma única folha A4 (face 1 = página 1,
            face 2 = página 2). Sem duplex, imprima as páginas 1–2 e vire a
            folha manualmente.
          </p>
        </div>
      </div>

      {/* Folhas A4 empilhadas */}
      {loading ? (
        <div className="no-print flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d9da1]" />
          <p className="mt-4 text-gray-500">Carregando cardápio...</p>
        </div>
      ) : error ? (
        <div className="no-print text-center py-16">
          <p className="text-red-500 mb-4">
            Não foi possível carregar o cardápio. Tente novamente.
          </p>
          <Button
            variant="outline"
            className="border-[#2d9da1] text-[#2d9da1] hover:bg-[#2d9da1] hover:text-white"
            onClick={fetchProdutos}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-10 px-4 pb-16 print:gap-0 print:p-0">
          <div className="flex flex-col items-center print:contents">
            <EtiquetaFace>
              Frente — RECADOS e KIT TIA NALVA + BEBIDAS (página 1)
            </EtiquetaFace>
            {face1}
          </div>
          <div className="flex flex-col items-center print:contents">
            <EtiquetaFace>
              Verso — COMBOS + PORÇÕES (página 2)
            </EtiquetaFace>
            {face2}
          </div>
        </div>
      )}

      <style>{`
        .sheet {
          width: min(794px, 100%);
          min-height: 1123px;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 42px 40px 34px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .avoid-break {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .duas-colunas {
          column-count: 2;
          column-gap: 44px;
        }
        .duas-colunas > * {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        @media (max-width: 640px) {
          .sheet {
            min-height: auto;
            padding: 20px 16px 18px;
            border-radius: 8px;
          }
          .duas-colunas {
            column-gap: 15px;
          }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html,
          body {
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .sheet {
            width: 210mm;
            height: 296mm;
            min-height: 296mm;
            max-height: 296mm;
            box-shadow: none;
            border: none;
            border-radius: 0;
            margin: 0;
            padding: 11mm 10mm;
            overflow: hidden;
          }
          .sheet.face1 {
            page-break-after: always;
            break-after: page;
          }
          .sheet.face2 {
            page-break-before: always;
            break-before: page;
          }
          .sheet * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  );
}
