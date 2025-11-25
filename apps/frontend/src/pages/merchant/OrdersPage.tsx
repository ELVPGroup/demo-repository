import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Sidebar from '@/components/merchantComponents/Sidebar';
import { TopBar } from '@/components/merchantComponents/TopBar';
import { SearchBar } from '@/components/merchantComponents/SearchBar';
import { StatusFilter } from '@/components/merchantComponents/StatusFilter';
import CardGrid from '@/components/merchantComponents/CardGrid';

// 模拟订单数据类型
export interface OrderItem {
  id: string;
  productName: string;
  orderTime: string;
  amount: number;
  status: "pending" | "confirmed" | "delivered";
}

// 生成更多模拟数据
const generateMockOrders = (): OrderItem[] => {
  const products = [
    "商品名称 A", "商品名称 B", "商品名称 C", "商品名称 D",
    "商品名称 E", "商品名称 F", "商品名称 G", "商品名称 H",
    "商品名称 I", "商品名称 J", "商品名称 K", "商品名称 L",
    "商品名称 M", "商品名称 N", "商品名称 O", "商品名称 P",
  ];
  const statuses: ("pending" | "confirmed" | "delivered")[] = ["pending", "confirmed", "delivered"];
  
  const orders: OrderItem[] = [];
  const baseDate = new Date('2025-11-20');
  
  for (let i = 0; i < 50; i++) {
    const date = new Date(baseDate);
    date.setHours(8 + Math.floor(i / 3), (i * 17) % 60);
    
    orders.push({
      id: `ODR${10086888 + i}`,
      productName: products[i % products.length],
      orderTime: date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(/\//g, '-'),
      amount: Math.floor(Math.random() * 1000) + 50,
      status: statuses[i % statuses.length],
    });
  }
  
  return orders;
};

const ALL_MOCK_ORDERS = generateMockOrders();
const ITEMS_PER_PAGE = 12;

const OrdersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'amount' | 'id'>('time');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const prevFilteredOrdersRef = useRef<string>('');

  // 根据搜索和状态过滤订单，并排序
  const filteredOrders = useMemo(() => {
    let filtered = ALL_MOCK_ORDERS;

    // 按状态过滤
    if (status === 'pending') {
      filtered = filtered.filter(order => order.status === 'pending');
    } else if (status === 'done') {
      filtered = filtered.filter(order => order.status === 'confirmed' || order.status === 'delivered');
    }

    // 按搜索关键词过滤
    if (search.trim()) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.productName.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 排序
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime();
        case 'amount':
          return b.amount - a.amount;
        case 'id':
          return a.id.localeCompare(b.id);
        default:
          return 0;
      }
    });

    return filtered;
  }, [search, status, sortBy]);

  // 当过滤条件改变时，重置页码
  useEffect(() => {
    const currentFilterKey = `${search}-${status}-${sortBy}`;
    if (prevFilteredOrdersRef.current !== currentFilterKey) {
      prevFilteredOrdersRef.current = currentFilterKey;
      // 使用异步更新来避免同步 setState
      setTimeout(() => {
        setCurrentPage(1);
      }, 0);
    }
  }, [search, status, sortBy]);

  // 基于当前页和过滤结果计算显示的订单
  const displayedOrders = useMemo(() => {
    const endIndex = currentPage * ITEMS_PER_PAGE;
    return filteredOrders.slice(0, endIndex);
  }, [filteredOrders, currentPage]);

  // 计算是否还有更多数据
  const hasMore = useMemo(() => {
    return filteredOrders.length > displayedOrders.length;
  }, [filteredOrders.length, displayedOrders.length]);

  // 加载更多订单
  const loadMoreOrders = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // 模拟网络延迟
    setTimeout(() => {
      setCurrentPage((prev) => prev + 1);
      setIsLoading(false);
    }, 500);
  }, [isLoading, hasMore]);


  // 滚动监听
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreOrders();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMoreOrders]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-layout)' }}>
      <Sidebar />

      <main className="ml-60 flex-1 px-10 py-6">
        <TopBar title="订单管理" />

        <SearchBar
          value={search}
          onChange={setSearch}
          onSearch={() => console.log('search:', search)}
        />

        <StatusFilter status={status} setStatus={setStatus} sortBy={sortBy} setSortBy={setSortBy} />

        {/* Orders Grid */}
        <CardGrid orders={displayedOrders} />

        {/* 加载更多触发器 */}
        <div ref={observerTarget} className="h-10 flex items-center justify-center">
          {isLoading && (
            <div style={{ color: 'var(--color-text-secondary)' }}>加载中...</div>
          )}
          {!hasMore && displayedOrders.length > 0 && (
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              没有更多订单了
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrdersPage;
