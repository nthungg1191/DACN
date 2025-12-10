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
    onValueChange([newValue, value[1]]);
  };

  const handleChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onValueChange([value[0], newValue]);
  };

  const percentage1 = ((value[0] - min) / (max - min)) * 100;
  const percentage2 = ((value[1] - min) / (max - min)) * 100;

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative h-2 bg-gray-200 rounded-full">
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
          className="absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
          style={{
            background: 'transparent',
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
          className="absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
          style={{
            background: 'transparent',
          }}
        />
      </div>
      
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
