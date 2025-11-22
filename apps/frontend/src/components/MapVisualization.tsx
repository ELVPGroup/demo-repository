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

  const handleMouseMove = useCallback((e: MouseEvent) => {
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
  }, [isDragging, setRadius]);

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
    <div className="relative w-full h-full bg-gray-50 overflow-hidden flex items-center justify-center select-none">
      {/* Background Grid */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}>
      </div>

      <svg
        ref={svgRef}
        className="w-[800px] h-[800px] relative z-10"
        viewBox="0 0 800 800"
      >
        {/* Zones Rings (Visual guide) */}
        <circle cx="400" cy="400" r={10 * SCALE} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="400" cy="400" r={20 * SCALE} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="400" cy="400" r={30 * SCALE} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

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
          className="cursor-ew-resize transition-transform shadow-lg"
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
          className="text-xs font-bold fill-blue-600 pointer-events-none select-none"
        >
          {radius.toFixed(1)} km
        </text>

        {/* Center Hub */}
        <g transform="translate(400, 400)">
          <circle r="12" fill="#2563eb" className="shadow-lg" />
          <path d="M-4 -6 L4 -6 L0 8 Z" fill="white" />
        </g>

        {/* Orders */}
        {orders.map(order => {
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
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-sm p-3 rounded-lg border border-gray-200 text-xs z-20">
        <div className="font-semibold mb-2 text-gray-700">Legend</div>
        <div className="flex items-center mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          <span>Normal Delivery</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
          <span>Risk (Time)</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
          <span>Out of Zone</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full border-2 border-blue-500 bg-blue-100 mr-2"></div>
          <span>Delivery Zone</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-500 pointer-events-none">
        Drag the blue ring to adjust range
      </div>
    </div>
  );
};

export default MapVisualization;
