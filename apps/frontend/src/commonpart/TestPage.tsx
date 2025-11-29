import React, { useState } from 'react';
import { Card, Button, Switch, Typography, Divider, Alert } from 'antd';
import RecipientInfo from '../RecipientInfo';
import ProductList from '../ProductList';
import ShippingTimeline from '../ShippingTimeline';

const { Title, Text } = Typography;

/**
 * 组件测试页面
 * 用于测试通用组件的功能、模拟数据和无数据处理方案
 */
const ComponentsTestPage: React.FC = () => {
  // 控制是否显示真实数据的开关状态
  const [useRealData, setUseRealData] = useState(false);
  // 由于系统权限限制，无法自动运行开发服务器

  // 模拟的真实数据
  const realRecipientData = {
    name: '李四',
    phone: '13987654321',
    address: '湖北省武汉市江汉区江汉路123号'
  };

  const realProductsData = [
    {
      productId: 'real_001',
      name: '智能手表',
      price: 1299.00,
      amount: 1
    },
    {
      productId: 'real_002',
      name: '运动耳机',
      price: 499.00,
      amount: 2
    }
  ];

  const realTimelineData = [
    {
      shippingStatus: '已送达',
      time: '2024-01-17 15:30:00',
      description: '您的包裹已成功签收，感谢您的购买'
    },
    {
      shippingStatus: '派送中',
      time: '2024-01-17 13:45:00',
      description: '快递员[李师傅 137****9876]正在派送，请保持电话畅通'
    }
  ];

  return (
    <div className="p-6">
      <Alert
        message="运行说明"
        description="由于系统权限限制，需要手动在浏览器中运行此测试页面：\n1. 在前端目录中安装依赖：npm install\n2. 启动开发服务器：npm run dev\n3. 在浏览器中访问 http://localhost:5173/ 并导航到包含此组件的路由"
        type="info"
        showIcon
        className="mb-6"
      />
      <Card title="通用组件测试页面" className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Title level={4}>数据切换测试</Title>
          <div className="flex items-center">
            <Text type="secondary" className="mr-2">使用真实数据</Text>
            <Switch
              checked={useRealData}
              onChange={setUseRealData}
              checkedChildren="是"
              unCheckedChildren="否"
            />
          </div>
        </div>
        <Text type="secondary">
          切换开关可以测试组件在有数据和无数据情况下的表现。
          当开关关闭时，组件将使用内部模拟数据。
        </Text>
      </Card>

      <Divider orientation="left">收件人信息组件测试</Divider>
      <RecipientInfo 
        addressInfo={useRealData ? realRecipientData : undefined} 
      />

      <Divider orientation="left">商品清单组件测试</Divider>
      <ProductList 
        products={useRealData ? realProductsData : undefined} 
      />

      <Divider orientation="left">物流时间线组件测试</Divider>
      <ShippingTimeline 
        timelineItems={useRealData ? realTimelineData : undefined} 
      />
    </div>
  );
};

export default ComponentsTestPage;