import React, { useState, useEffect, useMemo } from 'react';
import { Pagination, Spin } from 'antd';
import { TopBar } from '@/components/merchantComponents/TopBar';
import { SearchBar } from '@/components/merchantComponents/SearchBar';
import { StatusFilter } from '@/components/merchantComponents/StatusFilter';
import CardGrid from '@/components/merchantComponents/CardGrid';
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

  const { orders, loading, setParams, fetchOrders } = useOrderStore();

  // 使用防抖处理搜索输入，延迟 500ms
  const debouncedSearch = useDebounce(search, 500);

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

  // 当过滤条件、页码改变时，更新 store 参数并重新获取数据（不包含搜索，搜索在前端过滤）
  useEffect(() => {
    setParams({
      status: mapStatusToApi(status), // 使用映射函数转换状态：待发货 -> PENDING, 运输中 -> SHIPPED, 已完成 -> COMPLETED
      limit: 1000, // 获取更多数据以便前端过滤（可以根据实际情况调整）
      offset: 0,
      sort,
      sortBy: mapSortByToApi(sortBy), // 映射 sortBy：amount -> totalPrice, id -> orderId
    });
    fetchOrders();
  }, [status, sortBy, sort, setParams, fetchOrders]);

  // 使用 useMemo 过滤订单：根据搜索关键词和状态过滤
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // 根据搜索关键词过滤订单编号
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.trim().toLowerCase();
      result = result.filter((order) =>
        order.orderId.toLowerCase().includes(searchLower)
      );
    }

    // 根据状态过滤（前端状态已经是中文，直接匹配）
    if (status !== '全部') {
      result = result.filter((order) => order.status === status);
    }

    return result;
  }, [orders, debouncedSearch, status]);

  // 计算分页后的订单
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, currentPage]);

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
        ) : filteredOrders.length === 0 ? (
          <div
            className="mt-6 flex h-100 items-center justify-center text-center"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {search.trim() ? '未找到匹配的订单' : '暂无订单数据'}
          </div>
        ) : (
          <CardGrid orders={paginatedOrders} />
        )}

        {/* 分页组件 */}
        {!loading && filteredOrders.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              current={currentPage}
              total={filteredOrders.length}
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
