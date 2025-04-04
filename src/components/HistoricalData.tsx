import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Download, Calendar, Filter } from 'lucide-react';
import { SensorData } from '../types';
import { format, subDays, subWeeks, subMonths, parseISO } from 'date-fns';

// Mock historical data generator
const generateHistoricalData = (days: number) => {
  const data: Array<{
    date: string;
    totalEnergy: number;
    averageTemperature: number;
    peakOccupancy: number;
    locations: Record<string, number>;
  }> = [];
  
  const today = new Date();
  const locations = ['Main Hall', 'Library', 'Cafeteria', 'Computer Lab', 'Auditorium'];
  
  for (let i = days; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Create location-specific data with some variance
    const locationData: Record<string, number> = {};
    locations.forEach(loc => {
      // Base value with some seasonality (higher on weekdays)
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseFactor = isWeekend ? 0.6 : 1;
      
      // Add some randomness
      locationData[loc] = Math.round(
        (100 + Math.sin(i * 0.3) * 20) * baseFactor + Math.random() * 50
      );
    });
    
    // Add the entry
    data.push({
      date: dateStr,
      totalEnergy: Math.round(locations.reduce((sum, loc) => sum + locationData[loc], 0) * 1.2),
      averageTemperature: 21 + Math.sin(i * 0.2) * 3 + Math.random() * 2,
      peakOccupancy: Math.round(300 + Math.sin(i * 0.1) * 100 + Math.random() * 50),
      locations: locationData
    });
  }
  
  return data;
};

interface HistoricalDataProps {
  sensorData: SensorData[];
}

export function HistoricalData({ sensorData }: HistoricalDataProps) {
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '3months'>('7days');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'energy' | 'temperature' | 'occupancy' | 'location'>('energy');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  
  // Update data when range changes
  useEffect(() => {
    let days = 7;
    if (dateRange === '30days') days = 30;
    if (dateRange === '3months') days = 90;
    
    setHistoricalData(generateHistoricalData(days));
  }, [dateRange]);
  
  // Initialize with all locations selected
  useEffect(() => {
    setSelectedLocations(['Main Hall', 'Library', 'Cafeteria', 'Computer Lab', 'Auditorium']);
  }, []);
  
  const handleExportCSV = () => {
    // Generate CSV content
    const headers = ['Date', 'Total Energy (kWh)', 'Average Temperature (°C)', 'Peak Occupancy', ...selectedLocations];
    const csvContent = [
      headers.join(','),
      ...historicalData.map(day => [
        day.date,
        day.totalEnergy,
        day.averageTemperature.toFixed(1),
        day.peakOccupancy,
        ...selectedLocations.map(loc => day.locations[loc] || 0)
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `energy-data-${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const toggleLocation = (location: string) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter(loc => loc !== location));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-lg shadow p-4">
        <div className="flex space-x-1 mb-4 sm:mb-0">
          <button
            onClick={() => setDateRange('7days')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              dateRange === '7days' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange('30days')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              dateRange === '30days' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange('3months')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              dateRange === '3months' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 3 Months
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <select
              className="block text-sm border-gray-300 rounded-md"
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
            >
              <option value="energy">Energy Usage</option>
              <option value="temperature">Temperature</option>
              <option value="occupancy">Occupancy</option>
              <option value="location">By Location</option>
            </select>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>
      
      {/* Chart display */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">
          {chartType === 'energy' && 'Energy Usage Over Time'}
          {chartType === 'temperature' && 'Temperature Trends'}
          {chartType === 'occupancy' && 'Occupancy Patterns'}
          {chartType === 'location' && 'Energy Usage by Location'}
        </h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'location' ? (
              <BarChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedLocations.map((location, index) => (
                  <Bar
                    key={location}
                    dataKey={`locations.${location}`}
                    name={location}
                    fill={`hsl(${index * 60}, 70%, 50%)`}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {chartType === 'energy' && (
                  <Line type="monotone" dataKey="totalEnergy" stroke="#eab308" name="Energy Usage (kWh)" />
                )}
                {chartType === 'temperature' && (
                  <Line type="monotone" dataKey="averageTemperature" stroke="#ef4444" name="Temperature (°C)" />
                )}
                {chartType === 'occupancy' && (
                  <Line type="monotone" dataKey="peakOccupancy" stroke="#3b82f6" name="Peak Occupancy" />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Location filters (only shown for location chart) */}
      {chartType === 'location' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-4">Filter Locations</h3>
          <div className="flex flex-wrap gap-2">
            {['Main Hall', 'Library', 'Cafeteria', 'Computer Lab', 'Auditorium'].map(location => (
              <button
                key={location}
                onClick={() => toggleLocation(location)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  selectedLocations.includes(location) 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Data table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Historical Data Records</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Showing the most recent {historicalData.length} days of data
          </p>
        </div>
        
        <div className="border-t border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Energy Usage (kWh)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Temperature (°C)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peak Occupancy
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historicalData.slice(0, 10).map((day, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {day.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.totalEnergy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.averageTemperature.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.peakOccupancy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 