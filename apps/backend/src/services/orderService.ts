import type {
  MerchantOrderListParams,
  ClientOrderListParams,
  MerchantOrderListFilterParams,
  ClientOrderListFilterParams,
  CreateOrderPayload,
  UpdateOrderServicePayload,
} from '../types/order.js';
import { orderModel } from '../models/orderModel.js';
import { userModel } from '../models/userModel.js';
import type { OrderStatus } from '../types/order.js';
import type { Prisma } from 'generated/prisma/client.js';
import { parseServiceId } from '@/utils/serverIdHandler.js';
import prisma from '../db.js';
import { addressModel } from '@/models/addressModel.js';
import { productModel } from '@/models/productModel.js';
import { addressService } from '@/services/addressService.js';
import { generateServiceId } from '@/utils/serverIdHandler.js';
import { ServiceKey } from '@/utils/serverIdHandler.js';
import { getDictName, orderStatusDict, shippingStatusDict } from '@/utils/dicts.js';
import {
  getDefinedKeyValues,
  haversineDistanceMeters,
  METERS_PER_DEGREE_LAT,
  metersPerDegreeLonAtLat,
  parseAmapPolyline,
  kmhToMps,
} from '@/utils/general.js';
import { logisticsService } from '@/services/logisticsService.js';
import { amapClient } from '@/amapClient.js';
import dayjs from 'dayjs';

// 订单列表查询时需要包含的关联模型
const orderModelFindInclude = {
  orderItems: { include: { product: { select: { price: true } } } },
  user: { select: { name: true } },
  merchant: { select: { name: true } },
};
type OrderListPayload = Prisma.OrderGetPayload<{
  include: typeof orderModelFindInclude;
}>;

// 配送区域订单列表查询时需要包含的关联模型
const areaOrderModelFindInclude = {
  orderItems: { include: { product: { select: { price: true } } } },
  user: { select: { name: true } },
  merchant: { select: { name: true } },
  detail: { include: { addressTo: true } },
};
type AreaOrderListPayload = Prisma.OrderGetPayload<{
  include: typeof areaOrderModelFindInclude;
}>;

export class OrderService {
  /**
   * 获取用户/商家订单列表
   */
  async getOrderList(
    payload:
      | (MerchantOrderListParams & Partial<MerchantOrderListFilterParams>)
      | (ClientOrderListParams & Partial<ClientOrderListFilterParams>)
  ) {
    const where: Prisma.OrderWhereInput = {};
    if ('merchantId' in payload && payload.merchantId !== undefined) {
      // 商家订单列表
      where['merchantId'] = payload.merchantId;
      if ('customerName' in payload && payload.customerName) {
        const users = await userModel.findByName(payload.customerName);
        if (users.length > 0) {
          where['userId'] = { in: users.map((user) => user.userId) };
        }
      }
    } else if ('userId' in payload && payload.userId !== undefined) {
      // 客户订单列表
      where['userId'] = payload.userId;
      if ('productName' in payload && payload.productName) {
        // 通过orderItems查询产品名称
        where['orderItems'] = {
          some: {
            product: {
              name: { contains: payload.productName, mode: 'insensitive' },
            },
          },
        };
      }
      if ('orderId' in payload && payload.orderId !== undefined) {
        where['orderId'] = Number(payload.orderId);
      }
    } else {
      throw new Error('必须提供商家ID或用户ID');
    }
    // 通用的订单状态筛选
    if ('status' in payload && payload.status !== undefined) {
      where['status'] = payload.status;
    }
    const orders = (await orderModel.findMany({
      where,
      ...(payload.offset !== undefined ? { skip: payload.offset } : {}),
      ...(payload.limit !== undefined ? { take: payload.limit } : {}),
      ...(payload.sort && payload.sortBy ? { orderBy: { [payload.sortBy]: payload.sort } } : {}),
      include: orderModelFindInclude,
    })) as OrderListPayload[];

    return orders.map((order) => {
      const amount = order.orderItems.reduce(
        (acc: number, it: { quantity: number }) => acc + it.quantity,
        0
      );
      const totalPrice = order.orderItems.reduce(
        (acc: number, it) => acc + it.quantity * Number(it.product.price),
        0
      );
      return {
        orderId: generateServiceId(order.orderId, ServiceKey.order),
        status: getDictName<OrderStatus>(order.status, orderStatusDict),
        createdAt: dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        userId: generateServiceId(order.userId!, ServiceKey.client),
        merchantId: generateServiceId(order.merchantId!, ServiceKey.merchant),
        amount,
        totalPrice: totalPrice.toFixed(2),
        ...('merchantId' in payload && payload.merchantId !== undefined
          ? { userName: order.user?.name ?? '' }
          : {}),
        ...('userId' in payload && payload.userId !== undefined
          ? { merchantName: order.merchant?.name ?? '' }
          : {}),
      };
    });
  }

