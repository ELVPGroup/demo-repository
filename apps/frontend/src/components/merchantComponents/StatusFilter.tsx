import React from 'react';
import { Select } from 'antd';

type Status = 'all' | 'pending' | 'done';
type SortBy = 'time' | 'amount' | 'id';

interface StatusFilterProps {
  status: Status;
  setStatus: (s: Status) => void;
  sortBy?: SortBy;
  setSortBy?: (s: SortBy) => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  status,
  setStatus,
  sortBy = 'time',
  setSortBy,
}) => {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 pr-4">
      {/* 左侧：排序选择 */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">排序：</label>
   
        <Select
          style={{ width: 150 }} 
          onChange={(e) => setSortBy?.(e.target.value as SortBy)}
          options={[
            { value: 'time', label: <span>按时间</span> },
            { value: 'amount', label: <span>按金额</span> },
            { value: 'id', label: <span>按订单号</span> },
          ]}
        />
      </div>

      {/* 右侧：状态筛选 */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">按状态筛选：</span>
        {(['all', 'pending', 'done'] as Status[]).map((s) => (
          <button
            key={s}
            className={`rounded-lg px-4 py-2 transition-colors ${status === s ? 'bg-gray-300 font-semibold' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            onClick={() => setStatus(s)}
          >
            {s === 'all' ? '全部' : s === 'pending' ? '待处理' : '已完成'}
          </button>
        ))}
      </div>
    </div>
  );
};
