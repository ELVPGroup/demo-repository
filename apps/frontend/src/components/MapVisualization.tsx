import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Order, OrderStatus } from '../types';

interface MapVisualizationProps {
  orders: Order[];
  radius: number;
  setRadius: (r: number) => void;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({ orders, radius, setRadius }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Map constants
  const VIEW_SIZE = 100; // -50 to +50 km coordinate space
  const SCALE = 8; // Scale factor for visual rendering

  // Convert km coordinates to SVG coordinates (center is 400,400 in an 800x800 svg)
  const toSvg = (val: number) => 400 + val * SCALE;

  // Handle Radius Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      // Calculate distance in pixels, then convert back to km
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const distKm = Math.min(Math.max(distPx / SCALE, 1), 48); // Clamp between 1km and 48km

      setRadius(distKm);
    },
    [isDragging, setRadius]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Visual helpers
  const radiusPx = radius * SCALE;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gray-50 select-none">
      {/* Background Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      ></div>

      <svg ref={svgRef} className="relative z-10 h-[800px] w-[800px]" viewBox="0 0 800 800">
        {/* Zones Rings (Visual guide) */}
        <circle
          cx="400"
          cy="400"
          r={10 * SCALE}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx="400"
          cy="400"
          r={20 * SCALE}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx="400"
          cy="400"
          r={30 * SCALE}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* The Active Delivery Zone */}
        <circle
          cx="400"
          cy="400"
          r={radiusPx}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="8 4"
          className="transition-all duration-75 ease-linear"
        />

        {/* Drag Handle on the Radius Ring */}
        <circle
          cx={400 + radiusPx}
          cy="400"
          r="8"
          fill="white"
          stroke="#3b82f6"
          strokeWidth="3"
          className="cursor-ew-resize shadow-lg transition-transform"
        />

        {/* Larger invisible hit area to avoid jitter when hovering the small visual handle */}
        <circle
          cx={400 + radiusPx}
          cy="400"
          r={16}
          fill="transparent"
          className="cursor-ew-resize"
          onMouseDown={handleMouseDown}
        />

        {/* Radius Label near handle */}
        <text
          x={400 + radiusPx + 15}
          y="405"
          className="pointer-events-none fill-blue-600 text-xs font-bold select-none"
        >
          {radius.toFixed(1)} km
        </text>

        {/* Center Hub */}
        <g transform="translate(400, 400)">
          <circle r="12" fill="#2563eb" className="shadow-lg" />
          <path d="M-4 -6 L4 -6 L0 8 Z" fill="white" />
        </g>

        {/* Orders */}
        {orders.map((order) => {
          let color = '#9ca3af'; // Default gray
          if (order.status === OrderStatus.DELIVERABLE) color = '#22c55e'; // Green
          if (order.status === OrderStatus.TIME_RISK) color = '#f97316'; // Orange
          if (order.status === OrderStatus.OUT_OF_RANGE) color = '#ef4444'; // Red

          return (
            <circle
              key={order.id}
              cx={toSvg(order.location.x)}
              cy={toSvg(order.location.y)}
              r="4"
              fill={color}
              className="transition-colors duration-300"
            />
          );
        })}
      </svg>

      {/* Legend Overlay */}
      <div className="absolute top-4 right-4 z-20 rounded-lg border border-gray-200 bg-white/90 p-3 text-xs shadow-sm backdrop-blur">
        <div className="mb-2 font-semibold text-gray-700">Legend</div>
        <div className="mb-1 flex items-center">
          <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
          <span>Normal Delivery</span>
        </div>
        <div className="mb-1 flex items-center">
          <div className="mr-2 h-2 w-2 rounded-full bg-orange-500"></div>
          <span>Risk (Time)</span>
        </div>
        <div className="mb-1 flex items-center">
          <div className="mr-2 h-2 w-2 rounded-full bg-red-500"></div>
          <span>Out of Zone</span>
        </div>
        <div className="flex items-center">
          <div className="mr-2 h-2 w-2 rounded-full border-2 border-blue-500 bg-blue-100"></div>
          <span>Delivery Zone</span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs text-gray-500 backdrop-blur">
        Drag the blue ring to adjust range
      </div>
    </div>
  );
};

export default MapVisualization;
