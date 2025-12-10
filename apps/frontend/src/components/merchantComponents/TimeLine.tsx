import React from 'react';
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';
import type { TrackingStep } from '@/types';
import { orderStatusColors } from '@/theme/theme';

interface TimeLineProps {
  steps: TrackingStep[];
  title?: string;
  className?: string;
}

// 根据状态获取对应的图标和颜色
const getStatusConfig = (status: string) => {
  const statusLower = status.toLowerCase();

  // 优先精确匹配中文状态
  if (status === '待发货' || statusLower.includes('pending') || statusLower.includes('待发货')) {
    return {
      icon: Package,
      colors: orderStatusColors['待发货'] || orderStatusColors.default,
    };
  }
  if (status === '运输中' || statusLower.includes('shipped') || statusLower.includes('运输中') || statusLower.includes('已揽收')) {
    return {
      icon: Truck,
      colors: orderStatusColors['运输中'] || orderStatusColors.default,
    };
  }
  if (status === '已完成' || statusLower.includes('completed') || statusLower.includes('已完成') || statusLower.includes('已签收') || statusLower.includes('delivered')) {
    return {
      icon: CheckCircle,
      colors: orderStatusColors['已完成'] || orderStatusColors.default,
    };
  }
  if (statusLower.includes('派送中') || statusLower.includes('in_transit')) {
    return {
      icon: MapPin,
      colors: orderStatusColors['运输中'] || orderStatusColors.default,
    };
  }

  // 默认配置
  return {
    icon: Clock,
    colors: orderStatusColors.default,
  };
};

export const TimeLine: React.FC<TimeLineProps> = ({
  steps,
  title = '配送时间线',
  className = '',
}) => {
  return (
    <div className={`custom-scrollbar flex-1 overflow-y-auto ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-blue-500" />
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>

      <div className="relative space-y-3 pl-2.5">
        {/* Vertical Line */}
        <div className="absolute top-2 bottom-6 left-[29px] w-0.5 bg-gray-200"></div>

        {steps.map((step, index) => {
          const { icon: Icon, colors } = getStatusConfig(step.status);
          const isCurrent = step.currentLocation || index === steps.length - 1;

          return (
            <div key={step.id} className="group relative flex gap-4">
              {/* Icon Container */}
              <div className="relative z-10 shrink-0">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isCurrent
                      ? 'scale-110 border-blue-200 bg-white shadow-md ring-2 ring-blue-100'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: isCurrent ? colors.bg : '#F9FAFB',
                    borderColor: isCurrent ? colors.border : '#E5E7EB',
                  }}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isCurrent ? 'text-blue-600' : 'text-gray-400'
                    }`}
                    style={{
                      color: isCurrent ? colors.text : '#9CA3AF',
                    }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className={`flex-1 pb-3 ${isCurrent ? 'opacity-100' : 'opacity-70'}`}>
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div
                      className="mb-1 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: isCurrent ? colors.bg : '#F3F4F6',
                        color: isCurrent ? colors.text : '#6B7280',
                      }}
                    >
                      {step.status}
                    </div>
                    {step.description && (
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        {step.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-medium text-gray-900">{step.time}</div>
                    <div className="text-xs text-gray-500">{step.date}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
