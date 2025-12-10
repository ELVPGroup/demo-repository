import { Card, Statistic } from 'antd';

const KPISection = () => {
  return (
    <div className="grid grid-cols-4 gap-6">
      <Card title="今日订单量">
        <Statistic value={132} />
      </Card>

      <Card title="今日销售额">
        <Statistic prefix="¥" value={12430} />
      </Card>

      <Card title="待处理订单">
        <Statistic value={23} />
      </Card>

      <Card title="本月退单率">
        <Statistic value={2.3} suffix="%" />
      </Card>
    </div>
  );
};

export default KPISection;
