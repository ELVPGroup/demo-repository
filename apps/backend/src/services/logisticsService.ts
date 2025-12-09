import type { GeoPoint, SimulationConfig, SimulationState } from '@evlp/shared/types/index.js';
import { broadcastOrderShipping } from '@/ws/orderSubscriptions.js';
import prisma from '@/db.js';
import { getDictName, shippingStatusDict } from '@evlp/shared/utils/dicts.js';
import dayjs from 'dayjs';

const PUSH_INTERVAL_MS = 5000;

export class LogisticsService {
  private serviceUrl = process.env['SIMULATION_SERVICE_URL'] || 'http://localhost:9001';
  private pollingTimers = new Map<number, NodeJS.Timeout>();

  async simulateShipment(
    orderId: number,
    origin?: GeoPoint,
    destination?: GeoPoint,
    options?: Partial<SimulationConfig>
  ) {
    if (!origin || !destination) {
      // 缺少起点或终点，代表不是新启动的模拟，先从模拟服务器请求当前状态
      const state = await this.getShipmentState(orderId);
      if (state && state.progress !== 1) {
        // 服务已经在运行中。再次调用可能是因为后端服务中断又重启，导致内存中的pollingTimers丢失对订单的跟踪
        // 重新启动轮询，确保能够及时获取最新状态
        this.stopPolling(orderId);
        this.startPolling(orderId);
        return;
      } else {
        // 当前不存在已启动的服务。而缺少起点或终点，就无法启动新的模拟轨迹服务
        throw new Error('缺少起点或终点，无法启动新的模拟轨迹服务');
      }
    }

    // 调用模拟服务启动模拟
    const response = await fetch(`${this.serviceUrl}/simulations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        origin,
        destination,
        options,
      }),
    });

    if (!response.ok) {
      throw new Error(`Simulation service error: ${response.statusText}`);
    }

    this.startPolling(orderId);
  }

  private startPolling(orderId: number) {
    if (this.pollingTimers.has(orderId)) return;

    const timer = setInterval(() => this.pollShipment(orderId), PUSH_INTERVAL_MS);
    this.pollingTimers.set(orderId, timer);
  }

  private async pollShipment(orderId: number) {
    const state = await this.getShipmentState(orderId);

    if (!state) {
      // 如果模拟服务返回空状态，认为模拟已结束
      this.stopPolling(orderId);
      return;
    }

    const now = Date.now();
    const shippingStatus =
      state.progress <= 0 ? 'PACKING' : state.progress < 1 ? 'SHIPPED' : 'DELIVERED';

    // 广播轨迹更新
    broadcastOrderShipping(orderId, {
      location: state.location,
      timestamp: dayjs(now).format('YYYY-MM-DD HH:mm:ss'),
      shippingStatus: getDictName(
        shippingStatus as keyof typeof shippingStatusDict,
        shippingStatusDict
      ),
      progress: state.progress,
    });

    if (state.progress >= 1) {
      await this.handleDelivered(orderId);
      this.stopPolling(orderId);
      // 停止模拟
      this.stopSimulation(orderId);
    }
  }

  stopPolling(orderId: number) {
    const timer = this.pollingTimers.get(orderId);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(orderId);
    }
  }

  private async handleDelivered(orderId: number) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { orderId }, data: { status: 'COMPLETED' } });
      await tx.timelineItem.create({
        data: {
          orderDetail: { connect: { orderId } },
          shippingStatus: 'DELIVERED',
          description: '订单送达',
        },
      });
    });
  }

  stopSimulation(orderId: number) {
    this.stopPolling(orderId);
    fetch(`${this.serviceUrl}/simulations/${orderId}`, {
      method: 'DELETE',
    }).catch((err) => console.error('Failed to stop simulation', err));
  }

  async getShipmentState(orderId: number) {
    try {
      const response = await fetch(`${this.serviceUrl}/simulations/${orderId}`);
      if (response.status === 404) return null;
      if (!response.ok) return null;
      const data = (await response.json()) as SimulationState;
      console.log('Shipment state:', data);
      return data;
    } catch (e) {
      console.error('Failed to get shipment state', e);
      return null;
    }
  }
}

export const logisticsService = new LogisticsService();
