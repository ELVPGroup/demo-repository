import React from 'react';

import { Input } from 'antd';
import { Button } from 'antd';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSearch?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch }) => {
  return (
    <div className="mb-6 flex items-center gap-4">

      <Input
        placeholder="搜索订单编号"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSearch) {
            onSearch();
          }
        }}
      />

      <Button type="primary" onClick={onSearch}>
        搜索
      </Button>

    </div>
  );
};
