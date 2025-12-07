import { useEffect, useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Pagination } from 'antd';
import ProductGrid from '../../components/clientComponents/product/ProductGrid';
import { clientAxiosInstance } from '@/utils/axios';
import type { ClientProduct } from '@/types/product';

function ProductsPage() {
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const totalItems = useMemo(() => products.length, [products]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const res = await clientAxiosInstance.post('/products/list', { limit: pageSize, offset });
      const list = (res.data?.data || []) as ClientProduct[];
      setProducts(list);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <main className="px-4 pt-12 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">商品选购</h1>
          <p className="text-gray-500">选购您心仪的商品</p>
        </div>
      </div>
      <section className="h-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ProductGrid products={products} />

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Pagination
              current={page}
              pageSize={pageSize}
              showSizeChanger
              onChange={(p, s) => {
                setPage(p);
                setPageSize(s);
              }}
              total={totalItems}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProductsPage;
