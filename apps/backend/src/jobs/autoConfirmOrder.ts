
import { orderService } from '@/services/orderService.js';

/**
 * 自动确认收货任务
 * 定期检查发货超时的订单并自动完成
 */
export const startAutoConfirmJob = () => {
  const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 每1小时检查一次

  console.log('[Cron] 自动确认收货任务已启动');

  // 立即执行一次
  runTask();

  // 启动定时器
  setInterval(runTask, CHECK_INTERVAL_MS);
};

const runTask = async () => {
  try {
    const count = await orderService.autoConfirmOrders();
    if (count > 0) {
      console.log(`[Cron] 自动确认收货了 ${count} 个订单`);
    }
  } catch (error) {
    console.error('[Cron] 自动确认收货任务失败:', error);
  }
};
