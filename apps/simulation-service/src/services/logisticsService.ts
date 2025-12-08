import type { GeoPoint, SimulationState } from '@evlp/shared/types/index.js';
import {
  haversineDistanceMeters,
  getDefinedKeyValues,
  parseAmapPolyline,
  kmhToMps,
} from '@evlp/shared/utils/general.js';
import { amapClient } from '@evlp/shared/utils/amapClient.js';

interface SimulationConfig {
  speedKmh: number;
  tickMs: number;
  variance: number;
}

const SHIP_SIM_SPEED_KMH = 40;
const SHIP_GLOBAL_TICK_MS = 2000;
const SHIP_SIM_SPEED_VARIANCE = 0.1;

export class LogisticsService {
  /** 订单活跃模拟列表，用于停止/恢复模拟
   * key：订单ID
   * value：订单当前物流状态
   */
  private simulations = new Map<
    number,
    {
      startedAt: number;
      baseSpeedKmh: number;
      currentIndex: number;
      totalDistance: number;
      events: Array<{ point: GeoPoint; targetTime: number; progress: number }>;
    }
  >();
  /** 全局调度计时器（所有模拟共享） */
  private globalTimer: NodeJS.Timeout | null = null;
  private globalTickMs = Number(SHIP_GLOBAL_TICK_MS);

  /** 启动全局定时器 */
  private startTimer() {
    if (this.globalTimer) return;
    this.globalTimer = setInterval(() => this.schedule(), this.globalTickMs);
  }

  /** 当所有模拟结束时，停止全局定时器 */
  private stopTimerIfIdle() {
    if (this.simulations.size === 0 && this.globalTimer) {
      clearInterval(this.globalTimer);
      this.globalTimer = null;
    }
  }

  /**
   * 启动发货轨迹模拟
   * @param orderId 订单ID（数字）
   * @param origin 起点坐标 [lon, lat]
   * @param destination 终点坐标 [lon, lat]
   * @param options 可选配置：speedKmh, tickMs, variance
   */
  async simulateShipment(
    orderId: number,
    origin: GeoPoint,
    destination: GeoPoint,
    options?: Partial<SimulationConfig>
  ) {
    if (this.simulations.has(orderId)) {
      throw new Error('订单ID已存在模拟');
    }
    const cfg = Object.assign(
      {
        speedKmh: SHIP_SIM_SPEED_KMH,
        tickMs: SHIP_GLOBAL_TICK_MS,
        variance: SHIP_SIM_SPEED_VARIANCE,
      },
      getDefinedKeyValues(options ?? {})
    );

    const route = await amapClient.directionDriving(origin, destination);
    const points = parseAmapPolyline(route.polyline || '');

    if (points.length < 2) {
      throw new Error('路径点不足');
    }

    // 计算事件队列（包含进度和目标时间）
    const events: Array<{ point: GeoPoint; targetTime: number; progress: number }> = [];
    let traveled = 0; // 已行驶距离（米）
    let totalDistance = 0; // 总距离（米）
    let prev: GeoPoint | undefined = points[0]!; // 上一个坐标点
    for (let i = 1; i < points.length; i++) {
      const curr = points[i]!;
      totalDistance += haversineDistanceMeters(prev, curr);
      prev = curr;
    }
    prev = points[0]!;
    let cumulativeElapsedMs = 0;
    for (let i = 1; i < points.length; i++) {
      const a = prev;
      const b = points[i]!;
      const dist = haversineDistanceMeters(a, b);
      // 计算当前段的速度（考虑随机波动）
      const factor = 1 + (Math.random() * 2 - 1) * cfg.variance;
      const speedMps = kmhToMps(cfg.speedKmh * factor);
      const segSeconds = dist / speedMps;
      const ticks = Math.max(1, Math.ceil((segSeconds * 1000) / cfg.tickMs));
      for (let k = 1; k <= ticks; k++) {
        const f = k / ticks;
        const lon = a![0] + (b![0] - a![0]) * f;
        const lat = a![1] + (b![1] - a![1]) * f;
        const stepDist = dist / ticks;
        traveled += stepDist;
        const progress = Math.min(1, traveled / totalDistance);
        cumulativeElapsedMs += (segSeconds * 1000) / ticks;
        const targetTime = Date.now() + Math.round(cumulativeElapsedMs);
        events.push({ point: [lon, lat], targetTime, progress });
      }
      prev = b;
    }
    const startedAt = Date.now();
    this.simulations.set(orderId, {
      startedAt,
      baseSpeedKmh: cfg.speedKmh,
      currentIndex: 0,
      totalDistance,
      events,
    });
    this.startTimer();
  }

  /** 停止指定订单的模拟（如果是最后一个模拟，清理全局定时器） */
  stopSimulation(orderId: number) {
    const sim = this.simulations.get(orderId);
    if (!sim) return;
    this.simulations.delete(orderId);
    this.stopTimerIfIdle();
  }

  /** 全局调度：遍历所有模拟，按时推送事件 */
  private async schedule() {
    const now = Date.now();
    for (const [, state] of this.simulations.entries()) {
      while (state.currentIndex < state.events.length) {
        const event = state.events[state.currentIndex]!;
        if (event.targetTime > now) break;

        state.currentIndex++;
      }
    }
  }

  getShipmentState(orderId: number): SimulationState | null {
    const s = this.simulations.get(orderId);
    if (!s) return null;
    const now = Date.now();
    let idx = s.currentIndex;
    while (idx < s.events.length && s.events[idx]!.targetTime <= now) idx++;
    idx = Math.max(0, Math.min(idx - 1, s.events.length - 1));
    const e = s.events[idx]!;
    const progress = e.progress;
    const total = s.totalDistance;
    const remaining = Math.max(0, total * (1 - progress));
    const lastTarget = s.events.length > 0 ? s.events[s.events.length - 1]!.targetTime : now;
    return {
      location: e.point,
      progress,
      totalDistanceMeters: total,
      remainingDistanceMeters: remaining,
      startedAt: s.startedAt,
      baseSpeedKmh: s.baseSpeedKmh,
      plannedArrivalTime: lastTarget,
    };
  }
}

export const logisticsService = new LogisticsService();
