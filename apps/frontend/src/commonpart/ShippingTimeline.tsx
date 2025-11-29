import React, { useState, useEffect } from 'react';
import { Timeline, Typography, Spin, Empty } from 'antd';
const { Title } = Typography;

/**
 * 展示订单的物流进度
 */


function ShippingTimeline({ timeline: propTimeline }) {
  // 优先使用props中的数据，如果没有则初始化为空数组
  const [timeline, setTimeline] = useState(propTimeline || []);
  const [loading, setLoading] = useState(!propTimeline); // 只有当没有props数据时才显示加载状态

  // ShippingTimeline组件的BaseUrl
  const baseUrl = 'http://127.0.0.1:4523/m1/7446832-7180926-6608925';

  useEffect(() => {
    // 只有当没有通过props传入数据时，才从API获取数据
    if (!propTimeline) {
      const fetchShippingTimeline = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${baseUrl}/shipping-timeline`);
          if (!response.ok) {
            throw new Error('网络响应异常');
          }
          const data = await response.json();
          setTimeline(data);
        } catch (error) {
            console.error('获取物流状态失败:', error);
            // 发生错误时保持timeline为空数组
          } finally {
          setLoading(false);
        }
      };

      fetchShippingTimeline();
    }
  }, [propTimeline]);
  // 格式化时间显示
  // - 今天: "HH:MM 今天"
  // - 昨天: "HH:MM 昨天"
  // - 其他: "yyyy/MM/dd HH:MM"
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 格式化时间为HH:MM
    const timeStr = date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // 检查是否是今天或昨天
    if (date.toDateString() === now.toDateString()) {
      return `${timeStr} 今天`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `${timeStr} 昨天`;
    } else {
      // 非今天和非昨天，显示完整日期时间
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day} ${timeStr}`;
    }
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <Title level={4} style={{ marginBottom: '20px' }}>物流状态</Title>
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Spin>
            <div style={{ color: '#999', marginTop: '16px' }}>加载中...</div>
          </Spin>
        </div>
      ) : (
        <>
          {timeline && timeline.length > 0 ? (
            <Timeline
              items={timeline.map((item, index) => ({
                children: (
                  <div>
                    <div style={{ color: '#333333' }}>
                      {item.shippingStatus} <span style={{ color: '#666666' }}>{formatDate(item.time)}</span>
                    </div>
                    <div style={{ color: '#666666' }}>
                      {item.description}
                    </div>
                  </div>
                )
              }))}
            />
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Empty description="未找到物流状态信息" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ShippingTimeline;