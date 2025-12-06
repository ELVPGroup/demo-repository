import { useEffect, useMemo, useState } from 'react';
import { TopBar } from '@/components/merchantComponents/TopBar';
import { Segmented, Button, Space, Spin } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import ProductFormModal, {
  type MerchantProduct,
} from '@/components/merchantComponents/product/ProductFormModal';
import ProductCardGrid from '@/components/merchantComponents/product/ProductCardGrid';
import ProductListTable from '@/components/merchantComponents/product/ProductListTable';
import { merchantAxiosInstance } from '@/utils/axios';

function ProductsPage() {
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<MerchantProduct | null>(null);

  const segmentedOptions = useMemo(
    () => [
      { label: '卡片', value: 'card' },
      { label: '列表', value: 'list' },
    ],
    []
  );

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await merchantAxiosInstance.get('/products');
      const data = (res.data?.data || []) as MerchantProduct[];
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function openCreate() {
    setModalMode('create');
    setEditingProduct(null);
    setModalOpen(true);
  }
  function openEdit(product: MerchantProduct) {
    setModalMode('edit');
    setEditingProduct(product);
    setModalOpen(true);
  }
  async function handleDelete(productId: string) {
    await merchantAxiosInstance.delete(`/products/${productId}`);
    setProducts((prev) => prev.filter((p) => p.productId !== productId));
  }
  function handleSuccess(product: MerchantProduct) {
    setModalOpen(false);
    setEditingProduct(null);
    setProducts((prev) => {
      if (product.productId) {
        const idx = prev.findIndex((p) => p.productId === product.productId);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = { ...prev[idx], ...product };
          return next;
        }
      }
      return [product, ...prev];
    });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-layout)' }}>
      <main className="ml-60 flex-1 px-10 py-6">
        <TopBar title="商品管理" />
        <Space style={{ marginTop: 16, width: '100%', justifyContent: 'space-between' }}>
          <Segmented
            options={segmentedOptions}
            value={viewMode}
            onChange={(v) => setViewMode(v as 'card' | 'list')}
          />
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchProducts}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增商品
            </Button>
          </Space>
        </Space>
        <div style={{ marginTop: 16 }}>
          {loading ? (
            <Spin />
          ) : viewMode === 'card' ? (
            <ProductCardGrid products={products} onEdit={openEdit} onDelete={handleDelete} />
          ) : (
            <ProductListTable
              products={products}
              loading={loading}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
        </div>

        {modalOpen ? (
          <ProductFormModal
            open={modalOpen}
            mode={modalMode}
            initialProduct={editingProduct}
            onCancel={() => setModalOpen(false)}
            onSuccess={handleSuccess}
          />
        ) : null}
      </main>
    </div>
  );
}

export default ProductsPage;
