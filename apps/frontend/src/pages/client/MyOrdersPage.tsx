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
  const [searchText, setSearchText] = useState(''); // 输入框显示的值
  const [searchQuery, setSearchQuery] = useState(''); // 实际触发搜索的值

  // 排序相关状态
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalPrice'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Store
  const { orders, loading, setParams, fetchOrders } = useOrderStore();

  // 本地状态覆盖：从 localStorage 读取已签收覆盖
  const [statusOverrides, setStatusOverrides] = useState<Record<string, { status: string; confirmedAt: number }>>(() => {
    try {
      return JSON.parse(localStorage.getItem('clientOrderStatusOverrides') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'clientOrderStatusOverrides') {
        try {
          setStatusOverrides(JSON.parse(e.newValue || '{}'));
        } catch {
          // Ignore JSON parse error
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 状态映射（含已签收）
  const getStatusConfig = (status: OrderStatus | '已签收') => {
    const statusMap: Record<
      OrderStatus | '已取消' | '已签收',
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
      已送达: {
        text: '已送达',
        color: orderStatusColors['已完成']?.bg || orderStatusColors.default.bg,
        textColor: orderStatusColors['已完成']?.text || orderStatusColors.default.text,
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
      已签收: {
        text: '已签收',
        color: orderStatusColors['已完成']?.bg || orderStatusColors.default.bg,
        textColor: orderStatusColors['已完成']?.text || orderStatusColors.default.text,
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
    // 获取全部数据，不传分页参数
    setParams({
      limit: undefined,
      offset: undefined,
      sort: undefined,
      sortBy: undefined,
    });
    fetchOrders();
  }, [setParams, fetchOrders]);

  // 前端处理数据：过滤 -> 排序
  const processedData = React.useMemo(() => {
    let data = [...orders];

    // 1. 过滤
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter((item) => {
        const orderId = item.orderId.toLowerCase();
        
        // 场景 1: 完整匹配或部分匹配 (忽略大小写)
        // 涵盖: 输入 "ORD-000030" -> 匹配 "ORD-000030"
        // 涵盖: 输入 "ord-30" -> 匹配 "ORD-000030" (如果不严格匹配前缀)
        if (orderId.includes(q)) return true;

        // 场景 2: 纯数字输入匹配 (如 "30" 或 "000030")
        // 我们尝试从订单号中提取数字部分进行对比
        // 假设订单号格式为 "PREFIX-NUMBER" 或类似结构
        const numericPart = orderId.replace(/\D/g, ''); // 提取 "000030"
        const queryNumeric = q.replace(/\D/g, ''); // 提取查询中的数字 "30"

        if (queryNumeric) {
            // 如果提取出的数字部分匹配
            // 比如订单数字是 000030 (30)，查询是 30
            // 我们将两者都转为数字进行比较，或者检查字符串包含
            // 这里为了支持 "000030" 匹配 "30"，我们检查数字值是否相等
            // 或者检查字符串结尾是否匹配 (通常用户输后几位)
            
            // 策略 A: 转换为数字比较 (最精准，"000030" == "30")
            const orderNum = parseInt(numericPart, 10);
            const queryNum = parseInt(queryNumeric, 10);
            if (!isNaN(orderNum) && !isNaN(queryNum) && orderNum === queryNum) {
                return true;
            }
        }
        
        // 场景 3: 混合格式模糊匹配 (如 "ORD-30")
        // 如果用户输入了前缀，但数字部分省略了0
        // 我们可以尝试将用户输入的数字部分进行补零匹配，或者将订单号去零匹配
        // 简单做法：如果用户输入包含非数字字符，且数字部分匹配
        if (q.includes('-')) {
             const [qPrefix, qNum] = q.split('-');
             const [oPrefix, oNum] = orderId.split('-');
             
             if (qPrefix && oPrefix && qNum && oNum) {
                 // 前缀包含匹配
                 if (oPrefix.includes(qPrefix)) {
                     // 数字部分转数字匹配
                     if (parseInt(qNum, 10) === parseInt(oNum, 10)) {
                         return true;
                     }
                 }
             }
        }

        return false;
      });
    }

    // 2. 排序
    if (sortBy) {
      data.sort((a, b) => {
        let aValue: string | number = a[sortBy];
        let bValue: string | number = b[sortBy];

        // 特殊处理金额
        if (sortBy === 'totalPrice') {
            aValue = Number(aValue);
            bValue = Number(bValue);
        }
        
        // 特殊处理日期
        if (sortBy === 'createdAt') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        }

        if (aValue === bValue) return 0;
        
        const result = aValue > bValue ? 1 : -1;
        return sortOrder === 'asc' ? result : -result;
      });
    }

    return data;
  }, [orders, searchQuery, sortBy, sortOrder]);

  // 处理搜索
  const handleSearch = (): void => {
    setSearchQuery(searchText); // 仅在点击搜索或回车时更新 searchQuery
    setCurrentPage(1);
  };

  // 处理重置/刷新
  const handleRefresh = (): void => {
    setSearchText('');
    setSearchQuery('');
    setCurrentPage(1);
    setSortBy('createdAt');
    setSortOrder('desc');
    fetchOrders();
  };

  // 处理手动排序按钮点击
  const handleManualSort = (field: 'createdAt' | 'totalPrice') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
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

  // Ant Design ConfigProvider 需要在根组件配置才能完全生效
  // 但对于 showQuickJumper 的文字，可以通过 locale 覆盖
  const paginationLocale = {
    jump_to: '前往',
    jump_to_confirm: '确定',
    page: '页',
    items_per_page: '条/页',
    prev_page: '上一页',
    next_page: '下一页',
    prev_5: '向前 5 页',
    next_5: '向后 5 页',
    prev_3: '向前 3 页',
    next_3: '向后 3 页',
    page_size: '页码',
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
      render: (_: OrderStatus, record: OrderItem) => {
        const displayStatus = statusOverrides[record.orderId]?.status || record.status;
        const config = getStatusConfig(displayStatus as OrderStatus | '已签收');
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
    if (typeof pagination.current === 'number') {
      setCurrentPage(pagination.current);
    }
    if (typeof pagination.pageSize === 'number') {
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
    const displayStatus = statusOverrides[item.orderId]?.status || item.status;
    const config = getStatusConfig(displayStatus as OrderStatus | '已签收');
    return (
      <List.Item className="border-b-0">
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
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
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

        {/* 间隔 */}
        <div className="hidden md:block h-6"></div>

        {/* 订单列表 - 桌面端 Table */}
        <Card bordered={false} className="hidden shadow-sm md:block">
          <Table
            columns={columns}
            dataSource={processedData}
            rowKey="orderId"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: processedData.length,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条订单`,
              itemRender: itemRender,
              locale: paginationLocale,
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
            dataSource={processedData}
            renderItem={renderMobileItem}
            loading={loading}
            locale={{
              emptyText: <Empty description="暂无订单数据" />,
            }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: processedData.length,
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
