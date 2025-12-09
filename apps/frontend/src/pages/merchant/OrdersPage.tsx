import React, { useState, useEffect, useMemo } from 'react';
import { Pagination, Segmented, Spin, Space } from 'antd';
import { TopBar } from '@/components/merchantComponents/TopBar';
import { SearchBar } from '@/components/merchantComponents/SearchBar';
import { StatusFilter } from '@/components/merchantComponents/StatusFilter';
import CardGrid from '@/components/merchantComponents/CardGrid';
import OrderList from '@/components/merchantComponents/OrderList';
import { useOrderStore } from '@/store/useOrderStore';
import { useDebounce } from '@/hooks/useDebounce';

const ITEMS_PER_PAGE = 9;

// 将中文状态映射到后端期望的英文状态
const mapStatusToApi = (status: '全部' | '待发货' | '运输中' | '已完成'): string | undefined => {
  if (status === '全部') {
    return undefined;
  }
  const statusMap: Record<'待发货' | '运输中' | '已完成', string> = {
    '待发货': 'PENDING',
    '运输中': 'SHIPPED',
    '已完成': 'COMPLETED',
  };
  return statusMap[status];
};

const OrdersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'全部' | '待发货' | '运输中' | '已完成'>('全部');
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount' | 'id'>('createdAt');
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const { orders, total, loading, setParams, fetchOrders } = useOrderStore();

  // 使用防抖处理搜索输入，延迟 500ms
  const debouncedSearch = useDebounce(search, 500);

  // 当过滤条件、页码或防抖后的搜索值改变时，更新 store 参数并重新获取数据
  useEffect(() => {
    setParams({
      status: mapStatusToApi(status), // 使用映射函数转换状态：待发货 -> PENDING, 运输中 -> SHIPPED, 已完成 -> COMPLETED
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
      sort: sort,
      sortBy: sortBy, 
      customerName: debouncedSearch.trim() || undefined, // 使用防抖后的搜索值，按客户姓名搜索
    });
    fetchOrders();
  }, [status, sortBy, sort, currentPage, debouncedSearch, setParams, fetchOrders]);

  // 分页改变处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 搜索处理：重置到第一页
  const handleSearch = () => {
    setCurrentPage(1);
  };

  const segmentedOptions = useMemo(
    () => [
      { label: '卡片', value: 'card' },
      { label: '列表', value: 'list' },
    ],
    []
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-layout)' }}>
      <main className="ml-60 flex-1 px-10 py-6">
        <TopBar title="订单管理" />

        <SearchBar value={search} onChange={(value) => setSearch(value)} onSearch={handleSearch} />

        <Space style={{ marginTop: 16, width: '100%', justifyContent: 'space-between' }}>
          <Segmented
            options={segmentedOptions}
            value={viewMode}
            onChange={(v) => setViewMode(v as 'card' | 'list')}
          />
          <StatusFilter
            status={status}
            setStatus={setStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sort={sort}
            setSort={setSort}
          />
        </Space>


        {/* Orders Display */}
        {loading && orders.length === 0 ? (
          <div className="mt-6 flex h-100 items-center justify-center">
            <Spin size="large" />
          </div>
        ) : orders.length === 0 ? (
          <div
            className="mt-6 flex h-100 items-center justify-center text-center"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {search.trim() ? '未找到匹配的订单' : '暂无订单数据'}
          </div>
        ) : (
          viewMode === 'card' ? <CardGrid /> : <OrderList />
        )}

        {/* 分页组件 */}
        {!loading && orders.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              current={currentPage}
              total={total}
              pageSize={ITEMS_PER_PAGE}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
              onChange={handlePageChange}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default OrdersPage;
