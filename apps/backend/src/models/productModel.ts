import prisma from '../db.js';

export class ProductModel {
  async findById(productId: number) {
    return prisma.product.findUnique({ where: { productId } });
  }
}

export const productModel = new ProductModel();
