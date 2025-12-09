import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Empty, Tag, List } from 'antd';
import {
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  EyeOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { useOrderStore } from '@/store/useOrderStore';
import type { OrderItem, OrderStatus } from '@/types/order';
import { orderStatusColors } from '@/theme/theme';
import type { ColumnsType } from 'antd/es/table';
import type { SortOrder } from 'antd/es/table/interface';
import type { TableProps, PaginationProps } from 'antd';
import ClientTopBar from '@/components/clientComponents/ClientTopBar';

const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();

  // 搜索相关状态
  const [search, setSearch] = useState('');

  // 排序相关状态
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalPrice'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Store
  const { orders, total, loading, setParams, fetchOrders } = useOrderStore();

  // 状态映射
  const getStatusConfig = (status: OrderStatus) => {
    const statusMap: Record<
      OrderStatus | '已取消',
      { text: string; color: string; textColor: string }
    > = {
      待发货: {
        text: '待发货',
        color: orderStatusColors['待发货']?.bg || orderStatusColors.default.bg,
        textColor: orderStatusColors['待发货']?.text || orderStatusColors.default.text,
      },
      运输中: {
        text: '运输中',
        color: orderStatusColors['运输中']?.bg || orderStatusColors.default.bg,
        textColor: orderStatusColors['运输中']?.text || orderStatusColors.default.text,
      },
      已完成: {
        text: '已完成',
        color: orderStatusColors['已完成']?.bg || orderStatusColors.default.bg,
        textColor: orderStatusColors['已完成']?.text || orderStatusColors.default.text,
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
      orderId: search.trim() || undefined, // 使用 orderId 字段传递搜索关键词
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

  // 分页渲染
  const itemRender: PaginationProps['itemRender'] = (_, type, originalElement) => {
    if (type === 'prev') {
      return <a>上一页</a>;
    }
    if (type === 'next') {
      return <a>下一页</a>;
    }
    return originalElement;
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
      render: (amount: number) => `¥${Number(amount).toFixed(2)}`,
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

  // 移动端卡片渲染
  const renderMobileItem = (item: OrderItem) => {
    const config = getStatusConfig(item.status);
    return (
      <List.Item>
        <Card className="w-full shadow-sm hover:shadow-md transition-shadow" styles={{ body: { padding: '16px' } }}>
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="font-medium text-gray-900">订单号: {item.orderId}</span>
            <Tag color={config.color} style={{ color: config.textColor, border: 'none', marginRight: 0 }}>
              {config.text}
            </Tag>
          </div>

          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockCircleOutlined />
                <span>下单时间</span>
              </div>
              <span>{item.createdAt}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingOutlined />
                <span>商品数量</span>
              </div>
              <span>共 {item.amount} 件</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarOutlined />
                <span>订单金额</span>
              </div>
              <span className="text-base font-medium text-red-500">
                ¥{Number(item.totalPrice).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-end pt-2">
            <Button
              type="primary"
              ghost
              size="small"
              onClick={() => navigate(`/client/orders/${item.orderId}`)}
            >
              查看详情
            </Button>
          </div>
        </Card>
      </List.Item>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-20 sm:p-6 sm:pt-24">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* 头部区域 */}
        <div className="mx-auto">
          <ClientTopBar title="我的订单" subTitle="查看您的所有订单" />
        </div>

        {/* 控制栏 */}
        <Card bordered={false} className="shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Input
                placeholder="搜索订单号..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                className="w-full sm:w-64"
                allowClear
              />
              <div className="flex gap-2">
                <Button type="primary" onClick={handleSearch} className="flex-1 sm:flex-none">
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleRefresh} className="flex-1 sm:flex-none">
                  重置
                </Button>
              </div>
            </div>

            {/* 排序按钮组 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-500 text-sm">排序：</span>
              <Button
                size="small"
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
                size="small"
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

        {/* 订单列表 - 桌面端 Table */}
        <Card bordered={false} className="hidden shadow-sm md:block">
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
              itemRender: itemRender,
            }}
            loading={loading}
            onChange={handleTableChange}
            locale={{
              emptyText: <Empty description="暂无订单数据" />,
            }}
          />
        </Card>

        {/* 订单列表 - 移动端 List */}
        <div className="md:hidden">
          <List
            dataSource={orders}
            renderItem={renderMobileItem}
            loading={loading}
            locale={{
              emptyText: <Empty description="暂无订单数据" />,
            }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              showSizeChanger: false, // 移动端通常不显示每页条数切换
              itemRender: itemRender,
              align: 'center',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MyOrdersPage;
