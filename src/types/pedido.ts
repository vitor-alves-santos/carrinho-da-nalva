import { CartItem } from "./produto";

export type OrderStatus = "Pendente" | "Entregue" | "Cancelado";

export interface Pedido {
  _id?: string;
  mesa: string;
  itens: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
