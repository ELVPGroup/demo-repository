import ClientNavbar from '@/components/clientComponents/ClientNavbar';
import { Outlet } from 'react-router';

const ClientLayout = () => {
  return (
    <main className="bg-background min-h-screen bg-gray-50">
      <ClientNavbar />
      <Outlet />
    </main>
  );
};

export default ClientLayout;
