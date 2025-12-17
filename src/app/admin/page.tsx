"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Produto } from "@/types/produto";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Pencil, Trash2, LogOut } from "lucide-react";
import Link from "next/link";
import ProductForm from "@/components/ProductForm";

const CATEGORIAS_PRINCIPAIS = ["BEBIDAS", "PORÇÕES", "COMBOS", "RECADOS"];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("BEBIDAS");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [formData, setFormData] = useState({
    categoriaPrincipal: "BEBIDAS",
    subcategoria: "",
    nome: "",
    preco: 0,
    descricao: "",
    ativo: true,
    ordem: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchProdutos();
    }
  }, [session]);

  const fetchProdutos = async () => {
    try {
      const response = await fetch("/api/produtos/admin");
      const data = await response.json();
      setProdutos(data);
    } catch (error) {
      console.error("Error fetching produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduto = async () => {
    try {
      const response = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          preco: formData.preco,
        }),
      });

      if (response.ok) {
        await fetchProdutos();
        setIsAddDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error adding produto:", error);
    }
  };

  const handleEditProduto = async () => {
    if (!editingProduto?._id) return;

    try {
      const response = await fetch(`/api/produtos/${editingProduto._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          preco: formData.preco,
        }),
      });

      if (response.ok) {
        await fetchProdutos();
        setIsEditDialogOpen(false);
        setEditingProduto(null);
        resetForm();
      }
    } catch (error) {
      console.error("Error updating produto:", error);
    }
  };

  const handleDeleteProduto = async (id: string) => {
    try {
      const response = await fetch(`/api/produtos/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchProdutos();
      }
    } catch (error) {
      console.error("Error deleting produto:", error);
    }
  };

  const openEditDialog = (produto: Produto) => {
    setEditingProduto(produto);
    setFormData({
      categoriaPrincipal: produto.categoriaPrincipal,
      subcategoria: produto.subcategoria,
      nome: produto.nome,
      preco: produto.preco,
      descricao: produto.descricao,
      ativo: produto.ativo,
      ordem: produto.ordem,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      categoriaPrincipal: activeCategory,
      subcategoria: "",
      nome: "",
      preco: 0,
      descricao: "",
      ativo: true,
      ordem: 0,
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const filteredProdutos = produtos.filter(
    (p) => p.categoriaPrincipal === activeCategory
  );

  const groupedBySubcategoria = filteredProdutos.reduce((acc, produto) => {
    if (!acc[produto.subcategoria]) {
      acc[produto.subcategoria] = [];
    }
    acc[produto.subcategoria].push(produto);
    return acc;
  }, {} as Record<string, Produto[]>);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d9da1]"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold ml-2">Gerenciar Cardápio</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="p-4">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {CATEGORIAS_PRINCIPAIS.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className={
                activeCategory === cat ? "bg-[#2d9da1] hover:bg-[#258487]" : ""
              }
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <h2 className="text-[#2d9da1] font-semibold text-lg mb-4 flex items-center gap-2">
          {activeCategory}
        </h2>

        {Object.entries(groupedBySubcategoria).map(([subcategoria, items]) => (
          <div key={subcategoria} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">{subcategoria}</h3>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-[#2d9da1] hover:bg-[#258487]"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        categoriaPrincipal: activeCategory,
                        subcategoria: subcategoria,
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Produto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Produto</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do novo produto
                    </DialogDescription>
                  </DialogHeader>
                  <ProductForm
                    categoriasPrincipais={CATEGORIAS_PRINCIPAIS}
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleAddProduto}
                    submitLabel="Adicionar"
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {items.map((produto, index) => (
                <div key={produto._id}>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <span className="font-medium">{produto.nome}</span>
                      <span
                        className={`ml-2 text-sm ${
                          produto.ativo ? "text-[#2d9da1]" : "text-gray-400"
                        }`}
                      >
                        {formatPrice(produto.preco)}
                      </span>
                      {!produto.ativo && (
                        <span className="ml-2 text-xs text-red-500">
                          (Inativo)
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(produto)}
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-gray-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Confirmar Exclusão
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir &quot;
                              {produto.nome}&quot;? Esta ação não pode ser
                              desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleDeleteProduto(produto._id!)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {index < items.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(groupedBySubcategoria).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Nenhum produto nesta categoria ainda.
            </p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-[#2d9da1] hover:bg-[#258487]"
                  onClick={() => resetForm()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Primeiro Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Produto</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo produto
                  </DialogDescription>
                </DialogHeader>
                <ProductForm
                  categoriasPrincipais={CATEGORIAS_PRINCIPAIS}
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleAddProduto}
                  submitLabel="Adicionar"
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>Atualize os dados do produto</DialogDescription>
          </DialogHeader>
          <ProductForm
            categoriasPrincipais={CATEGORIAS_PRINCIPAIS}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEditProduto}
            submitLabel="Salvar Alterações"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
