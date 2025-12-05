import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Empty, message, Tag } from 'antd';
import {
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import type { OrderItem, OrderStatus } from '@/types/order';
import { orderStatusColors } from '@/theme/theme';
import type { ColumnsType } from 'antd/es/table';
import type { SortOrder } from 'antd/es/table/interface';
import type { TableProps } from 'antd';

const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();

  // 搜索相关状态
  const [search, setSearch] = useState('');

  // 排序相关状态
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalPrice'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Store
  const { orders, total, loading, setParams, fetchOrders } = useOrderStore();

  // 处理退出登录
  const handleLogout = () => {
    // 清除本地存储的认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    sessionStorage.clear();

    // 显示成功消息
    message.success('已成功退出登录');

    // 跳转到首页
    navigate('/');
  };

  // 状态映射
  const getStatusConfig = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { text: string; color: string; textColor: string }> = {
      待发货: {
        text: '待发货',
        color: orderStatusColors.pending.bg,
        textColor: orderStatusColors.pending.text,
      },
      运输中: {
        text: '运输中',
        color: orderStatusColors.confirmed.bg,
        textColor: orderStatusColors.confirmed.text,
      },
      已完成: {
        text: '已完成',
        color: orderStatusColors.delivered.bg,
        textColor: orderStatusColors.delivered.text,
      },
      已取消: {
        text: '已取消',
        color: orderStatusColors.default.bg,
        textColor: orderStatusColors.default.text,
      },
    };
    return (
      statusMap[status] || {
        text: status,
        color: orderStatusColors.default.bg,
        textColor: orderStatusColors.default.text,
      }
    );
  };

  // 数据获取 Effect
  useEffect(() => {
    setParams({
      customerName: search.trim() || undefined, // 使用 customerName 字段传递搜索关键词，保持与商家端接口一致
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      sort: sortOrder,
      sortBy: sortBy,
    });
    fetchOrders();
  }, [search, pageSize, currentPage, sortOrder, sortBy, setParams, fetchOrders]);

  // 处理搜索
  const handleSearch = (): void => {
    setCurrentPage(1);
    // useEffect 会自动触发 fetchOrders
  };

  // 处理重置/刷新
  const handleRefresh = (): void => {
    setSearch('');
    setCurrentPage(1);
    setSortBy('createdAt');
    setSortOrder('desc');
    // useEffect 会自动触发 fetchOrders
  };

  // 处理手动排序按钮点击
  const handleManualSort = (field: 'createdAt' | 'totalPrice') => {
    if (sortBy === field) {
      // 如果当前已经是按该字段排序，则切换顺序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 否则切换到该字段，默认降序
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // 表格列定义
  const createdSortOrder: SortOrder | undefined =
    sortBy === 'createdAt' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined;
  const priceSortOrder: SortOrder | undefined =
    sortBy === 'totalPrice' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined;

  const columns: ColumnsType<OrderItem> = [
    {
      title: '订单号',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      sortOrder: createdSortOrder,
    },
    {
      title: '金额',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
      sorter: true,
      sortOrder: priceSortOrder,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color} style={{ color: config.textColor, border: 'none' }}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: OrderItem) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/client/orders/${record.orderId}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  // 表格变化处理（分页、排序）
  const handleTableChange: TableProps<OrderItem>['onChange'] = (pagination, _filters, sorter) => {
    // 处理分页
    if (typeof pagination.current === 'number' && pagination.current !== currentPage) {
      setCurrentPage(pagination.current);
    }
    if (typeof pagination.pageSize === 'number' && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }

    // 处理排序
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    if (singleSorter && singleSorter.field) {
      setSortBy(singleSorter.field as 'createdAt' | 'totalPrice');
      setSortOrder(singleSorter.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 头部区域 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">我的订单</h1>
            <p className="text-gray-500">查看您的所有订单</p>
          </div>
          <Button
            danger
            icon={<LogOut size={16} />}
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            退出登录
          </Button>
        </div>

        {/* 控制栏 */}
        <Card bordered={false} className="shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Input
                placeholder="搜索订单号..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                className="w-64"
                allowClear
              />
              <Button type="primary" onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                重置
              </Button>
            </div>

            {/* 排序按钮组 */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500">排序：</span>
              <Button
                onClick={() => handleManualSort('createdAt')}
                type={sortBy === 'createdAt' ? 'primary' : 'default'}
                icon={
                  sortBy === 'createdAt' ? (
                    sortOrder === 'asc' ? (
                      <SortAscendingOutlined />
                    ) : (
                      <SortDescendingOutlined />
                    )
                  ) : undefined
                }
              >
                下单时间
              </Button>
              <Button
                onClick={() => handleManualSort('totalPrice')}
                type={sortBy === 'totalPrice' ? 'primary' : 'default'}
                icon={
                  sortBy === 'totalPrice' ? (
                    sortOrder === 'asc' ? (
                      <SortAscendingOutlined />
                    ) : (
                      <SortDescendingOutlined />
                    )
                  ) : undefined
                }
              >
                金额
              </Button>
            </div>
          </div>
        </Card>

        {/* 订单列表 */}
        <Card bordered={false} className="shadow-sm">
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="orderId"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条订单`,
            }}
            loading={loading}
            onChange={handleTableChange}
            locale={{
              emptyText: <Empty description="暂无订单数据" />,
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default MyOrdersPage;
