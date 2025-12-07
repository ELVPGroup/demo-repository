import type { ClientProduct } from '@/types/product';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 客户端购物车状态管理
interface CartState {
  products: ClientProduct[];
  totalPrice: number;
  totalQuantity: number; // 购物车中商品的总数量
  // 购物车是否为空
  isEmpty: boolean;
  // 添加商品到购物车
  addProduct: (product: ClientProduct, quantity?: number) => void;
  // 从购物车移除商品
  removeProduct: (product: ClientProduct) => void;
  // 清空购物车
  clearCart: () => void;
  // 更新购物车某个商品数量
  updateProductQuantity: (productId: string, newProductQuantity: number) => void;
}

const updateTotalPrice = (products: ClientProduct[]) => {
  return products.reduce((sum, product) => sum + product.price * product.quantity, 0);
};
const updateTotalQuantity = (products: ClientProduct[]) => {
  return products.reduce((sum, product) => sum + product.quantity, 0);
};

const MIN_QTY = 1;

// 购物车商品数量规范化函数
const sanitizeQuantity = (n: number, product: ClientProduct) => {
  if (!Number.isFinite(n)) return MIN_QTY;
  const i = Math.floor(n);
  const res = Math.max(MIN_QTY, Math.min(product.amount, i));
  console.log('sanitizeQuantity', n, product, i, res);
  return res;
};

// 从购物车商品列表派生的状态
const deriveState = (products: ClientProduct[]) => ({
  products,
  totalPrice: updateTotalPrice(products),
  totalQuantity: updateTotalQuantity(products),
  isEmpty: products.length === 0,
});

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      products: [],
      totalPrice: 0,
      totalQuantity: 0,
      isEmpty: true,

      addProduct: (product: ClientProduct, quantity: number = 1) =>
        set((state) => {
          const existing = state.products.find((p) => p.productId === product.productId);
          if (existing) {
            const nextProducts = state.products.map((p) =>
              p.productId === product.productId
                ? { ...p, quantity: sanitizeQuantity(p.quantity + quantity, p) }
                : p
            );
            return deriveState(nextProducts);
          }
          const nextProducts = [
            ...state.products,
            { ...product, quantity: sanitizeQuantity(quantity, product) },
          ];
          return deriveState(nextProducts);
        }),

      removeProduct: (product: ClientProduct) =>
        set((state) => {
          const nextProducts = state.products.filter((p) => p.productId !== product.productId);
          return deriveState(nextProducts);
        }),

      clearCart: () => set(() => deriveState([])),

      updateProductQuantity: (productId: string, newProductQuantity: number) => {
        set((state) => {
          const product = state.products.find((p) => p.productId === productId);
          if (!product) return state;
          const nextProducts = state.products.map((p) =>
            p.productId === productId
              ? { ...p, quantity: sanitizeQuantity(newProductQuantity, p) }
              : p
          );
          return deriveState(nextProducts);
        });
      },
    }),
    {
      name: 'evlp-user-cart-storage',
    }
  )
);
