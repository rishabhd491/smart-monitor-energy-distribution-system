import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceLine } from 'recharts';
import { AlertTriangle, TrendingUp, Lightbulb, Zap, Clock } from 'lucide-react';
import { SensorData } from '../types';
import { format, addDays } from 'date-fns';

// Simulate ML prediction model for energy usage
const predictEnergyUsage = (historicalData: any[], daysToPredict: number) => {
  const result = [];
  const lastDate = historicalData.length > 0 
    ? new Date(historicalData[historicalData.length - 1].date) 
    : new Date();
  
  // Simple linear regression-like prediction with some randomness
  for (let i = 1; i <= daysToPredict; i++) {
    const date = addDays(lastDate, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Determine if it's a weekday (simple factor for prediction)
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Base prediction on the average of the last 7 days with a slight upward trend
    const lastWeekData = historicalData.slice(-7);
    const avgEnergy = lastWeekData.reduce((sum, day) => sum + day.totalEnergy, 0) / lastWeekData.length;
    
    // Add a slight trend and weekend adjustment
    const predictedEnergy = Math.round(avgEnergy * (1 + 0.01 * i) * (isWeekend ? 0.8 : 1.1));
    
    result.push({
      date: dateStr,
      predicted: predictedEnergy,
      lower: Math.round(predictedEnergy * 0.9),  // Lower bound (90%)
      upper: Math.round(predictedEnergy * 1.1),  // Upper bound (110%)
    });
  }
  
  return result;
};

// Detect anomalies in the data
const detectAnomalies = (data: any[]) => {
  if (data.length < 3) return [];
  
  const anomalies = [];
  
  // Calculate moving average and standard deviation
  const movingStats = data.map((_, index, arr) => {
    if (index < 2) return null;
    
    const window = arr.slice(Math.max(0, index - 7), index);
    const sum = window.reduce((total, day) => total + day.totalEnergy, 0);
    const mean = sum / window.length;
    
    const squaredDiffs = window.map(day => Math.pow(day.totalEnergy - mean, 2));
    const variance = squaredDiffs.reduce((total, diff) => total + diff, 0) / window.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev };
  });
  
  // Detect points that are more than 2 standard deviations away
  data.forEach((day, index) => {
    const stats = movingStats[index];
    if (!stats) return;
    
    const zScore = Math.abs(day.totalEnergy - stats.mean) / stats.stdDev;
    if (zScore > 2) {
      anomalies.push({
        ...day,
        severity: zScore > 3 ? 'high' : 'medium',
        expectedValue: Math.round(stats.mean)
      });
    }
  });
  
  return anomalies;
};

// Generate optimization recommendations
const generateRecommendations = (data: any[], anomalies: any[]) => {
  const recommendations = [];
  
  // Check for high weekend usage
  const weekendDays = data.filter(day => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  });
  
  const weekdayDays = data.filter(day => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  });
  
  const avgWeekendEnergy = weekendDays.reduce((sum, day) => sum + day.totalEnergy, 0) / weekendDays.length;
  const avgWeekdayEnergy = weekdayDays.reduce((sum, day) => sum + day.totalEnergy, 0) / weekdayDays.length;
  
  if (avgWeekendEnergy > avgWeekdayEnergy * 0.7) {
    recommendations.push({
      id: 'rec-1',
      title: 'Reduce Weekend Energy Consumption',
      description: 'Weekend energy usage is higher than expected. Consider adjusting HVAC schedules and equipment power-down procedures on weekends.',
      potentialSavings: Math.round((avgWeekendEnergy - avgWeekdayEnergy * 0.5) * 8 * 4), // Estimated monthly savings
      priority: 'high'
    });
  }
  
  // Check for consistent high nighttime usage in anomalies
  const nighttimeAnomalies = anomalies.filter(anomaly => 
    anomaly.time && (anomaly.time.startsWith('22:') || 
                     anomaly.time.startsWith('23:') || 
                     anomaly.time.startsWith('00:') || 
                     anomaly.time.startsWith('01:') || 
                     anomaly.time.startsWith('02:') || 
                     anomaly.time.startsWith('03:'))
  );
  
  if (nighttimeAnomalies.length >= 2) {
    recommendations.push({
      id: 'rec-2',
      title: 'Investigate Nighttime Energy Usage',
      description: 'Multiple anomalies detected during nighttime hours. This could indicate equipment not properly shutting down or unauthorized usage.',
      potentialSavings: Math.round(nighttimeAnomalies.reduce((sum, a) => sum + (a.totalEnergy - a.expectedValue), 0) * 20), // Estimated monthly savings
      priority: 'medium'
    });
  }
  
  // General recommendations
  recommendations.push({
    id: 'rec-3',
    title: 'Implement Occupancy-Based Lighting Control',
    description: 'Installing occupancy sensors could reduce lighting energy by 20-30% in areas with variable occupancy patterns.',
    potentialSavings: Math.round(data.reduce((sum, day) => sum + day.totalEnergy, 0) / data.length * 0.1 * 30), // 10% of average daily energy * 30 days
    priority: 'medium'
  });
  
  recommendations.push({
    id: 'rec-4',
    title: 'Schedule Regular HVAC Maintenance',
    description: 'Regular cleaning and maintenance of HVAC systems can improve efficiency by 5-10% and extend equipment life.',
    potentialSavings: Math.round(data.reduce((sum, day) => sum + day.totalEnergy, 0) / data.length * 0.07 * 30), // 7% of average daily energy * 30 days
    priority: 'low'
  });
  
  return recommendations;
};

