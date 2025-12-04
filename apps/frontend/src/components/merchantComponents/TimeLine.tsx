import React from 'react';
import type { TrackingStep } from '@/types';

interface TimeLineProps {
  steps: TrackingStep[];
  title?: string;
  className?: string;
}

export const TimeLine: React.FC<TimeLineProps> = ({
  steps,
  title = 'Logistics Status',
  className = '',
}) => {
  return (
    <div className={`custom-scrollbar flex-1 overflow-y-auto p-6 ${className}`}>
      <h3 className="mb-4 text-sm font-bold text-gray-800">{title}</h3>
      <div className="relative space-y-8 pl-4">
        {/* Vertical Line */}
        <div className="absolute top-2 bottom-2 left-[19px] w-0.5 bg-gray-200"></div>

        {steps.map((step) => (
          <div key={step.id} className="group relative flex gap-4">
            {/* Node */}
            <div
              className={`relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 ${
                step.currentLocation
                  ? 'scale-125 border-blue-100 bg-blue-600 ring-4 ring-blue-50'
                  : 'border-white bg-gray-300'
              }`}
            ></div>

            {/* Content */}
            <div className={`${step.currentLocation ? 'opacity-100' : 'opacity-70'}`}>
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`text-sm font-bold ${
                    step.currentLocation ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {step.status}
                </span>
                <div className="text-right text-xs leading-tight text-gray-400">
                  <div>{step.time}</div>
                  <div className="origin-right scale-90">{step.date}</div>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-gray-500">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};