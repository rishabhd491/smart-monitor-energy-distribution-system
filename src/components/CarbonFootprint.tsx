import React, { useState, useEffect } from 'react';
import { SensorData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Leaf, Target, FileText, TrendingDown, Award, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';

// Constants for carbon conversion
const CARBON_FACTORS = {
  electricity: 0.5, // kg CO2 per kWh (average grid)
  natural_gas: 0.2, // kg CO2 per kWh equivalent
  renewable: 0.02 // kg CO2 per kWh (minimal for solar/wind)
};

// Energy mix assumptions (for demo)
const ENERGY_MIX = {
  electricity: 0.65, // 65% from grid
  natural_gas: 0.25, // 25% from natural gas
  renewable: 0.1 // 10% from renewables
};

// Sample historical data generator
const generateHistoricalData = (days: number, trend: 'increasing' | 'decreasing' | 'stable' = 'stable') => {
  const data = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'MMM dd');
    
    // Base value with some variance
    let baseFactor = 1;
    if (trend === 'increasing') baseFactor = 1 + (days - i) / days * 0.3; // Up to 30% increase
    if (trend === 'decreasing') baseFactor = 1 - (days - i) / days * 0.3; // Up to 30% decrease
    
    // Weekend adjustment
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const weekendFactor = isWeekend ? 0.7 : 1;
    
    // Random factor
    const randomFactor = 0.9 + Math.random() * 0.2; // ±10%
    
    // Calculate energy and emissions
    const energyUsage = Math.round(2500 * baseFactor * weekendFactor * randomFactor);
    const emissions = Math.round(
      energyUsage * (
        ENERGY_MIX.electricity * CARBON_FACTORS.electricity +
        ENERGY_MIX.natural_gas * CARBON_FACTORS.natural_gas +
        ENERGY_MIX.renewable * CARBON_FACTORS.renewable
      )
    );
    
    data.push({
      date: dateStr,
      energy: energyUsage,
      emissions,
      gridEmissions: Math.round(energyUsage * ENERGY_MIX.electricity * CARBON_FACTORS.electricity),
      gasEmissions: Math.round(energyUsage * ENERGY_MIX.natural_gas * CARBON_FACTORS.natural_gas),
      renewableEmissions: Math.round(energyUsage * ENERGY_MIX.renewable * CARBON_FACTORS.renewable)
    });
  }
  
  return data;
};

// Sample sustainability goals
const GOALS = [
  { 
    id: 'goal-1', 
    name: 'Reduce Carbon Emissions', 
    target: 15, // 15% reduction
    current: 7,
    deadline: '2023-12-31',
    unit: '%',
    description: 'Reduce overall carbon emissions by 15% compared to 2022 baseline.'
  },
  { 
    id: 'goal-2', 
    name: 'Increase Renewable Energy', 
    target: 25, // 25% of total energy
    current: 10,
    deadline: '2023-12-31',
    unit: '%',
    description: 'Increase renewable energy sources to 25% of total energy consumption.'
  },
  { 
    id: 'goal-3', 
    name: 'Energy Optimization', 
    target: 10, // 10% reduction
    current: 8,
    deadline: '2023-12-31',
    unit: '%',
    description: 'Optimize energy usage to achieve 10% reduction in overall consumption.'
  }
];

interface CarbonFootprintProps {
  sensorData: SensorData[];
}