  /**
   * 获取配送区域订单列表
   */
  async getDeliveryAreaOrderList(
    payload: MerchantOrderListParams & Partial<MerchantOrderListFilterParams>
  ) {
    // 查找商家之前配置的配送区域
    const deliveryArea = await prisma.deliveryArea.findUnique({
      where: { merchantId: payload.merchantId },
    });
    if (!deliveryArea) {
      throw new Error('未配置配送区域');
    }

    const where: Prisma.OrderWhereInput = {};
    where['merchantId'] = payload.merchantId;
    if (payload.status !== undefined) {
      where['status'] = payload.status;
    }

    let ordersRaw: AreaOrderListPayload[] = [];

    // 配送区域中心点与半径处理
    const centerLon = Number(deliveryArea.longitude);
    const centerLat = Number(deliveryArea.latitude);
    const radiusMeters = Number(deliveryArea.radius);

    // 根据半径计算纬度方向上的最大偏移量
    const latDelta = radiusMeters / METERS_PER_DEGREE_LAT;
    // 根据当前纬度计算经度方向上的最大偏移量（经度1°长度随纬度变化）
    const lonDelta = radiusMeters / metersPerDegreeLonAtLat(centerLat);

    // 先使用矩形边界做粗筛，减少后续精确计算量
    where['detail'] = {
      is: {
        addressTo: {
          is: {
            longitude: { gte: centerLon - lonDelta, lte: centerLon + lonDelta },
            latitude: { gte: centerLat - latDelta, lte: centerLat + latDelta },
          },
        },
      },
    };

    ordersRaw = (await orderModel.findMany({
      where,
      ...(payload.offset !== undefined ? { skip: payload.offset } : {}),
      ...(payload.limit !== undefined ? { take: payload.limit } : {}),
      ...(payload.sort && payload.sortBy ? { orderBy: { [payload.sortBy]: payload.sort } } : {}),
      include: areaOrderModelFindInclude,
    })) as AreaOrderListPayload[];

    ordersRaw = ordersRaw.filter((o) => {
      const to = o.detail?.addressTo;
      if (!to) return false;
      const d = haversineDistanceMeters([centerLon, centerLat], [to.longitude, to.latitude]);
      return d <= radiusMeters;
    });

    return ordersRaw.map((order) => {
      const to = order.detail?.addressTo;
      const location = to ? ([to.longitude, to.latitude] as [number, number]) : undefined;
      const distance = location
        ? haversineDistanceMeters([centerLon, centerLat], location)
        : undefined;
      const inRange = typeof distance === 'number' ? distance <= radiusMeters : false;
      const amount = order.orderItems.reduce(
        (acc: number, it: { quantity: number }) => acc + it.quantity,
        0
      );
      const totalPrice = order.orderItems.reduce(
        (acc: number, it) => acc + it.quantity * Number(it.product.price),
        0
      );
      return {
        orderId: generateServiceId(order.orderId, ServiceKey.order),
        status: getDictName<OrderStatus>(order.status, orderStatusDict),
        createdAt: dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        userId: generateServiceId(order.userId!, ServiceKey.client),
        merchantId: generateServiceId(order.merchantId!, ServiceKey.merchant),
        amount,
        totalPrice: Number(totalPrice).toFixed(2),
        ...(location ? { location } : {}),
        ...(distance !== undefined ? { distance, distanceKm: distance / 1000 } : {}),
        inRange,
        userName: order.user?.name ?? '',
      };
    });
  }

