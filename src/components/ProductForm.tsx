import { Produto } from "@/types/produto";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const ProductForm = ({
  formData,
  setFormData,
  onSubmit,
  submitLabel,
  categoriasPrincipais,
}: {
  formData: Omit<Produto, "_id">;
  setFormData: React.Dispatch<React.SetStateAction<Omit<Produto, "_id">>>;
  onSubmit: () => void;
  submitLabel: string;
  categoriasPrincipais: string[];
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Categoria Principal</Label>
      <Select
        value={formData.categoriaPrincipal}
        onValueChange={(value) =>
          setFormData({ ...formData, categoriaPrincipal: value })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categoriasPrincipais.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Subcategoria</Label>
      <Input
        value={formData.subcategoria}
        onChange={(e) =>
          setFormData({ ...formData, subcategoria: e.target.value })
        }
        placeholder="Ex: Cervejas, Lanches..."
      />
    </div>
    <div className="space-y-2">
      <Label>Nome do Produto</Label>
      <Input
        value={formData.nome}
        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
        placeholder="Ex: Brahma (lata)"
      />
    </div>
    <div className="space-y-2">
      <Label>Preço (R$)</Label>
      <Input
        type="number"
        step="0.01"
        value={formData.preco}
        onChange={(e) =>
          setFormData({ ...formData, preco: parseFloat(e.target.value) })
        }
        placeholder="0.00"
      />
    </div>
    <div className="space-y-2">
      <Label>Descrição (opcional)</Label>
      <Input
        value={formData.descricao}
        onChange={(e) =>
          setFormData({ ...formData, descricao: e.target.value })
        }
        placeholder="Descrição do produto..."
      />
    </div>
    <div className="space-y-2">
      <Label>Ordem de Exibição</Label>
      <Input
        type="number"
        value={formData.ordem}
        onChange={(e) =>
          setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })
        }
      />
    </div>
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="ativo"
        checked={formData.ativo}
        onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
        className="rounded"
      />
      <Label htmlFor="ativo">Produto Ativo</Label>
    </div>
    <Button
      className="w-full bg-[#2d9da1] hover:bg-[#258487]"
      onClick={onSubmit}
    >
      {submitLabel}
    </Button>
  </div>
);

export default ProductForm;