export function CarbonFootprint({ sensorData }: CarbonFootprintProps) {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [emissionTrend, setEmissionTrend] = useState<'increasing' | 'decreasing' | 'stable'>('decreasing');
  const [totalEmissions, setTotalEmissions] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'reports'>('overview');
  const [energyMix, setEnergyMix] = useState(ENERGY_MIX);
  const [goals, setGoals] = useState(GOALS);
  
  useEffect(() => {
    const data = generateHistoricalData(30, emissionTrend);
    setHistoricalData(data);
    
    // Calculate total emissions from current data
    const currentEmissions = sensorData.reduce((sum, sensor) => {
      const emissions = sensor.energyUsage * (
        energyMix.electricity * CARBON_FACTORS.electricity +
        energyMix.natural_gas * CARBON_FACTORS.natural_gas +
        energyMix.renewable * CARBON_FACTORS.renewable
      );
      return sum + emissions;
    }, 0);
    
    setTotalEmissions(Math.round(currentEmissions));
  }, [sensorData, emissionTrend, energyMix]);
  
  // Calculate current emissions by location
  const emissionsByLocation = sensorData.map(sensor => ({
    name: sensor.location,
    value: Math.round(sensor.energyUsage * (
      energyMix.electricity * CARBON_FACTORS.electricity +
      energyMix.natural_gas * CARBON_FACTORS.natural_gas +
      energyMix.renewable * CARBON_FACTORS.renewable
    ))
  })).sort((a, b) => b.value - a.value);
  
  // Calculate emissions breakdown by source
  const emissionsBySource = [
    { name: 'Grid Electricity', value: Math.round(totalEmissions * (energyMix.electricity * CARBON_FACTORS.electricity) / (
      energyMix.electricity * CARBON_FACTORS.electricity +
      energyMix.natural_gas * CARBON_FACTORS.natural_gas +
      energyMix.renewable * CARBON_FACTORS.renewable
    )) },
    { name: 'Natural Gas', value: Math.round(totalEmissions * (energyMix.natural_gas * CARBON_FACTORS.natural_gas) / (
      energyMix.electricity * CARBON_FACTORS.electricity +
      energyMix.natural_gas * CARBON_FACTORS.natural_gas +
      energyMix.renewable * CARBON_FACTORS.renewable
    )) },
    { name: 'Renewable Energy', value: Math.round(totalEmissions * (energyMix.renewable * CARBON_FACTORS.renewable) / (
      energyMix.electricity * CARBON_FACTORS.electricity +
      energyMix.natural_gas * CARBON_FACTORS.natural_gas +
      energyMix.renewable * CARBON_FACTORS.renewable
    )) }
  ];

  // Forecast future emissions (simplified)
  const forecastEmissions = () => {
    const lastEmission = historicalData[historicalData.length - 1]?.emissions || 0;
    const forecast = [];
    
    // Project 14 days into future
    for (let i = 1; i <= 14; i++) {
      const date = addDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      
      // Apply trend and some randomness
      let trendFactor = 1;
      if (emissionTrend === 'increasing') trendFactor = 1 + (i / 14) * 0.2; // Up to 20% increase
      if (emissionTrend === 'decreasing') trendFactor = 1 - (i / 14) * 0.2; // Up to 20% decrease
      
      const randomFactor = 0.95 + Math.random() * 0.1; // ±5%
      const forecasted = Math.round(lastEmission * trendFactor * randomFactor);
      
      forecast.push({
        date: dateStr,
        forecasted
      });
    }
    
    return forecast;
  };
  
  const renderOverviewTab = () => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    const forecast = forecastEmissions();
    
    // Calculate year-to-date and projected annual emissions
    const dailyAverage = historicalData.reduce((sum, day) => sum + day.emissions, 0) / historicalData.length;
    const annualProjection = Math.round(dailyAverage * 365);
    const ytdEmissions = Math.round(dailyAverage * (new Date().getMonth() * 30 + new Date().getDate()));
    
    // Combine historical and forecast data for chart
    const combinedData = [
      ...historicalData.slice(-14), // Last 14 days of historical data
      ...forecast
    ];
    
    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Current Carbon Emissions</p>
                <p className="text-2xl font-semibold mt-1">{totalEmissions} kg CO₂e</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full text-green-600">
                <Leaf className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              {emissionTrend === 'decreasing' && (
                <span className="text-green-600 flex items-center">
                  <ArrowDown className="h-4 w-4 mr-1" />
                  Decreasing
                </span>
              )}
              {emissionTrend === 'increasing' && (
                <span className="text-red-600 flex items-center">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Increasing
                </span>
              )}
              {emissionTrend === 'stable' && (
                <span className="text-gray-600">
                  Stable
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Year-to-Date Emissions</p>
                <p className="text-2xl font-semibold mt-1">{ytdEmissions.toLocaleString()} kg CO₂e</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Projected annual: {annualProjection.toLocaleString()} kg CO₂e
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Sustainability Goals</p>
                <p className="text-2xl font-semibold mt-1">{goals.filter(g => g.current >= g.target).length}/{goals.length}</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                <Target className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {Math.round(goals.reduce((sum, g) => sum + (g.current / g.target) * 100, 0) / goals.length)}% average completion
            </div>
          </div>
        </div>
        
        {/* Emissions chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-4">Carbon Emissions Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="emissions" 
                  name="Historical Emissions (kg CO₂e)" 
                  fill="#4ADE80" 
                  stroke="#22C55E" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="forecasted" 
                  name="Forecasted Emissions (kg CO₂e)" 
                  fill="#93C5FD" 
                  stroke="#3B82F6" 
                  fillOpacity={0.6}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Emissions by location & source */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Emissions by Location</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emissionsByLocation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="CO₂ Emissions (kg)" fill="#22C55E" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Emissions by Source</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emissionsBySource}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {emissionsBySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} kg CO₂e`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-4">Sustainability Recommendations</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full text-green-600 mr-3">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">Increase Renewable Energy Sources</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Increasing renewable energy sources by just 10% could reduce your carbon emissions by approximately {Math.round(totalEmissions * 0.1 * (CARBON_FACTORS.electricity - CARBON_FACTORS.renewable))} kg CO₂e.
                  </p>
                  <button className="mt-2 text-sm text-blue-600 flex items-center">
                    View renewable options <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full text-green-600 mr-3">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">Optimize Off-Hours Energy Usage</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Implementing stricter power-down procedures during off-hours could reduce emissions by up to 15% in low-occupancy periods, saving approximately {Math.round(totalEmissions * 0.15)} kg CO₂e.
                  </p>
                  <button className="mt-2 text-sm text-blue-600 flex items-center">
                    Set up schedules <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderGoalsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Sustainability Goals</h3>
          <button className="px-3 py-1 bg-green-50 text-green-600 rounded-md text-sm flex items-center">
            <Target className="w-4 h-4 mr-1" />
            Add Goal
          </button>
        </div>
        
        <div className="space-y-4">
          {goals.map(goal => {
            const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
            const remaining = Math.max(0, goal.target - goal.current);
            const daysLeft = Math.round((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={goal.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="font-medium">{goal.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
                    <div 
                      className={`h-2.5 rounded-full ${
                        progress >= 100 ? 'bg-green-600' : progress > 60 ? 'bg-yellow-400' : 'bg-red-500'
                      }`} 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center mt-4">
                    <div>
                      <div className="text-xs text-gray-500">Current</div>
                      <div className="font-medium">{goal.current}{goal.unit}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Target</div>
                      <div className="font-medium">{goal.target}{goal.unit}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Remaining</div>
                      <div className="font-medium">{remaining}{goal.unit}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Deadline: {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                  <span className={`text-sm ${daysLeft < 30 ? 'text-red-600' : 'text-gray-500'}`}>
                    {daysLeft} days left
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  const renderReportsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Sustainability Reports</h3>
          <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            Generate Report
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h4 className="font-medium">Available Reports</h4>
            <p className="text-sm text-gray-500 mt-1">
              View and download sustainability reports
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {[
              { id: 1, name: 'Monthly Sustainability Report', date: '2023-03-01', type: 'monthly' },
              { id: 2, name: 'Quarterly Carbon Emissions', date: '2023-01-01', type: 'quarterly' },
              { id: 3, name: 'Annual Sustainability Overview', date: '2022-12-31', type: 'annual' },
            ].map(report => (
              <div key={report.id} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{report.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(report.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="space-x-2">
                  <button className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-sm">
                    View
                  </button>
                  <button className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-sm">
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h4 className="font-medium">Emission Offsets</h4>
            <p className="text-sm text-gray-500 mt-1">
              Track carbon offsets and sustainability initiatives
            </p>
          </div>
          
          <div className="p-4">
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Leaf className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Your current sustainability initiatives have offset approximately 
                    <span className="font-semibold"> 12,500 kg CO₂e</span> this year.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 space-y-4">
              <div className="border rounded-lg p-3">
                <div className="font-medium">Renewable Energy Purchases</div>
                <div className="text-sm text-gray-600 mt-1">8,200 kg CO₂e offset</div>
              </div>
              
              <div className="border rounded-lg p-3">
                <div className="font-medium">Energy Efficiency Projects</div>
                <div className="text-sm text-gray-600 mt-1">3,500 kg CO₂e offset</div>
              </div>
              
              <div className="border rounded-lg p-3">
                <div className="font-medium">Carbon Credit Purchases</div>
                <div className="text-sm text-gray-600 mt-1">800 kg CO₂e offset</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Carbon Overview
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'goals'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sustainability Goals
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports & Offsets
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'goals' && renderGoalsTab()}
      {activeTab === 'reports' && renderReportsTab()}
    </div>
  );
} 