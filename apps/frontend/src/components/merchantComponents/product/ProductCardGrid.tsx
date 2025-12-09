import { Col, Empty, Row } from 'antd';
import type { MerchantProduct } from './ProductFormModal';
import ProductCard from './ProductCard';

interface ProductCardGridProps {
  products: MerchantProduct[];
  onEdit: (product: MerchantProduct) => void;
  onDelete: (productId: string) => void;
}

export default function ProductCardGrid(props: ProductCardGridProps) {
  const { products, onEdit, onDelete } = props;
  if (!products.length) return <Empty description="暂无商品" />;
  return (
    <Row gutter={[16, 16]}>
      {products.map((product) => (
        <Col key={product.productId} xs={24} sm={12} md={8} lg={6} xl={6}>
          <ProductCard product={product} onEdit={onEdit} onDelete={onDelete} />
        </Col>
      ))}
    </Row>
  );
}
