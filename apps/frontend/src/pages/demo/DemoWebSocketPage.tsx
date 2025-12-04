import { MessageTypeEnum, useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useState } from 'react';
import { Card, Tag, List } from 'antd';

interface Message {
  type: MessageTypeEnum;
  data?: unknown;
}

function DemoWebSocketPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  // 连接 WebSocket 服务器，第一个参数为空字符串表示连接到 base_ws_url；
  // 第二个参数为消息处理函数，用于接收服务器传来消息，并作处理
  const { sendMessage, connected } = useWebSocket('', (msg) =>
    setMessages((prev) => [...prev, msg as Message])
  );

  const orderId = 'ORD-000001';
  useEffect(() => {
    if (!connected) {
      return;
    }
    // 订阅物流更新
    sendMessage(MessageTypeEnum.ShippingSubscribe, orderId);
    return () => {
      // 销毁时取消订阅物流更新
      sendMessage(MessageTypeEnum.ShippingUnsubscribe, orderId);
    };
  }, [sendMessage, connected]);

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="WebSocket 演示"
        extra={<Tag color={connected ? 'green' : 'red'}>{connected ? '已连接' : '未连接'}</Tag>}
      >
        <List
          bordered
          dataSource={messages}
          renderItem={(item, index) => (
            <List.Item key={index}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', width: '100%' }}>
                <Tag color="blue">{item.type}</Tag>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(item.data ?? item, null, 2)}
                </pre>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default DemoWebSocketPage;
