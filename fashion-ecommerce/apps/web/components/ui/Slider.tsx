'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  disabled = false,
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    // Đảm bảo min không vượt quá max hiện tại
    const newMin = Math.min(newValue, value[1]);
    onValueChange([newMin, value[1]]);
  };

  const handleChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    // Đảm bảo max không nhỏ hơn min
    // Cho phép max đạt được giá trị tối đa (max prop) ngay cả khi min đã được set
    const newMax = Math.max(newValue, value[0]);
    onValueChange([value[0], newMax]);
  };

  // Tránh chia cho 0
  const range = max - min;
  // Tính percentage với offset để thumb không bị trượt ra ngoài
  // Thumb có width 20px, cần offset để center của thumb nằm đúng vị trí
  const thumbWidth = 20; // px
  const percentage1 = range > 0 ? ((value[0] - min) / range) * 100 : 0;
  const percentage2 = range > 0 ? ((value[1] - min) / range) * 100 : 100;

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative h-2 bg-gray-200 rounded-full" style={{ margin: '10px 0' }}>
        {/* Track between handles */}
        <div
          className="absolute h-2 bg-primary rounded-full"
          style={{
            left: `${percentage1}%`,
            width: `${percentage2 - percentage1}%`,
          }}
        />
        
        {/* Handle 1 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          disabled={disabled}
          className="absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb z-10"
          style={{
            background: 'transparent',
            margin: 0,
            padding: 0,
          }}
        />
        
        {/* Handle 2 */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={handleChange2}
          disabled={disabled}
          className="absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb z-20"
          style={{
            background: 'transparent',
            margin: 0,
            padding: 0,
          }}
        />
      </div>
      
      <style jsx>{`
        .slider-thumb {
          pointer-events: none;
        }
        
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          pointer-events: all;
          position: relative;
          margin-top: -10px;
        }
        
        .slider-thumb::-webkit-slider-runnable-track {
          height: 2px;
          background: transparent;
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          pointer-events: all;
          position: relative;
        }
        
        .slider-thumb::-moz-range-track {
          height: 2px;
          background: transparent;
        }
        
        .slider-thumb:disabled::-webkit-slider-thumb {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        .slider-thumb:disabled::-moz-range-thumb {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
