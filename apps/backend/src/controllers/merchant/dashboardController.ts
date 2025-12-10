import type { Context } from 'koa';
import db from '@/db.js';
import { extractRoleId } from '@/utils/roleHandler.js';
import dayjs from 'dayjs';

import { orderStatusDict } from '@evlp/shared/utils/dicts.js';
import type { OrderStatus } from '@/types/order.js';

export class MerchantDashboardController {
  /**
   * 获取商家仪表盘数据
   * 获取商家在当前日期范围内的订单数、销售额、待处理订单数、异常订单数等数据。
   */
  async getDashboardData(ctx: Context) {
    try {
      const { merchantId } = extractRoleId(ctx.state['user']) as { merchantId: number };

      const todayStart = dayjs().startOf('day').toDate();
      const todayEnd = dayjs().endOf('day').toDate();
      const yesterdayStart = dayjs().subtract(1, 'day').startOf('day').toDate();
      const yesterdayEnd = dayjs().subtract(1, 'day').endOf('day').toDate();
      const tenDaysAgo = dayjs().subtract(9, 'day').startOf('day').toDate(); // 包括今天在内的10天

      // 1. Basic Stats
      // Today's orders
      const todayOrders = await db.order.findMany({
        where: {
          merchantId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        select: {
          totalPrice: true,
        },
      });

      const todayOrderCount = todayOrders.length;
      const todaySalesAmount = todayOrders.reduce(
        (sum, order) => sum + Number(order.totalPrice),
        0
      );

      // Yesterday's orders
      const yesterdayOrders = await db.order.findMany({
        where: {
          merchantId,
          createdAt: {
            gte: yesterdayStart,
            lte: yesterdayEnd,
          },
        },
        select: {
          totalPrice: true,
        },
      });

      const yesterdayOrderCount = yesterdayOrders.length;
      const yesterdaySalesAmount = yesterdayOrders.reduce(
        (sum, order) => sum + Number(order.totalPrice),
        0
      );

      const orderIncreaseCount = todayOrderCount - yesterdayOrderCount;
      const salesIncreaseAmount = todaySalesAmount - yesterdaySalesAmount;

      // To Handle (Pending)
      const toHandleOrderCount = await db.order.count({
        where: {
          merchantId,
          status: 'PENDING',
        },
      });

      const abnormalOrderCount = await db.order.count({
        where: {
          merchantId,
          status: 'CANCELED',
        },
      });

      const last7DaysOrders = await db.order.findMany({
        where: {
          merchantId,
          createdAt: {
            gte: tenDaysAgo,
          },
        },
        select: {
          createdAt: true,
          totalPrice: true,
        },
      });

      const salesTrendMap = new Map<string, number>();
      // 初始化10天的销售额为0
      for (let i = 0; i < 10; i++) {
        const dateStr = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        salesTrendMap.set(dateStr, 0);
      }

      last7DaysOrders.forEach((order) => {
        const dateStr = dayjs(order.createdAt).format('YYYY-MM-DD');
        if (salesTrendMap.has(dateStr)) {
          salesTrendMap.set(dateStr, salesTrendMap.get(dateStr)! + Number(order.totalPrice));
        }
      });

      // 转换为图表数据格式，按日期排序
      const salesTrend = Array.from(salesTrendMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, amount]) => ({ date, amount }));

      // 配送时效（折线图）
      const deliveredOrders = await db.order.findMany({
        where: {
          merchantId,
          status: 'DELIVERED',
          detail: {
            timelineItems: {
              some: {
                shippingStatus: 'DELIVERED',
                time: {
                  gte: tenDaysAgo,
                },
              },
            },
          },
        },
        include: {
          detail: {
            include: {
              timelineItems: true,
            },
          },
        },
      });

      const deliveryEfficiencyMap = new Map<string, { totalTime: number; count: number }>();
      // 初始化10天的配送时效数据
      for (let i = 0; i < 10; i++) {
        const dateStr = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        deliveryEfficiencyMap.set(dateStr, { totalTime: 0, count: 0 });
      }

      deliveredOrders.forEach((order) => {
        if (!order.detail || !order.detail.timelineItems) return;

        const shippedItem = order.detail.timelineItems.find(
          (item) => item.shippingStatus === 'SHIPPED'
        );
        const deliveredItem = order.detail.timelineItems.find(
          (item) => item.shippingStatus === 'DELIVERED'
        );

        if (shippedItem && deliveredItem) {
          const deliveredDateStr = dayjs(deliveredItem.time).format('YYYY-MM-DD');
          if (deliveryEfficiencyMap.has(deliveredDateStr)) {
            const diffHours = dayjs(deliveredItem.time).diff(dayjs(shippedItem.time), 'hour', true);
            const entry = deliveryEfficiencyMap.get(deliveredDateStr)!;
            entry.totalTime += diffHours;
            entry.count += 1;
          }
        }
      });

      const deliveryEfficiency = Array.from(deliveryEfficiencyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => ({
          date,
          avgDeliveryTime: data.count > 0 ? Number((data.totalTime / data.count).toFixed(2)) : 0,
        }));

      // 订单状态分布（饼图数据）
      const orderStatusCounts = await db.order.groupBy({
        by: ['status'],
        where: {
          merchantId,
        },
        _count: {
          orderId: true,
        },
      });

      const orderStatusDistribution = orderStatusCounts.map((item) => ({
        name: orderStatusDict[item.status as OrderStatus] || item.status,
        value: item._count.orderId,
      }));

      ctx.status = 200;
      ctx.body = {
        _data: {
          stats: {
            todayOrderCount,
            todaySalesAmount,
            toHandleOrderCount,
            abnormalOrderCount,
            orderIncreaseCount,
            salesIncreaseAmount,
          },
          charts: {
            salesTrend,
            deliveryEfficiency,
            orderStatusDistribution,
          },
        },
        _message: '获取仪表板数据成功',
      };
    } catch (error) {
      console.error(error);
      ctx.status = 500;
      ctx.body = {
        _message: '获取仪表板数据失败',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const merchantDashboardController = new MerchantDashboardController();
