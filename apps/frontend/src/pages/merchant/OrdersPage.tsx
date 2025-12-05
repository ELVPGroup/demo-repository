import React, { useState, useEffect } from 'react';
import { Pagination, Spin } from 'antd';
import Sidebar from '@/components/merchantComponents/Sidebar';
import { TopBar } from '@/components/merchantComponents/TopBar';
import { SearchBar } from '@/components/merchantComponents/SearchBar';
import { StatusFilter } from '@/components/merchantComponents/StatusFilter';
import CardGrid from '@/components/merchantComponents/CardGrid';
import { useOrderStore } from '@/store/useOrderStore';

const ITEMS_PER_PAGE = 9;

const OrdersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount' | 'id'>('createdAt');
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const { orders, total, loading, setParams, fetchOrders } = useOrderStore();

  // 将 StatusFilter 的 sortBy 值映射到 API 期望的值
  const mapSortByToApi = (
    value: 'createdAt' | 'amount' | 'id'
  ): 'createdAt' | 'totalPrice' | 'orderId' => {
    const mapping = {
      createdAt: 'createdAt',
      amount: 'totalPrice',
      id: 'orderId',
    } as const;
    return mapping[value];
  };

  // 当过滤条件或页码改变时，更新 store 参数并重新获取数据
  useEffect(() => {
    setParams({
      status: status === 'all' ? undefined : status,
      customerName: search.trim() || undefined,
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
      sort,
      sortBy,
    });
    fetchOrders();
  }, [search, status, sortBy, sort, currentPage, setParams, fetchOrders]);

  // 分页改变处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1);
    // 触发 useEffect 重新获取数据
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-layout)' }}>
      <main className="ml-60 flex-1 px-10 py-6">
        <TopBar title="订单管理" />

        <SearchBar value={search} onChange={setSearch} onSearch={handleSearch} />

        <StatusFilter
          status={status}
          setStatus={setStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sort={sort}
          setSort={setSort}
        />

        {/* Orders Grid */}
        {loading && orders.length === 0 ? (
          <div className="mt-6 flex h-100 items-center justify-center">
            <Spin size="large" />
          </div>
        ) : orders.length === 0 ? (
          <div
            className="mt-6 flex h-100 items-center justify-center text-center"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            暂无订单数据
          </div>
        ) : (
          <CardGrid />
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
