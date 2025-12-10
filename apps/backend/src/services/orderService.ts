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
import prisma from '../db.js';
import { addressModel } from '@/models/addressModel.js';
import { productModel } from '@/models/productModel.js';
import { addressService } from '@/services/addressService.js';
import { generateServiceId } from '@/utils/serverIdHandler.js';
import { ServiceKey } from '@/utils/serverIdHandler.js';
import { getDictName, orderStatusDict, shippingStatusDict } from '@evlp/shared/utils/dicts.js';
import {
  haversineDistanceMeters,
  parseAmapPolyline,
  kmhToMps,
} from '@evlp/shared/utils/general.js';
import { logisticsService } from '@/services/logisticsService.js';
import { amapClient } from '@evlp/shared/utils/amapClient.js';
import dayjs from 'dayjs';
import type { MapViewport } from '@/types/index.js';

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

    // 获取总数
    const total = await orderModel.count({ where });

    const orders = (await orderModel.findMany({
      where,
      ...(payload.offset !== undefined ? { skip: payload.offset } : {}),
      ...(payload.limit !== undefined ? { take: payload.limit } : {}),
      ...(payload.sort && payload.sortBy ? { orderBy: { [payload.sortBy]: payload.sort } } : {}),
      include: orderModelFindInclude,
    })) as OrderListPayload[];

    const data = orders.map((order) => {
      const amount = order.orderItems.reduce(
        (acc: number, it: { quantity: number }) => acc + it.quantity,
        0
      );
      return {
        orderId: generateServiceId(order.orderId, ServiceKey.order),
        status: getDictName<OrderStatus>(order.status, orderStatusDict),
        createdAt: dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        userId: generateServiceId(order.userId!, ServiceKey.client),
        merchantId: generateServiceId(order.merchantId!, ServiceKey.merchant),
        amount,
        totalPrice: Number(order.totalPrice),
        ...('merchantId' in payload && payload.merchantId !== undefined
          ? { userName: order.user?.name ?? '' }
          : {}),
        ...('userId' in payload && payload.userId !== undefined
          ? { merchantName: order.merchant?.name ?? '' }
          : {}),
      };
    });

    return { data, total };
  }

  /**
   * 获取配送区域订单列表
   */
  async getDeliveryAreaOrderList(
    payload: MerchantOrderListParams &
      Partial<MerchantOrderListFilterParams> & {
        mapViewport?: MapViewport;
      }
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

    if (payload.mapViewport) {
      const [p1, p2] = payload.mapViewport;
      // 无论p1、p2的顺序，都确保构建出矩形边界
      // 经度范围构建
      const minLng = Math.min(p1[0], p2[0]);
      const maxLng = Math.max(p1[0], p2[0]);
      // 纬度范围构建
      const minLat = Math.min(p1[1], p2[1]);
      const maxLat = Math.max(p1[1], p2[1]);

      if (minLng === maxLng || minLat === maxLat) {
        throw new Error('无效的地图视口：经度或纬度不能相同');
      }

      where['detail'] = {
        is: {
          addressTo: {
            is: {
              longitude: { gte: minLng, lte: maxLng },
              latitude: { gte: minLat, lte: maxLat },
            },
          },
        },
      };
    }

    let ordersRaw: AreaOrderListPayload[] = [];

    // 配送区域中心点与半径处理
    const centerLon = Number(deliveryArea.longitude);
    const centerLat = Number(deliveryArea.latitude);
    const radiusMeters = Number(deliveryArea.radius);

    ordersRaw = (await orderModel.findMany({
      where,
      ...(payload.offset !== undefined ? { skip: payload.offset } : {}),
      ...(payload.limit !== undefined ? { take: payload.limit } : {}),
      ...(payload.sort && payload.sortBy ? { orderBy: { [payload.sortBy]: payload.sort } } : {}),
      include: areaOrderModelFindInclude,
    })) as AreaOrderListPayload[];

    // 获取总数
    const total = await orderModel.count({ where });

    const data = ordersRaw.map((order) => {
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
      return {
        orderId: generateServiceId(order.orderId, ServiceKey.order),
        status: getDictName<OrderStatus>(order.status, orderStatusDict),
        createdAt: dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        userId: generateServiceId(order.userId!, ServiceKey.client),
        merchantId: generateServiceId(order.merchantId!, ServiceKey.merchant),
        amount,
        totalPrice: Number(order.totalPrice),
        ...(location ? { location } : {}),
        ...(distance !== undefined ? { distance, distanceKm: distance / 1000 } : {}),
        inRange,
        userName: order.user?.name ?? '',
      };
    });
    return { data, total };
  }

  /**
   * 商家创建订单
   */
  async createOrder(payload: CreateOrderPayload) {
    const { userId, merchantId, shippingFromId, shippingToId, items, description } = payload;

    const addressFrom = await addressModel.findById(shippingFromId);
    if (!addressFrom) {
      throw new Error('发货地址不存在');
    }
    if (addressFrom.merchantId !== merchantId) {
      throw new Error('没有权限使用该发货地址');
    }
    const addressTo = await addressModel.findById(shippingToId);
    if (!addressTo) {
      throw new Error('收货地址不存在');
    }
    if (addressTo.userId !== userId) {
      throw new Error('收货地址与用户不匹配');
    }
    if (!items || items.length === 0) {
      throw new Error('订单项不能为空');
    }
    let totalPrice = 0;
    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        throw new Error(`商品不存在: ${item.productId}`);
      }
      if (product.amount < item.quantity) {
        throw new Error(`商品库存不足: ${product.name}`);
      }
      totalPrice += Number(product.price) * item.quantity;
    }
    // 使用事务保证数据正确建立
    const result = await prisma.$transaction(async (tx) => {
      // 创建收货地址并存储
      const order = await tx.order.create({
        data: {
          userId,
          merchantId,
          totalPrice,
        },
      });

      const detail = await tx.orderDetail.create({
        data: {
          order: { connect: { orderId: order.orderId } },
          addressFrom: { connect: { addressInfoId: addressFrom.addressInfoId } },
          addressTo: { connect: { addressInfoId: addressTo.addressInfoId } },
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

      // 扣减库存
      for (const item of items) {
        const updateResult = await tx.product.updateMany({
          where: {
            productId: item.productId,
            amount: { gte: item.quantity },
          },
          data: {
            amount: { decrement: item.quantity },
          },
        });
        if (updateResult.count === 0) {
          throw new Error(`商品库存不足 (ID: ${item.productId})`);
        }
      }

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

      if (updatePayload.status && updatePayload.status !== order.status) {
        // 更新订单状态
        await tx.order.update({ where: { orderId }, data: { status: updatePayload.status } });
        changes.push(`订单状态更新为: ${getDictName(updatePayload.status, orderStatusDict)}`);
      }

      if (updatePayload.products && updatePayload.products.length > 0) {
        // 更新订单商品信息
        for (const product of updatePayload.products) {
          const { productId, quantity } = product;
          if (quantity !== undefined) {
            // 获取之前的订单项信息
            const oldOrderItem = await tx.orderItem.findUnique({
              where: { orderId_productId: { orderId, productId } },
              include: { product: true },
            });

            if (oldOrderItem) {
              const diff = quantity - oldOrderItem.quantity;
              if (diff !== 0) {
                // 如果数量增加了，需要减少库存；如果数量减少了，需要增加库存
                // 检查库存是否足够（仅当需要额外库存时）
                if (diff > 0) {
                  const currentProduct = await tx.product.findUnique({
                    where: { productId },
                  });
                  if (!currentProduct || currentProduct.amount < diff) {
                    throw new Error(`商品库存不足 (ID: ${productId})`);
                  }
                }

                // 更新库存
                await tx.product.update({
                  where: { productId },
                  data: { amount: { decrement: diff } },
                });

                // 更新订单项数量
                await tx.orderItem.update({
                  where: { orderId_productId: { orderId, productId } },
                  data: { quantity },
                });
                changes.push(
                  `商品【${oldOrderItem.product.name}】的数量由 ${oldOrderItem.quantity} 变更为 ${quantity}`
                );
              }
            } else {
              // 新增商品项（如果之前不存在）
              // 检查库存
              const currentProduct = await tx.product.findUnique({
                where: { productId },
              });
              if (!currentProduct || currentProduct.amount < quantity) {
                throw new Error(`商品库存不足 (ID: ${productId})`);
              }

              // 扣减库存
              await tx.product.update({
                where: { productId },
                data: { amount: { decrement: quantity } },
              });

              // 创建订单项
              await tx.orderItem.create({
                data: { orderId, productId, quantity },
              });
              changes.push(`新增商品【${currentProduct.name}】、数量 ${quantity}`);
            }
          }
        }

        // 重新计算订单总价
        const currentItems = await tx.orderItem.findMany({
          where: { orderId },
          include: { product: true },
        });
        const newTotalPrice = currentItems.reduce(
          (acc, item) => acc + item.quantity * Number(item.product.price),
          0
        );
        if (newTotalPrice !== Number(order.totalPrice)) {
          await tx.order.update({
            where: { orderId },
            data: { totalPrice: newTotalPrice },
          });
          changes.push(`订单总价变更为: ${Number(newTotalPrice).toFixed(2)}`);
        }
      }

      if (changes.length > 0) {
        await tx.timelineItem.create({
          data: {
            orderDetail: { connect: { orderId } },
            // 物流状态描述更新
            description: changes.join('; '),
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

    const statusVal = order.status;
    let extras: Partial<{
      currentLocation: [number, number];
      distance: number;
      estimatedTime: string;
      isTimeRisk: boolean;
    }> = {};
    if ((statusVal === 'PENDING' || statusVal === 'SHIPPED') && from && to) {
      // 状态为 PENDING （未发货）或 SHIPPED（已发货）时，计算当前位置、距离、预计到达时间并返回
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
          distance: Number(distanceKm),
          estimatedTime: dayjs(Date.now() + etaMs).format('YYYY-MM-DD HH:mm:ss'),
          isTimeRisk: false,
        };
      } else if (statusVal === 'SHIPPED') {
        // 已发货状态，丛模拟轨迹服务器（可替换为真实GPS调度服务地址）获取实时物流状态
        const live = await logisticsService.getShipmentState(order.orderId);
        if (live) {
          console.log('live State:', live);
          const speedKmh = live.baseSpeedKmh;
          const remainingKm = live.remainingDistanceMeters / 1000;
          const etaMs = (live.remainingDistanceMeters / kmhToMps(speedKmh)) * 1000;
          const elapsedSec = (Date.now() - live.startedAt) / 1000;
          const expectedTraveled = kmhToMps(speedKmh) * elapsedSec;
          const actualTraveled = live.totalDistanceMeters * live.progress;
          const isRisk = actualTraveled < expectedTraveled * 0.85;
          extras = {
            currentLocation: live.location,
            distance: Number(remainingKm),
            estimatedTime: dayjs(Date.now() + etaMs).format('YYYY-MM-DD HH:mm:ss'),
            isTimeRisk: isRisk,
          };
        }
      }
    }

    // 计算自动确认收货时间戳
    let timestampToAutoConfirm: number | undefined;
    if (statusVal === 'SHIPPED' || statusVal === 'DELIVERED') {
      // 查找发货时间
      const shippedItem = timeline.find((item) => item.shippingStatus === 'SHIPPED');
      if (shippedItem) {
        // 发货时间 + 10天
        timestampToAutoConfirm = dayjs(shippedItem.time).add(10, 'day').valueOf();
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
        quantity: orderItem.quantity,
        amount: orderItem.product.amount,
        description: orderItem.product.description ?? '',
        imageUrl: orderItem.product.imageUrl ?? '',
      })),
      amount,
      totalPrice: Number(order.totalPrice),
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
      ...(timestampToAutoConfirm ? { timestampToAutoConfirm } : {}),
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
    // 开始模拟发货轨迹（但不启动轮询。只有websocket连接才能启动）
    await logisticsService.simulateShipment(
      orderId,
      false,
      [from.longitude, from.latitude],
      [to.longitude, to.latitude],
      { speedKmh: logistics.speed }
    );
    return this.getOrderDetail(orderId);
  }

  /**
   * 客户端创建订单（支持多商家）：按 merchantId 分组分别创建订单
   * merchantGroups: [{ merchantId, items: [{ productId, quantity }] }]
   */
  async createOrdersByClient(payload: {
    userId: number;
    addressInfoId: number;
    merchantGroups: Array<{
      merchantId: number;
      items: Array<{ productId: number; quantity: number }>;
    }>;
  }) {
    console.log(payload);
    const { userId, addressInfoId, merchantGroups } = payload;

    const user = await prisma.user.findUnique({
      where: { userId },
    });
    if (!user) {
      throw new Error('用户不存在');
    }

    const addressInfo = await prisma.addressInfo.findUnique({
      where: { addressInfoId },
    });
    if (!addressInfo) {
      throw new Error('收货地址无效');
    }

    const createdOrderIds: string[] = [];
    const failedGroups: Array<{
      merchantId: number;
      items: Array<{ productId: number; quantity: number }>;
      reason: string;
    }> = [];

    for (const group of merchantGroups) {
      try {
        // 1. 获取商家的默认发货地址
        const defaultAddress = await addressService.getDefaultAddress({
          merchantId: group.merchantId,
        });

        if (!defaultAddress) {
          throw new Error(`商家未设置默认发货地址`);
        }

        // 2. 调用 createOrder 创建订单
        const result = await this.createOrder({
          userId,
          merchantId: group.merchantId,
          shippingFromId: defaultAddress.addressInfoId,
          shippingToId: addressInfoId,
          items: group.items,
          description: '客户下单',
        });

        createdOrderIds.push(result.orderId);
      } catch (error) {
        console.error(`Create order failed for merchant ${group.merchantId}:`, error);
        failedGroups.push({
          merchantId: group.merchantId,
          items: group.items,
          reason: error instanceof Error ? error.message : '创建订单失败',
        });
      }
    }

    return { createdOrderIds, failedGroups };
  }

  /**
   * 客户端确认收货
   */
  async confirmReceipt(userId: number, orderId: number) {
    const order = await orderModel.findById(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.userId !== userId) {
      throw new Error('没有权限操作该订单');
    }

    // 只有订单状态为SHIPPED（运输中）、DELIVERED（已送达）才可以确认收货
    if (order.status !== 'SHIPPED' && order.status !== 'DELIVERED') {
      throw new Error('当前订单状态不可确认收货');
    }

    // 更新状态为 COMPLETED 并添加时间轴
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { orderId },
        data: { status: 'COMPLETED' },
      });

      await tx.timelineItem.create({
        data: {
          orderDetail: { connect: { orderId } },
          shippingStatus: 'DELIVERED', // 确认收货即代表已签收
          description: '用户确认收货，订单已完成',
        },
      });
    });

    return this.getOrderDetail(orderId);
  }

  /**
   * 自动确认收货逻辑
   * 查找发货超过10天的订单并自动完成
   */
  async autoConfirmOrders() {
    const tenDaysAgo = dayjs().subtract(10, 'day').toDate();
    console.log(`[AutoConfirm] Checking orders shipped before ${tenDaysAgo.toISOString()}`);

    // 查找所有可能需要自动确认的订单
    // 条件：状态为 SHIPPED，且存在 shippingStatus=SHIPPED 的时间轴记录早于 10 天前
    const shippedTimelineItems = await prisma.timelineItem.findMany({
      where: {
        shippingStatus: 'SHIPPED',
        time: { lt: tenDaysAgo },
      },
      select: { orderDetail: { select: { orderId: true } } },
    });

    const candidateOrderIds = [
      ...new Set(shippedTimelineItems.map((item) => item.orderDetail.orderId)),
    ];

    if (candidateOrderIds.length === 0) {
      return 0;
    }

    // 在这些候选订单中，筛选出当前状态仍为 SHIPPED 的订单
    const ordersToConfirm = await prisma.order.findMany({
      where: {
        orderId: { in: candidateOrderIds },
        status: 'SHIPPED',
      },
      select: { orderId: true },
    });

    const targetOrderIds = ordersToConfirm.map((o) => o.orderId);
    console.log(`[AutoConfirm] Found ${targetOrderIds.length} orders to confirm:`, targetOrderIds);

    if (targetOrderIds.length === 0) {
      return 0;
    }

    // 批量更新状态
    let count = 0;
    // 使用事务逐个更新，确保每个订单都有对应的时间轴记录
    for (const orderId of targetOrderIds) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { orderId },
            data: { status: 'COMPLETED' },
          });

          await tx.timelineItem.create({
            data: {
              orderDetail: { connect: { orderId } },
              shippingStatus: 'DELIVERED', // 视为已送达/已完成
              description: '超时自动确认收货，订单已完成',
            },
          });
        });
        count++;
      } catch (error) {
        console.error(`[AutoConfirm] Failed to confirm order ${orderId}:`, error);
      }
    }

    return count;
  }
}

export const orderService = new OrderService();
