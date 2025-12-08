import { useEffect, useState } from 'react';
import { TopBar } from '@/components/merchantComponents/TopBar';
import { Card, Button, Space, Spin, Tag, List, message, Popconfirm } from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { merchantAxiosInstance } from '@/utils/axios';
import type { LogisticsProvider } from '@/types/logistics';
import { Helicopter, Motorbike, Truck } from 'lucide-react';

function LogisticsPage() {
  const [providers, setProviders] = useState<LogisticsProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);

  async function fetchProviders() {
    setLoading(true);
    try {
      const res = await merchantAxiosInstance.get('/logistics-provider/all');
      const data = (res.data?.data || []) as LogisticsProvider[];
      setProviders(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProviders();
  }, []);

  async function handleRegister(logisticsId: string) {
    setRegistering(logisticsId);
    try {
      await merchantAxiosInstance.post('/logistics-provider/register', { logisticsId });
      // 更新本地状态
      setProviders((prev) =>
        prev.map((p) => (p.logisticsId === logisticsId ? { ...p, isRegistered: true } : p))
      );
    } finally {
      setRegistering(null);
    }
  }

  async function handleUnRegister(logisticsId: string) {
    setRegistering(logisticsId);
    try {
      await merchantAxiosInstance.post('/logistics-provider/unregister', { logisticsId });
      // 更新本地状态
      setProviders((prev) =>
        prev.map((p) => (p.logisticsId === logisticsId ? { ...p, isRegistered: false } : p))
      );
    } finally {
      setRegistering(null);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-layout)' }}>
      <main className="ml-60 flex-1 px-10 py-6">
        <TopBar title="物流供应商管理" />
        <Space style={{ marginTop: 16, width: '100%', justifyContent: 'space-between' }}>
          <div />
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchProviders}>
              刷新
            </Button>
          </Space>
        </Space>
        <div style={{ marginTop: 16 }}>
          {loading ? (
            <div className="flex justify-center pt-10">
              <Spin size="large" />
            </div>
          ) : (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
              dataSource={providers}
              renderItem={(item) => (
                <List.Item>
                  <Card
                    variant="borderless"
                    actions={[
                      item.isRegistered ? (
                        <>
                          <Button type="text" disabled icon={<CheckCircleOutlined />}>
                            已注册
                          </Button>
                          <Popconfirm
                            title="确认取消合作吗？"
                            onConfirm={() => handleUnRegister(item.logisticsId)}
                            okText="取消合作"
                            cancelText="不取消"
                          >
                            <Button
                              type="link"
                              danger
                              icon={<MinusCircleOutlined />}
                              loading={registering === item.logisticsId}
                            >
                              取消合作
                            </Button>
                          </Popconfirm>
                        </>
                      ) : (
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          loading={registering === item.logisticsId}
                          onClick={() => handleRegister(item.logisticsId)}
                        >
                          注册
                        </Button>
                      ),
                    ]}
                  >
                    <Card.Meta
                      avatar={
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                          {item.speed < 30 ? (
                            <Motorbike size={24} />
                          ) : item.speed < 160 ? (
                            <Truck size={24} />
                          ) : (
                            <Helicopter size={24} />
                          )}
                        </div>
                      }
                      title={
                        <div className="flex items-center justify-between">
                          <span>{item.name}</span>
                          {item.isRegistered && <Tag color="success">合作供应商</Tag>}
                        </div>
                      }
                      description={
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-gray-500">
                            <span>配送速度:</span>
                            <span className="font-medium text-gray-700">{item.speed} km/h</span>
                          </div>
                          <div className="text-xs text-gray-400">ID: {item.logisticsId}</div>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default LogisticsPage;
