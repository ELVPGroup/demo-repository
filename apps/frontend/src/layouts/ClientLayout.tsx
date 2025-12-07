import ClientNavbar from '@/components/clientComponents/ClientNavbar';
import { Outlet } from 'react-router';

const ClientLayout = () => {
  return (
    <>
      <ClientNavbar />
      <main className="bg-background min-h-screen bg-gray-50 pt-20">
        <Outlet />
      </main>
    </>
  );
};

export default ClientLayout;
