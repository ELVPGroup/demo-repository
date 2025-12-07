export interface ClientProduct {
  productId: string;
  name: string;
  description: string;
  price: number;
  amount: number; // 库存
  quantity: number; // 购物车中的数量
  imageUrl?: string;
  merchantId: string;
  merchantName: string;
}
