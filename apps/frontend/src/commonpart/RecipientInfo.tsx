import React from 'react';
import { Card, Typography, Descriptions, Empty } from 'antd';
import { UserOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { AddressInfo } from '@/types/orderDetailInterface';

const { Title } = Typography;

interface RecipientInfoProps {
  addressInfo?: AddressInfo;
}

const RecipientInfo: React.FC<RecipientInfoProps> = ({ addressInfo }) => {
  // 检查 addressInfo 是否存在，或者关键字段是否全为空
  const isEmpty = !addressInfo || (!addressInfo.name && !addressInfo.phone && !addressInfo.address);

  if (isEmpty) {
    return (
      <Card
        title={<Title level={4} style={{ margin: 0 }}>收货人信息</Title>}
        style={{ margin: '20px 0', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
      >
        <Empty description="暂无收货人信息" />
      </Card>
    );
  }

  // 此时 addressInfo 肯定存在
  const info = addressInfo!;

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>收货人信息</Title>}
      style={{
        margin: '20px 0',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <Descriptions column={1} labelStyle={{ width: '100px', fontWeight: 'bold' }}>
        <Descriptions.Item label={<span><UserOutlined /> 收货人</span>}>
          {info.name || '未提供'}
        </Descriptions.Item>
        <Descriptions.Item label={<span><PhoneOutlined /> 电话</span>}>
          {info.phone || '未提供'}
        </Descriptions.Item>
        <Descriptions.Item label={<span><EnvironmentOutlined /> 地址</span>}>
          {info.address || '未提供'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default RecipientInfo;