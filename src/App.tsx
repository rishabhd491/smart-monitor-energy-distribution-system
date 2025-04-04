import React, { useState, useEffect } from 'react';
import { SensorCard } from './components/SensorCard';
import { Dashboard } from './components/Dashboard';
import { PowerManagement } from './components/PowerManagement';
import { AlertManagement } from './components/AlertManagement';
import { HistoricalData } from './components/HistoricalData';
import { PredictiveAnalytics } from './components/PredictiveAnalytics';
import { AdvancedVisualization } from './components/AdvancedVisualization';
import { EnergySavingAutomation } from './components/EnergySavingAutomation';
import { CarbonFootprint } from './components/CarbonFootprint';
import { generateSensorData, calculateBuildingStats, setPowerLimit, checkPowerAlerts } from './utils/sensorSimulator';
import { SensorData, PowerAlert } from './types';
import { GaugeCircle, History, LineChart, Zap, AreaChart, Leaf } from 'lucide-react';

function App() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<PowerAlert[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Initial data load
    setSensorData(generateSensorData());

    // Update data every 5 seconds
    const interval = setInterval(() => {
      const newData = generateSensorData();
      setSensorData(newData);
      const newAlerts = checkPowerAlerts(newData);
      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handlePowerLimitChange = (location: string, limit: number) => {
    setPowerLimit(location, limit);
    setSensorData(generateSensorData());
  };

  const handleUpdateAlert = (alertId: string, updates: Partial<PowerAlert>) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, ...updates } : alert
    ));
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const buildingStats = calculateBuildingStats(sensorData);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <GaugeCircle className="w-8 h-8 text-blue-600" />
            <h1 className="ml-3 text-2xl font-bold text-gray-900">Smart Campus Monitor</h1>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'dashboard' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GaugeCircle className="w-5 h-5 mr-2" />
              Dashboard
            </button>
            
            <button 
              onClick={() => setActiveTab('historical')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'historical' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="w-5 h-5 mr-2" />
              Historical Data
            </button>
            
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'analytics' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LineChart className="w-5 h-5 mr-2" />
              Predictive Analytics
            </button>
            
            <button 
              onClick={() => setActiveTab('visualization')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'visualization' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AreaChart className="w-5 h-5 mr-2" />
              Advanced Visualization
            </button>
            
            <button 
              onClick={() => setActiveTab('energy')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'energy' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Zap className="w-5 h-5 mr-2" />
              Energy Management
            </button>
            
            <button 
              onClick={() => setActiveTab('carbon')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'carbon' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Leaf className="w-5 h-5 mr-2" />
              Carbon Footprint
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <Dashboard sensorData={sensorData} buildingStats={buildingStats} />
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-6">Power Management</h2>
              <PowerManagement 
                sensorData={sensorData}
                onPowerLimitChange={handlePowerLimitChange}
                alerts={alerts.filter(a => a.status === 'active')}
              />
            </div>

            <div className="mt-8">
              <AlertManagement
                alerts={alerts}
                onUpdateAlert={handleUpdateAlert}
                onDismissAlert={handleDismissAlert}
              />
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-6">Sensor Readings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sensorData.map((sensor) => (
                  <SensorCard key={sensor.id} data={sensor} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Historical Data Tab */}
        {activeTab === 'historical' && (
          <div className="mt-4">
            <h2 className="text-2xl font-bold mb-6">Historical Data Analysis</h2>
            <HistoricalData sensorData={sensorData} />
          </div>
        )}

        {/* Predictive Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="mt-4">
            <h2 className="text-2xl font-bold mb-6">Predictive Analytics</h2>
            <PredictiveAnalytics sensorData={sensorData} />
          </div>
        )}

        {/* Advanced Visualization Tab */}
        {activeTab === 'visualization' && (
          <div className="mt-4">
            <h2 className="text-2xl font-bold mb-6">Advanced Visualization</h2>
            <AdvancedVisualization sensorData={sensorData} />
          </div>
        )}

        {/* Energy Management Tab */}
        {activeTab === 'energy' && (
          <div className="mt-4">
            <h2 className="text-2xl font-bold mb-6">Energy Saving Automation</h2>
            <EnergySavingAutomation sensorData={sensorData} />
          </div>
        )}

        {/* Carbon Footprint Tab */}
        {activeTab === 'carbon' && (
          <div className="mt-4">
            <h2 className="text-2xl font-bold mb-6">Carbon Footprint Tracking</h2>
            <CarbonFootprint sensorData={sensorData} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;