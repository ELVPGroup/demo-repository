import { useParams } from 'react-router';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  return (
    <main>
      <h1>商家端订单详情</h1>
      <span>Order ID: {orderId}</span>
    </main>
  );
};

export default OrderDetailPage;
