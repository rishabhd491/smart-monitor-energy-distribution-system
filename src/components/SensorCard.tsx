import React from 'react';
import { Thermometer, Users, Zap } from 'lucide-react';
import { SensorData } from '../types';

interface SensorCardProps {
  data: SensorData;
}

export function SensorCard({ data }: SensorCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold mb-4">{data.location}</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Thermometer className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-gray-600">Temperature</span>
          </div>
          <span className="font-medium">{data.temperature.toFixed(1)}°C</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-gray-600">Occupancy</span>
          </div>
          <span className="font-medium">{data.occupancy} people</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-gray-600">Energy Usage</span>
          </div>
          <span className="font-medium">{data.energyUsage.toFixed(1)} kWh</span>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        Last updated: {data.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
}