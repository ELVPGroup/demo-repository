import React, { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Spin, Empty } from 'antd';
import { UserOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Title } = Typography;



function RecipientInfo({ addressInfo: propAddressInfo }) {
  // 优先使用props中的数据，如果没有则初始化为null
  const [addressInfo, setAddressInfo] = useState(propAddressInfo);
  const [loading, setLoading] = useState(!propAddressInfo); // 只有当没有props数据时才显示加载状态

  // RecipientInfo组件的BaseUrl
  const baseUrl = 'http://127.0.0.1:4523/m1/7446832-7180926-6608950';

  useEffect(() => {
    // 只有当没有通过props传入数据时，才从API获取数据
    if (!propAddressInfo) {
      const fetchRecipientInfo = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${baseUrl}/recipient-info`);
          if (!response.ok) {
            throw new Error('网络响应异常');
          }
          const data = await response.json();
          setAddressInfo(data);
        } catch (error) {
          console.error('获取收货人信息失败:', error);
          // 不再使用默认数据，发生错误时保持addressInfo为null
        } finally {
          setLoading(false);
        }
      };

      fetchRecipientInfo();
    }
  }, [propAddressInfo]);
  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>收货人信息</Title>
      }
      style={{
        margin: '20px 0',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Spin>
            <div style={{ color: '#999', marginTop: '16px' }}>加载中...</div>
          </Spin>
        </div>
      ) : (
        <>
          {addressInfo && addressInfo.name && addressInfo.address && addressInfo.phone ? (
            <Descriptions
              column={1}
              bordered
              size="middle"
              items={[
                {
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                      <span>姓名</span>
                    </div>
                  ),
                  children: addressInfo.name,
                  style: {
                    '& > td': {
                      padding: '12px 16px',
                    },
                  },
                },
                {
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <EnvironmentOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                      <span>地址</span>
                    </div>
                  ),
                  children: addressInfo.address,
                  style: {
                    '& > td': {
                      padding: '12px 16px',
                    },
                  },
                },
                {
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                      <span>电话</span>
                    </div>
                  ),
                  children: addressInfo.phone,
                  style: {
                    '& > td': {
                      padding: '12px 16px',
                    },
                  },
                },
              ]}
            />
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Empty description="未找到收货人信息" />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default RecipientInfo;