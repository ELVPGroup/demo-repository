import { MessageTypeEnum, useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useState } from 'react';
import { Card, Tag, List } from 'antd';
import { useParams } from 'react-router';

interface Message {
  type: MessageTypeEnum;
  data?: unknown;
}

function DemoWebSocketPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  // 连接 WebSocket 服务器，第一个参数为空字符串表示连接到 base_ws_url；
  // 第二个参数为消息处理函数，用于接收服务器传来消息，并作处理
  const { sendMessage, connected } = useWebSocket('', (msg) => {
    // 添加 console.log 来记录新消息
    console.log('收到新的 WebSocket 消息:', msg);
    
    setMessages((prev) => {
      const newMessages = [...prev, msg as Message];
      // 也可以在这里添加 console.log，显示更新后的消息数量
      console.log(`消息数量更新: ${prev.length} -> ${newMessages.length}`);
      return newMessages;
    });
  });

  const orderId = useParams().orderId;
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
  }, [sendMessage, connected, orderId]);

  // 可选：在组件渲染时显示当前消息数量
  useEffect(() => {
    console.log(`当前共 ${messages.length} 条消息`);
  }, [messages]);

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`WebSocket 演示 - 订单 ${orderId}`}
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