import { Card, Statistic } from 'antd';
import type { DashboardStats } from '../../types/dashboard';

interface KPISectionProps {
  stats?: DashboardStats;
}

const KPISection = ({ stats }: KPISectionProps) => {
  if (!stats) return null;

  return (
    <div className="mb-6 grid grid-cols-4 gap-6">
      <Card title="今日订单数" variant="borderless">
        <Statistic value={stats.todayOrderCount} />
        <div className="mt-2 text-sm text-gray-500">
          相比上一日：
          <span
            style={{
              color:
                stats.orderIncreaseCount > 0
                  ? '#cf1322'
                  : stats.orderIncreaseCount < 0
                    ? '#3f8600'
                    : 'inherit',
            }}
          >
            {stats.orderIncreaseCount > 0 ? '+' : ''}
            {stats.orderIncreaseCount}
          </span>
        </div>
      </Card>
      <Card title="今日销售额" variant="borderless">
        <Statistic prefix="¥" value={stats.todaySalesAmount} precision={2} />
        <div className="mt-2 text-sm text-gray-500">
          相比上一日：
          <span
            style={{
              color:
                stats.salesIncreaseAmount > 0
                  ? '#cf1322'
                  : stats.salesIncreaseAmount < 0
                    ? '#3f8600'
                    : 'inherit',
            }}
          >
            {stats.salesIncreaseAmount > 0 ? '+' : ''}
            {stats.salesIncreaseAmount}
          </span>
        </div>
      </Card>
      <Card title="待处理订单数" variant="borderless">
        <Statistic value={stats.toHandleOrderCount} />
      </Card>
      <Card title="异常订单数" variant="borderless">
        <Statistic value={stats.abnormalOrderCount} />
      </Card>
    </div>
  );
};

export default KPISection;