  /**
   * 商家创建订单
   */
  async createOrder(payload: CreateOrderPayload) {
    const { userId, merchantId, shippingFromId, shippingTo, items, description } = payload;

    const addressFrom = await addressModel.findById(shippingFromId);
    if (!addressFrom) {
      throw new Error('发货地址不存在');
    }
    if (addressFrom.merchantId !== merchantId) {
      throw new Error('没有权限使用该发货地址');
    }
    if (!items || items.length === 0) {
      throw new Error('订单项不能为空');
    }
    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        throw new Error(`商品不存在: ${item.productId}`);
      }
    }
    // 使用事务保证数据正确建立
    const result = await prisma.$transaction(async (tx) => {
      // 创建收货地址并存储
      const toData = await addressService.geocodeAndBuildCreateData({
        userId,
        name: shippingTo.name,
        phone: shippingTo.phone,
        address: shippingTo.address,
      });
      const to = await tx.addressInfo.create({ data: toData });

      const order = await tx.order.create({
        data: {
          userId,
          merchantId,
        },
      });

      const detail = await tx.orderDetail.create({
        data: {
          order: { connect: { orderId: order.orderId } },
          addressFrom: { connect: { addressInfoId: addressFrom.addressInfoId } },
          addressTo: { connect: { addressInfoId: to.addressInfoId } },
        },
      });

      await tx.timelineItem.create({
        data: {
          orderDetail: { connect: { orderId: detail.orderId } },
          description: description ?? '订单创建',
        },
      });

      await tx.orderItem.createMany({
        data: items.map((item) => ({
          orderId: order.orderId,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      return { orderId: generateServiceId(order.orderId, ServiceKey.order) };
    });

    return result;
  }

  /**
   * 商家更新订单状态
   */
  async updateOrderInfo(
    merchantId: number,
    orderId: number,
    updatePayload: UpdateOrderServicePayload
  ) {
    const order = await orderModel.findById(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.merchantId !== merchantId) {
      throw new Error('没有权限更新该订单');
    }
    // 更新订单事务
    await prisma.$transaction(async (tx) => {
      const changes: string[] = []; // 记录变更

      if (updatePayload.status) {
        // 更新订单状态
        await tx.order.update({ where: { orderId }, data: { status: updatePayload.status } });
        changes.push(`订单状态更新为: ${getDictName(updatePayload.status, orderStatusDict)}`);
      }

      if (updatePayload.shippingInfo) {
        // 更新收货地址信息
        const { addressInfoId, name, phone, address } = updatePayload.shippingInfo;
        const addressUpdate: Record<string, string> = {};
        // 将非空字段添加到更新对象
        Object.assign(addressUpdate, getDefinedKeyValues({ name, phone, address }));
        if (Object.keys(addressUpdate).length > 0) {
          await tx.addressInfo.update({ where: { addressInfoId }, data: addressUpdate });
          changes.push('收货地址更新');
        }
      }

      if (updatePayload.products && updatePayload.products.length > 0) {
        // 更新订单商品信息
        for (const product of updatePayload.products) {
          const { productId, amount, name, description, price } = product;
          if (amount !== undefined) {
            await tx.orderItem.upsert({
              where: { orderId_productId: { orderId, productId } },
              update: { quantity: amount },
              create: { orderId, productId, quantity: amount },
            });
          }

          const productUpdate: Record<string, unknown> = {};
          // 将非空字段添加到更新对象
          Object.assign(productUpdate, getDefinedKeyValues({ name, description, price }));
          if (Object.keys(productUpdate).length > 0) {
            await tx.product.update({ where: { productId }, data: productUpdate });
          }
        }
      }

      if (changes.length > 0) {
        await tx.timelineItem.create({
          data: {
            orderDetail: { connect: { orderId } },
            // 物流状态描述更新
            ...(changes.length > 0 ? { description: changes.join('; ') } : {}),
          },
        });
      }
    });

    return this.getOrderDetail(orderId);
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(orderId: number) {
    const order = await orderModel.findById(orderId, true);
    if (!order) {
      throw new Error('订单不存在');
    }

    const from = order.detail?.addressFrom;
    const to = order.detail?.addressTo;
    const timeline = order.detail?.timelineItems ?? [];
    const latest = timeline.length > 0 ? timeline[timeline.length - 1] : undefined;
    // 计算订单商品总数和总金额
    const amount = order.orderItems.reduce(
      (acc: number, it: { quantity: number }) => acc + it.quantity,
      0
    );
    const totalPrice = order.orderItems.reduce(
      (acc, it) => acc + it.quantity * Number(it.product.price),
      0
    );

    const statusVal = order.status;
    let extras: Partial<{
      currentLocation: [number, number];
      distance: number;
      estimatedTime: string;
      isTimeRisk: boolean;
    }> = {};
    if ((statusVal === 'PENDING' || statusVal === 'SHIPPED') && from && to) {
      if (statusVal === 'PENDING') {
        const currentLocation: [number, number] = [from.longitude, from.latitude];
        let distanceKm = 0;
        try {
          const route = await amapClient.directionDriving(
            [from.longitude, from.latitude],
            [to.longitude, to.latitude]
          );
          const points = parseAmapPolyline(route.polyline || '');
          if (points.length >= 2) {
            let total = 0;
            let prev = points[0]!;
            for (let i = 1; i < points.length; i++) {
              const curr = points[i]!;
              total += haversineDistanceMeters(prev, curr);
              prev = curr;
            }
            distanceKm = total / 1000;
          } else {
            distanceKm =
              haversineDistanceMeters(
                [from.longitude, from.latitude],
                [to.longitude, to.latitude]
              ) / 1000;
          }
        } catch {
          distanceKm =
            haversineDistanceMeters([from.longitude, from.latitude], [to.longitude, to.latitude]) /
            1000;
        }
        const speedKmh = 40;
        const etaMs = (distanceKm * 1000) / kmhToMps(speedKmh);
        extras = {
          currentLocation,
          distance: Number(distanceKm.toFixed(3)),
          estimatedTime: dayjs(Date.now() + etaMs).format('YYYY-MM-DD HH:mm:ss'),
          isTimeRisk: false,
        };
      } else if (statusVal === 'SHIPPED') {
        const live = logisticsService.getShipmentState(order.orderId);
        if (live) {
          const speedKmh = live.baseSpeedKmh;
          const remainingKm = live.remainingDistanceMeters / 1000;
          const etaMs = live.remainingDistanceMeters / kmhToMps(speedKmh);
          const elapsedSec = (Date.now() - live.startedAt) / 1000;
          const expectedTraveled = kmhToMps(speedKmh) * elapsedSec;
          const actualTraveled = live.totalDistanceMeters * live.progress;
          const isRisk = actualTraveled < expectedTraveled * 0.85;
          extras = {
            currentLocation: live.location,
            distance: Number(remainingKm.toFixed(3)),
            estimatedTime: dayjs(Date.now() + etaMs).format('YYYY-MM-DD HH:mm:ss'),
            isTimeRisk: isRisk,
          };
        }
      }
    }

    return {
      orderId: generateServiceId(order.orderId, ServiceKey.order),
      merchantId: generateServiceId(order.merchantId!, ServiceKey.merchant),
      merchantName: order.merchant?.name ?? '',
      userId: generateServiceId(order.userId!, ServiceKey.client),
      userName: order.user?.name ?? '',
      status: getDictName(order.status, orderStatusDict),
      createdAt: dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      shippingFrom: from
        ? {
            addressInfoId: generateServiceId(from.addressInfoId, ServiceKey.addressInfo),
            name: from.name,
            phone: from.phone,
            address: from.address,
            location: [from.longitude, from.latitude],
          }
        : undefined,
      shippingTo: to
        ? {
            addressInfoId: generateServiceId(to.addressInfoId, ServiceKey.addressInfo),
            name: to.name,
            phone: to.phone,
            address: to.address,
            location: [to.longitude, to.latitude],
          }
        : undefined,
      products: order.orderItems.map((orderItem) => ({
        productId: generateServiceId(orderItem.productId, ServiceKey.product),
        name: orderItem.product.name,
        price: Number(orderItem.product.price),
        amount: orderItem.quantity,
        description: orderItem.product.description ?? '',
      })),
      amount,
      totalPrice,
      shippingStatus: latest ? getDictName(latest.shippingStatus, shippingStatusDict) : undefined,
      timeline: timeline.map((timelineItem) => ({
        shippingStatus: getDictName(timelineItem.shippingStatus, shippingStatusDict),
        time: dayjs(timelineItem.time).format('YYYY-MM-DD HH:mm:ss'),
        description: timelineItem.description ?? '',
      })),
      ...(extras.currentLocation ? { currentLocation: extras.currentLocation } : {}),
      ...(extras.distance !== undefined ? { distance: extras.distance } : {}),
      ...(extras.estimatedTime ? { estimatedTime: extras.estimatedTime } : {}),
      ...(typeof extras.isTimeRisk === 'boolean' ? { isTimeRisk: extras.isTimeRisk } : {}),
    };
  }

  async sendShipment(merchantId: number, orderId: number, logisticsId: number) {
    const order = await orderModel.findById(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.merchantId !== merchantId) {
      throw new Error('没有权限操作该订单');
    }
    if (order.status === 'SHIPPED') {
      throw new Error('订单已处于运输中');
    }
    if (order.status === 'COMPLETED') {
      throw new Error('订单已完成，无法发货');
    }
    if (order.status === 'CANCELED') {
      throw new Error('订单已取消，无法发货');
    }
    // 检查物流供应商是否存在
    const logistics = await prisma.logisticsProvider.findUnique({
      where: { logisticsId },
      include: { merchants: true },
    });
    if (!logistics) {
      throw new Error('物流供应商不存在');
    }
    if (!logistics.merchants.some((merchant) => merchant.merchantId === merchantId)) {
      throw new Error('该物流供应商不为商家提供服务');
    }
    const detail = await orderModel.findById(orderId, true);
    const from = detail?.detail?.addressFrom;
    const to = detail?.detail?.addressTo;
    if (!from || !to) {
      throw new Error('订单缺少发货或收货地址');
    }
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { orderId }, data: { status: 'SHIPPED' } });
      await tx.timelineItem.create({
        data: {
          orderDetail: { connect: { orderId } },
          shippingStatus: 'SHIPPED',
          description: '订单发货',
        },
      });
    });
    // 开始模拟发货轨迹
    await logisticsService.simulateShipment(
      orderId,
      [from.longitude, from.latitude],
      [to.longitude, to.latitude],
      { speedKmh: logistics.speed }
    );
    return this.getOrderDetail(orderId);
  }

  /**
   * 客户端创建订单：根据收货地址与商品列表创建订单
   * - 校验所有商品属于同一商家
   * - 使用该商家的一个发货地址作为发货地
   * - 初始状态为 PENDING
   * - 返回满足前端契约的简化数据
   */
  async createOrderByClient(payload: {
    userId: number;
    shippingTo: { name: string; phone: string; address: string };
    products: Array<{ productId: number; merchantId: number }>;
  }) {
    const { userId, shippingTo, products } = payload;
    const merchantId = products[0]!.merchantId;

    // 校验所有商品存在且归属商家
    const productIds = products.map((p) => p.productId);
    const productRecords = await prisma.product.findMany({
      where: { productId: { in: productIds } },
    });
    if (productRecords.length !== productIds.length) {
      throw new Error('存在无效商品ID');
    }
    if (productRecords.some((prod) => prod.merchantId !== merchantId)) {
      throw new Error('商品归属与商家不一致');
    }
    const merchant = await prisma.merchant.findUnique({ where: { merchantId } });
    if (!merchant) throw new Error('商家不存在');
    // 选择商家一个发货地址
    const addressFrom = await prisma.addressInfo.findFirst({ where: { merchantId } });
    if (!addressFrom) throw new Error('商家未配置发货地址');

    const created = await prisma.$transaction(async (tx) => {
      // 创建收货地址（客户端收货地址）
      const toData = await addressService.geocodeAndBuildCreateData({
        userId,
        name: shippingTo.name,
        phone: shippingTo.phone,
        address: shippingTo.address,
      });
      const to = await tx.addressInfo.create({ data: toData });

      // 创建订单
      const order = await tx.order.create({ data: { userId, merchantId } });
      // 订单详情
      await tx.orderDetail.create({
        data: {
          order: { connect: { orderId: order.orderId } },
          addressFrom: { connect: { addressInfoId: addressFrom.addressInfoId } },
          addressTo: { connect: { addressInfoId: to.addressInfoId } },
        },
      });
      // 时间线（待商家确认）
      await tx.timelineItem.create({
        data: {
          orderId: order.orderId,
          description: '用户创建订单，待商家确认',
        },
      });
      // 订单项（默认数量 1）
      await tx.orderItem.createMany({
        data: productIds.map((pid) => ({ orderId: order.orderId, productId: pid, quantity: 1 })),
      });

      return order;
    });

    return {
      orderId: generateServiceId(created.orderId, ServiceKey.order),
      merchantId: generateServiceId(merchantId, ServiceKey.merchant),
      merchantName: merchant.name,
      userId: generateServiceId(userId, ServiceKey.client),
      status: '待确认',
      amount: 0,
      createdAt: dayjs(created.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      totalPrice: 0,
    };
  }

  /**
   * 客户端创建订单（支持多商家）：按 merchantId 分组分别创建订单
   * products: [{ productId, merchantId, amount }]
   */
  async createOrdersByClient(payload: {
    userId: number;
    shippingTo: { name: string; phone: string; address: string };
    products: Array<{ productId: number; merchantId: number; amount: number }>;
  }) {
    const { userId, shippingTo, products } = payload;
    // 按商家分组商品
    const byMerchant = new Map<number, Array<{ productId: number; amount: number }>>();
    for (const product of products) {
      const arr = byMerchant.get(product.merchantId) ?? [];
      arr.push({ productId: product.productId, amount: product.amount });
      byMerchant.set(product.merchantId, arr);
    }

    const results: Array<{
      orderId: string;
      merchantId: string;
      merchantName: string;
      userId: string;
      status: string;
      amount: number;
      createdAt: string;
      totalPrice: number;
    }> = [];

    await prisma.$transaction(async (tx) => {
      for (const [merchantId, items] of byMerchant.entries()) {
        const merchant = await tx.merchant.findUnique({ where: { merchantId } });
        if (!merchant) throw new Error('商家不存在');
        const addressFrom = await tx.addressInfo.findFirst({ where: { merchantId } });
        if (!addressFrom) throw new Error('商家未配置发货地址');

        // 校验商品存在且归属该商家
        const ids = items.map((productItem) => productItem.productId);
        const productRecords = await tx.product.findMany({ where: { productId: { in: ids } } });
        if (productRecords.length !== ids.length) throw new Error('存在无效商品ID');
        if (productRecords.some((prod) => prod.merchantId !== merchantId)) {
          throw new Error('商品归属与商家不一致');
        }

        // 创建收货地址
        const toData = await addressService.geocodeAndBuildCreateData({
          userId,
          name: shippingTo.name,
          phone: shippingTo.phone,
          address: shippingTo.address,
        });
        const to = await tx.addressInfo.create({ data: toData });

        // 创建订单与详情
        const order = await tx.order.create({ data: { userId, merchantId } });
        await tx.orderDetail.create({
          data: {
            order: { connect: { orderId: order.orderId } },
            addressFrom: { connect: { addressInfoId: addressFrom.addressInfoId } },
            addressTo: { connect: { addressInfoId: to.addressInfoId } },
          },
        });
        await tx.timelineItem.create({
          data: { orderId: order.orderId, description: '用户创建订单，待商家确认' },
        });

        // 创建订单项（按amount数量）
        await tx.orderItem.createMany({
          data: items.map((productItem) => ({
            orderId: order.orderId,
            productId: productItem.productId,
            quantity: productItem.amount,
          })),
        });

        // 计算订单总数与价格
        const amountTotal = items.reduce(
          (sumQuantity, productItem) => sumQuantity + productItem.amount,
          0
        );
        const priceMap = new Map(
          productRecords.map((record) => [record.productId, Number(record.price)])
        );
        const totalPrice = items.reduce(
          (sumPrice, productItem) =>
            sumPrice + productItem.amount * (priceMap.get(productItem.productId) || 0),
          0
        );

        results.push({
          orderId: generateServiceId(order.orderId, ServiceKey.order),
          merchantId: generateServiceId(merchantId, ServiceKey.merchant),
          merchantName: merchant.name,
          userId: generateServiceId(userId, ServiceKey.client),
          status: '待确认',
          amount: amountTotal,
          createdAt: dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          totalPrice,
        });
      }
    });

    return results;
  }
}

export const orderService = new OrderService();
