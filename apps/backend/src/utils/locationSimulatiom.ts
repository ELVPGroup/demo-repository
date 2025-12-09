import type { GeoPoint } from '@/types/index.js';
import type { ShippingStatus, SimulationState } from '@evlp/shared/types/index.js';
import { getDictName, shippingStatusDict } from '@evlp/shared/utils/dicts.js';
import dayjs from 'dayjs';

export interface RealtimeLocation {
  location: GeoPoint;
  timestamp: string;
  shippingStatus: string;
  progress: number;
}

/**
 * 从模拟状态生成实时位置信息
 * @param state 模拟状态
 * @returns 实时位置信息
 */
export function generateRealtimeLocationFromState(state: SimulationState): RealtimeLocation {
  const shippingStatus: ShippingStatus =
    state.progress <= 0 ? 'PACKING' : state.progress < 1 ? 'SHIPPED' : 'DELIVERED';
  return {
    location: state.location,
    timestamp: dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
    shippingStatus: getDictName(
      shippingStatus as keyof typeof shippingStatusDict,
      shippingStatusDict
    ),
    progress: state.progress,
  };
}
