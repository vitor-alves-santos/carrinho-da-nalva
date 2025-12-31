"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Produto } from "@/types/produto";

interface CartState {
  items: CartItem[];
  addItem: (produto: Produto) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantidade: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (produto: Produto) => {
        const items = get().items;
        const existingItem = items.find((item) => item._id === produto._id);
        
        if (existingItem) {
          set({
            items: items.map((item) =>
              item._id === produto._id
                ? { ...item, quantidade: item.quantidade + 1 }
                : item
            ),
          });
        } else {
          set({
            items: [...items, { ...produto, quantidade: 1 }],
          });
        }
      },
      
      removeItem: (id: string) => {
        set({
          items: get().items.filter((item) => item._id !== id),
        });
      },
      
      updateQuantity: (id: string, quantidade: number) => {
        if (quantidade <= 0) {
          get().removeItem(id);
          return;
        }
        
        set({
          items: get().items.map((item) =>
            item._id === id ? { ...item, quantidade } : item
          ),
        });
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + (item.preco || 0) * item.quantidade,
          0
        );
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantidade, 0);
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
