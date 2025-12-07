import { Drawer, Button, InputNumber, Empty, Image, message } from 'antd';
import { useCartStore } from '@/store/useCartStore';
import type { ClientProduct } from '@/types/product';
import { BASE_SERVER_URL } from '@/config';
import { DeleteOutlined } from '@ant-design/icons';
import { MapPin, Store } from 'lucide-react';
import { clientAxiosInstance, commonAxiosInstance } from '@/utils/axios';
import { useEffect, useState } from 'react';
import type { AddressInfo } from '@/types/orderDetailInterface';
import AddressManagerDialog from './AddressManagerDialog';

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface MerchantGroup {
  merchantId: string;
  merchantName: string;
  items: ClientProduct[];
  totalQuantity: number;
  totalPrice: number;
}

interface MerchantGroupProps {
  group: MerchantGroup;
}

// 地址展示组件
function AddressDisplay({
  address,
  onSelect,
}: {
  address: AddressInfo | null;
  onSelect: (address: AddressInfo) => void;
}) {
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);

  return (
    <>
      <div className="mb-6 rounded-xl p-4 shadow-sm">
        {address ? (
          <>
            <div className="flex items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 shrink-0" />
                <span className="line-clamp-1 text-lg font-medium">{address.address}</span>
              </div>
              <Button size="small" onClick={() => setAddressDialogOpen(true)}>
                选择
              </Button>
            </div>
            <div>
              <span className="mr-4 text-sm text-gray-800">{address.name}</span>
              <span className="text-sm text-gray-500">{address.phone}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-sm text-gray-500">未设置地址</span>
            <Button size="small" onClick={() => setAddressDialogOpen(true)}>
              选择地址
            </Button>
          </div>
        )}
      </div>
      <AddressManagerDialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        isSelect
        onSelect={onSelect}
      />
    </>
  );
}

// 每个商家的商品列表组
function MerchantGroup({ group }: MerchantGroupProps) {
  const { updateProductQuantity, removeProduct } = useCartStore();

  const handleQuantityChange = (product: ClientProduct, value: number | null) => {
    if (typeof value === 'number') {
      if (value >= 1) updateProductQuantity(product.productId, value);
      else if (value === 0) removeProduct(product);
    }
  };

  const handleRemove = (product: ClientProduct) => {
    removeProduct(product);
  };

  return (
    <div key={group.merchantId} className="rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-300 px-4 py-3">
        <div className="flex items-center gap-2">
          <Store className="text-gray-500" size={16} />
          <span className="text-lg font-semibold">{group.merchantName}</span>
        </div>
        <div className="text-sm text-gray-500">{`小计：¥ ${group.totalPrice.toFixed(2)} · ${group.totalQuantity} 件`}</div>
      </div>
      <div className="divide-y divide-gray-200">
        {group.items.map((item) => (
          <div key={item.productId} className="flex items-center gap-3 px-4 py-2">
            {item.imageUrl ? (
              <Image
                src={`${BASE_SERVER_URL}${item.imageUrl}`}
                width={56}
                height={56}
                style={{ objectFit: 'cover', borderRadius: 8 }}
                preview={false}
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gray-100 font-semibold">
                {item.name.slice(0, 1)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between pt-2">
                <span className="line-clamp-1 font-medium">{item.name}</span>
                <span className="text-gray-500">{`¥ ${item.price.toFixed(2)}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">库存：{item.amount}</div>
                <div className="flex w-35 items-center gap-2">
                  <InputNumber
                    mode="spinner"
                    value={item.quantity}
                    min={0}
                    max={item.amount}
                    onChange={(value) => handleQuantityChange(item, value)}
                    size="small"
                  />
                  <Button
                    danger
                    type="link"
                    onClick={() => handleRemove(item)}
                    icon={<DeleteOutlined />}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 购物车侧边栏
function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { products, totalPrice, totalQuantity, isEmpty, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<AddressInfo | null>(null);

  const setDefaultAddress = (address: AddressInfo) => {
    commonAxiosInstance.post('/shipping/default', {
      addressInfoId: address.addressInfoId,
    });
    setAddress(address);
  };

  useEffect(() => {
    const fetchDefaultAddress = async () => {
      try {
        const { data } = await commonAxiosInstance.get('/shipping/default');
        setAddress(data.data);
      } catch (error) {
        console.error('获取默认地址失败', error);
      }
    };
    fetchDefaultAddress();
  }, []);

  const handleCheckout = async () => {
    if (isEmpty) {
      message.info('购物车为空');
      return;
    }
    setLoading(true);
    try {
      await clientAxiosInstance.post('/orders', {
        products,
        shippingAddress: address,
      });
      clearCart();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // 按商家分组商品
  const merchantGroups = Object.values(
    products.reduce(
      (acc, item) => {
        const key = item.merchantId;
        if (!acc[key]) {
          acc[key] = {
            merchantId: item.merchantId,
            merchantName: item.merchantName,
            items: [],
            totalQuantity: 0,
            totalPrice: 0,
          };
        }
        acc[key].items.push(item);
        acc[key].totalQuantity += item.quantity;
        acc[key].totalPrice += item.quantity * item.price;
        return acc;
      },
      {} as Record<string, MerchantGroup>
    )
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      closable={{ placement: 'end' }}
      title="购物车"
      placement="right"
      size={500}
      destroyOnHidden
    >
      {isEmpty ? (
        <Empty description="购物车为空" />
      ) : (
        <>
          <AddressDisplay address={address} onSelect={setDefaultAddress} />
          <div className="space-y-4 pb-28">
            {merchantGroups.map((group) => (
              <MerchantGroup key={group.merchantId} group={group} />
            ))}
          </div>
          <div className="absolute right-0 bottom-0 left-0 border-t border-gray-300 bg-white">
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div
                  style={{ color: 'var(--color-text-secondary)' }}
                >{`共 ${totalQuantity} 件`}</div>
                <div className="text-lg font-semibold">{`合计 ¥ ${totalPrice.toFixed(2)}`}</div>
              </div>
              <Button
                type="primary"
                size="large"
                block
                style={{ marginTop: 12 }}
                onClick={handleCheckout}
              >
                下单
              </Button>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}

export default CartSidebar;
