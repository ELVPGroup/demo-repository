export interface Product {
  productId: number;
  name: string;
  description: string;
  price: number;
  quantity: number; // 商品购买数量
  amount: number; // 商品库存
  imageUrl: string;
  merchantId: number;
}