// Generate sample historical data
const generateSampleHistoricalData = (days: number) => {
  const result = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = addDays(today, -i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Add day of week effect
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayFactor = isWeekend ? 0.7 : 1;
    
    // Base energy plus some seasonality and randomness
    const baseEnergy = 2000;
    const seasonalEffect = 200 * Math.sin(i * 0.1);
    const randomEffect = Math.random() * 300 - 150;
    
    // Add an occasional spike for anomaly detection
    const hasSpike = Math.random() > 0.95;
    const spikeEffect = hasSpike ? 500 : 0;
    
    result.push({
      date: dateStr,
      totalEnergy: Math.round((baseEnergy + seasonalEffect + randomEffect + spikeEffect) * dayFactor),
      time: format(date, 'HH:mm')
    });
  }
  
  return result;
};

interface PredictiveAnalyticsProps {
  sensorData: SensorData[];
}

export function PredictiveAnalytics({ sensorData }: PredictiveAnalyticsProps) {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  useEffect(() => {
    // Generate sample historical data
    const sampleData = generateSampleHistoricalData(60); // 60 days of sample data
    setHistoricalData(sampleData);
    
    // Make predictions
    const predictedData = predictEnergyUsage(sampleData, 14); // Predict next 14 days
    setPredictions(predictedData);
    
    // Detect anomalies
    const detectedAnomalies = detectAnomalies(sampleData);
    setAnomalies(detectedAnomalies);
    
    // Generate recommendations
    const energyRecommendations = generateRecommendations(sampleData, detectedAnomalies);
    setRecommendations(energyRecommendations);
  }, []);
  
  // Combine historical and prediction data for the chart
  const combinedData = [
    ...historicalData.slice(-30).map(day => ({ 
      ...day, 
      actual: day.totalEnergy,
      predicted: undefined, 
      lower: undefined, 
      upper: undefined 
    })),
    ...predictions.map(day => ({
      ...day,
      actual: undefined,
    }))
  ];
  
  return (
    <div className="space-y-6">
      {/* Prediction Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          Energy Usage Forecast (Next 14 Days)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#3b82f6" 
                name="Historical Usage (kWh)" 
                strokeWidth={2}
                dot={{ r: 1 }}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#f59e0b" 
                name="Predicted Usage (kWh)" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="upper" 
                stroke="#f59e0b" 
                name="Upper Bound" 
                strokeWidth={1}
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <Line 
                type="monotone" 
                dataKey="lower" 
                stroke="#f59e0b" 
                name="Lower Bound" 
                strokeWidth={1}
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          The prediction model analyzes historical patterns including day of week, usage trends, and seasonal factors.
          Shaded area represents prediction confidence interval (±10%).
        </p>
      </div>
      
      {/* Anomaly Detection */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
          Anomaly Detection
        </h3>
        
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey="totalEnergy" 
                name="Energy Usage" 
                unit=" kWh" 
              />
              <YAxis 
                type="number" 
                dataKey="expectedValue" 
                name="Expected Value" 
                unit=" kWh" 
              />
              <ZAxis 
                type="number" 
                dataKey="index" 
                range={[50, 400]} 
                name="Date" 
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <ReferenceLine x={0} stroke="#666" />
              <ReferenceLine y={0} stroke="#666" />
              <ReferenceLine 
                segment={[{ x: 0, y: 0 }, { x: 5000, y: 5000 }]} 
                stroke="green" 
                strokeDasharray="3 3" 
              />
              <Scatter 
                name="Anomalies" 
                data={anomalies.map((anomaly, index) => ({ ...anomaly, index }))} 
                fill="#ff5252" 
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {anomalies.length > 0 ? (
          <div className="mt-4">
            <h4 className="text-md font-medium mb-2">Detected Anomalies ({anomalies.length})</h4>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    {anomalies.length} unusual energy consumption patterns detected. These may represent 
                    opportunities for energy savings or indicate equipment issues.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-2 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deviation</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {anomalies.slice(0, 5).map((anomaly, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{anomaly.date}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{anomaly.totalEnergy} kWh</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{anomaly.expectedValue} kWh</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {((anomaly.totalEnergy - anomaly.expectedValue) / anomaly.expectedValue * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${anomaly.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                          {anomaly.severity === 'high' ? 'High' : 'Medium'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {anomalies.length > 5 && (
                <div className="px-4 py-2 text-sm text-gray-700">
                  And {anomalies.length - 5} more anomalies...
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  No significant anomalies detected in the recent energy consumption patterns.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Optimization Recommendations */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
          Energy Optimization Recommendations
        </h3>
        
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="border rounded-lg overflow-hidden">
              <div className={`px-4 py-2 text-sm font-medium text-white
                ${rec.priority === 'high' ? 'bg-red-600' :
                  rec.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                {rec.priority === 'high' ? 'High Priority' :
                  rec.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
              </div>
              <div className="p-4">
                <h4 className="text-lg font-medium flex items-center">
                  {rec.title}
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  {rec.description}
                </p>
                <div className="mt-3 flex items-center text-sm">
                  <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="font-medium">Potential Savings:</span>
                  <span className="ml-1 text-green-600">{rec.potentialSavings.toLocaleString()} kWh/month</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 