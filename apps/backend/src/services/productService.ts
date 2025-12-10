import prisma from '@/db.js';
import { merchantModel } from '@/models/merchantModel.js';
import { ServiceKey, generateServiceId } from '@/utils/serverIdHandler.js';
import type { ProductModel } from 'generated/prisma/models.js';

class ProductService {
  private generateProvideProductStruct(product: ProductModel) {
    return {
      productId: generateServiceId(product.productId, ServiceKey.product),
      name: product.name,
      description: product.description ?? '',
      price: Number(product.price),
      amount: product.amount,
      imageUrl: product.imageUrl ?? '',
      merchantId: generateServiceId(product.merchantId, ServiceKey.merchant),
    };
  }

  /**
   * 列出商家的所有商品
   * @param merchantId 商家ID
   * @returns 商品列表
   */
  async list(merchantId: number) {
    const products = await prisma.product.findMany({
      where: { merchantId },
      orderBy: { productId: 'desc' },
    });
    return products.map((product) => this.generateProvideProductStruct(product));
  }

  /**
   * 新增或更新商品（依据是否传入 productId）
   * @param payload 请求负载，包含商家ID与商品信息
   */
  async upsert(payload: {
    merchantId: number;
    productId?: number | undefined;
    name: string;
    description?: string | null;
    price: number;
    amount: number;
    imageUrl?: string | null;
  }) {
    const merchantExists = await merchantModel.findById(payload.merchantId);
    if (!merchantExists) {
      throw new Error('商家未注册，无法添加或更新商品');
    }

    const data = {
      name: payload.name,
      description: payload.description ?? null,
      price: payload.price,
      amount: payload.amount,
      imageUrl: payload.imageUrl ?? null,
      merchantId: payload.merchantId,
    };

    if (payload.productId) {
      const existing = await prisma.product.findUnique({ where: { productId: payload.productId } });
      if (!existing) {
        throw new Error('商品不存在，无法更新');
      }
      if (existing.merchantId !== payload.merchantId) {
        throw new Error('无权操作其他商家的商品');
      }
      const updated = await prisma.product.update({
        where: { productId: payload.productId },
        data,
      });
      return this.generateProvideProductStruct(updated);
    }

    const created = await prisma.product.create({ data });
    return this.generateProvideProductStruct(created);
  }

  /**
   * 删除商家的商品
   * @param merchantId 商家ID
   * @param productId 商品ID
   */
  async delete(merchantId: number, productId: number) {
    const existing = await prisma.product.findUnique({ where: { productId } });
    if (!existing) {
      throw new Error('商品不存在，无法删除');
    }
    if (existing.merchantId !== merchantId) {
      throw new Error('无权删除其他商家的商品');
    }
    const deleted = await prisma.product.delete({ where: { productId } });
    return this.generateProvideProductStruct(deleted);
  }

  /**
   * 客户端商品列表
   * @param params 分页参数
   */
  async listClient(params: { limit?: number; offset?: number; productName?: string }) {
    console.log('service params', params);
    const products = await prisma.product.findMany({
      ...(params.offset !== undefined ? { skip: params.offset } : {}),
      ...(params.limit !== undefined ? { take: params.limit } : {}),
      ...(params.productName !== undefined
        ? { where: { name: { contains: params.productName } } }
        : {}),
      orderBy: { productId: 'desc' },
      include: { merchant: { select: { name: true } } },
    });
    const total = await prisma.product.count({
      ...(params.productName !== undefined
        ? { where: { name: { contains: params.productName } } }
        : {}),
    });
    const data = products.map((product) => ({
      ...this.generateProvideProductStruct(product),
      merchantName: product.merchant?.name ?? '',
    }));
    return { data, total };
  }
}

export const productService = new ProductService();
