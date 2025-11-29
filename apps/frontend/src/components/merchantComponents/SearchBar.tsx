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
      {/* <input
        type="text"
        placeholder="搜索订单编号"
        className="flex-1 rounded-lg border px-4 py-2 outline-none transition-colors"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-bg-container)',
          color: 'var(--color-text)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary)';
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSearch) {
            onSearch();
          }
        }}
      /> */}

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
