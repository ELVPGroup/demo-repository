import type { OrderStatus } from '@/types/order.js';

// 订单状态字典
export const orderStatusDict: Record<OrderStatus, string> = {
  PENDING: '待发货',
  SHIPPED: '运输中',
  COMPLETED: '已完成',
  CANCELED: '已取消',
};

// 通用获取状态名称函数
export function getDictName<T extends string | number | symbol>(
  dictKey: T,
  dict: Record<T, string>
): string {
  return dict[dictKey];
}

// 通用获取状态键函数
export function getDictKey<T extends string | number | symbol>(
  dictName: string,
  dict: Record<T, string>
) {
  return (Object.keys(dict) as T[]).find((key) => dict[key] === dictName);
}
