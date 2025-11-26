import React from 'react';
import { Package } from 'lucide-react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 rounded-lg bg-blue-500 opacity-20 blur-md" />
        <div className="relative flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 shadow-lg">
          <Package className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-gray-900">物流配送</span>
        <span className="text-xs font-medium text-gray-500">Logistics Platform</span>
      </div>
    </div>
  );
};

