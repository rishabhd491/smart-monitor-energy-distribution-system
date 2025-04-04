import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building2, ThermometerSun, Battery } from 'lucide-react';
import { SensorData, BuildingStats } from '../types';

interface DashboardProps {
  sensorData: SensorData[];
  buildingStats: BuildingStats;
}

export function Dashboard({ sensorData, buildingStats }: DashboardProps) {
  const chartData = sensorData.map(data => ({
    name: data.location,
    temperature: data.temperature,
    occupancy: data.occupancy,
    energy: data.energyUsage
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Occupancy</p>
              <p className="text-2xl font-semibold">{buildingStats.totalOccupancy}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ThermometerSun className="w-8 h-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Average Temperature</p>
              <p className="text-2xl font-semibold">{buildingStats.averageTemperature.toFixed(1)}°C</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Battery className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Energy Usage</p>
              <p className="text-2xl font-semibold">{buildingStats.totalEnergyUsage.toFixed(0)} kWh</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Sensor Metrics Overview</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperature (°C)" />
              <Line yAxisId="left" type="monotone" dataKey="occupancy" stroke="#3b82f6" name="Occupancy" />
              <Line yAxisId="right" type="monotone" dataKey="energy" stroke="#eab308" name="Energy (kWh)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}