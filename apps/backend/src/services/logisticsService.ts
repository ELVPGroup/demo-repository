import type {
  GeoPoint,
  OrderStatus,
  SimulationConfig,
  SimulationState,
} from '@evlp/shared/types/index.js';
import { broadcastOrderShipping } from '@/ws/orderSubscriptions.js';
import prisma from '@/db.js';
import { generateRealtimeLocationFromState } from '@/utils/locationSimulatiom.js';

const PUSH_INTERVAL_MS = 2000;

export class LogisticsService {
  private serviceUrl = process.env['SIMULATION_SERVICE_URL'] || 'http://localhost:9001';
  private pollingTimers = new Map<number, NodeJS.Timeout>();

  /**
   * 模拟发货轨迹：向模拟轨迹服务发送请求，启动或继续模拟发货轨迹
   * @param orderId 订单ID
   * @param startPolling 是否启动轮询。默认false。只有当websocket连接建立后，才需要启动轮询
   * @param origin 起点坐标。如果为空，会先从模拟服务器请求当前状态
   * @param destination 终点坐标。如果为空，会先从模拟服务器请求当前状态
   * @param options 模拟配置选项
   * @returns 模拟状态。如果服务未运行或新启动，返回null
   */
  async simulateShipment(
    orderId: number,
    startPolling: boolean = false,
    origin?: GeoPoint,
    destination?: GeoPoint,
    options?: Partial<SimulationConfig>
  ) {
    if (!origin || !destination) {
      // 缺少起点或终点，先从模拟服务器请求当前状态
      const state = await this.getShipmentState(orderId);
      if (state && state.progress !== 1) {
        // 服务已经在运行中
        if (startPolling) {
          // 重新启动轮询，确保能够及时获取最新状态
          this.stopPolling(orderId);
          this.startPolling(orderId);
        }
        return state;
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

    if (startPolling) {
      this.startPolling(orderId);
    }
    return null;
  }

  startPolling(orderId: number) {
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

    // 广播轨迹更新
    broadcastOrderShipping(orderId, { ...generateRealtimeLocationFromState(state) });

    if (state.progress >= 0.99) {
      await this.handleShipingStatusChange(orderId, 'DELIVERED', 'DELIVERED', '订单送达');
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

  private async handleShipingStatusChange(
    orderId: number,
    newOrderStatus: OrderStatus,
    newShippingStatus: OrderStatus,
    description: string
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { orderId }, data: { status: newOrderStatus } });
      await tx.timelineItem.create({
        data: {
          orderDetail: { connect: { orderId } },
          shippingStatus: newShippingStatus,
          description,
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
      console.log('Get shipment state from simulation service:', orderId, data);
      return data;
    } catch (e) {
      console.error('Failed to get shipment state', e);
      return null;
    }
  }
}

export const logisticsService = new LogisticsService();
