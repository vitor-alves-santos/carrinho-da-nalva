export interface Produto {
  _id?: string;
  categoriaPrincipal: string;
  subcategoria: string;
  nome: string;
  preco: number;
  descricao: string;
  ativo: boolean;
  ordem: number;
}

export interface CartItem extends Produto {
  quantidade: number;
}
