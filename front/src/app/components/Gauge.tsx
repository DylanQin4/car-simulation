'use client';

import React from 'react';

interface GaugeProps {
    value: number;
    minValue?: number;
    maxValue: number;
    unit?: string;
    label?: string;
    minAngle?: number;
    maxAngle?: number;
    gaugeSize?: number;
}

const Gauge: React.FC<GaugeProps> = ({
    value,
    minValue = 0,
    maxValue,
    unit = '',
    minAngle = -135,
    maxAngle = 135,
    gaugeSize = 200
}) => {
    const clampedValue = Math.max(minValue, Math.min(value, maxValue));
    const normalizedValue = (clampedValue - minValue) / (maxValue - minValue);
    const angleRange = maxAngle - minAngle;
    const rotationAngle = minAngle + normalizedValue * angleRange;

    return (
        <div className="relative overflow-hidden mx-auto" style={{ width: gaugeSize, height: gaugeSize / 2 }}>
            <div className="absolute w-full rounded-full border-[10px] border-gray-300 border-b-transparent top-0" style={{ height: gaugeSize}}></div>
            <div 
                className="absolute bottom-0 left-1/2 w-[3px] h-[95px] bg-red-500 rounded-t-md shadow-md origin-bottom transition-transform"
                style={{ transform: `translateX(-50%) rotate(${rotationAngle}deg)` }}
            ></div>
            <div className="absolute bottom-[5px] left-1/2 transform -translate-x-1/2 text-lg font-bold">
                {value.toFixed(0)} <span className="text-sm">{unit}</span>
            </div>
            <div className="absolute bottom-[-5px] left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full z-10"></div>
        </div>
    );
};

export default Gauge;
