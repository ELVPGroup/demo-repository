import React from 'react';
import { Timeline, Typography, Card, Empty } from 'antd';
import type { OrderTimelineItem } from '@/types/orderDetailInterface';

const { Title } = Typography;

interface ShippingTimelineProps {
  timeline?: OrderTimelineItem[];
}

const ShippingTimeline: React.FC<ShippingTimelineProps> = ({ timeline = [] }) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const timeStr = date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      if (date.toDateString() === now.toDateString()) {
        return `${timeStr} 今天`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `${timeStr} 昨天`;
      } else {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}/${month}/${day} ${timeStr}`;
      }
    } catch {
      return dateStr;
    }
  };

  return (
    <Card
      variant="borderless"
      title={
        <Title level={4} style={{ margin: 0 }}>
          物流进度
        </Title>
      }
      style={{
        margin: '20px 0',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      {timeline.length === 0 ? (
        <Empty description="暂无物流信息" />
      ) : (
        <Timeline
          items={timeline.map((item, index) => ({
            color: index === 0 ? 'blue' : 'gray',
            children: (
              <>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{item.shippingStatus}</div>
                <div style={{ color: '#666', marginBottom: '4px' }}>{item.description}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>{formatDate(item.time)}</div>
              </>
            ),
          }))}
        />
      )}
    </Card>
  );
};

export default ShippingTimeline;
