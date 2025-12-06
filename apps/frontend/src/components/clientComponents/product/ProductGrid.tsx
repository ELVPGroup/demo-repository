import { Row, Col, Empty } from 'antd';
import ProductCard, { type ClientProduct } from './ProductCard';

interface ProductGridProps {
  products: ClientProduct[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (!products.length) return <Empty description="暂无商品" />;
  return (
    <Row gutter={[16, 16]}>
      {products.map((product) => (
        <Col key={product.productId} xs={24} sm={12} md={8} lg={6} xl={6}>
          <ProductCard product={product} />
        </Col>
      ))}
    </Row>
  );
}
