import { useUserStore } from '@/store/userStore';
import { Button } from 'antd';
import { LogIn, Search, ShoppingCart, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';

function ClientNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { isLoggedIn } = useUserStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-screen transition-all duration-300 ${
        isScrolled
          ? 'border-border border-gray-200 bg-gray-50/60 shadow-sm backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/client"
            className="text-foreground hover:text-primary text-xl font-semibold transition-colors"
          >
            电商用户端
          </Link>

          {/* 搜索框 */}
          <div className="mx-8 hidden max-w-xs flex-1 md:flex">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="搜索商品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary text-foreground placeholder-muted-foreground focus:ring-primary w-full rounded-lg bg-white px-4 py-2 pr-20 text-sm focus:ring-2 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-muted-foreground hover:text-foreground absolute top-2.5 right-9 h-4 w-4 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Search className="text-muted-foreground absolute top-2.5 right-3 h-4 w-4" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                {/* Orders Link */}
                <Link
                  to="/client/orders"
                  className="text-foreground hover:text-primary p-2 text-sm font-medium transition-colors"
                >
                  我的订单
                </Link>

                {/* Cart Icon */}
                <Link
                  to="/cart"
                  className="text-foreground hover:text-primary relative p-2 transition-colors"
                >
                  <ShoppingCart className="h-6 w-6" />
                </Link>

                {/* User Avatar with Dropdown */}
                {/* <AvatarDropdown /> */}
              </>
            ) : (
              /* Login/Register Button */
              <Button onClick={() => navigate('/login')} className="gap-2">
                <LogIn className="h-4 w-4" />
                登录 / 注册
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default ClientNavbar;
