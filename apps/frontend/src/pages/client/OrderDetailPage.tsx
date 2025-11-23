import ClientTracker from '@/components/ClientTracker';
import { useParams } from 'react-router';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  return (
    <main>
      <h1>Client Order Detail</h1>
      <span>Order ID: {orderId}</span>
      <ClientTracker />
    </main>
  );
};

export default OrderDetailPage;
