import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Zap, History } from 'lucide-react';
import { SensorData, PowerAlert } from '../types';
import { getAdjustmentHistory } from '../utils/sensorSimulator';

interface PowerManagementProps {
  sensorData: SensorData[];
  onPowerLimitChange: (location: string, limit: number) => void;
  alerts: PowerAlert[];
}

export function PowerManagement({ sensorData, onPowerLimitChange, alerts }: PowerManagementProps) {
  const [editingLimit, setEditingLimit] = useState<string>('');
  const [tempLimit, setTempLimit] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);

  const adjustmentHistory = getAdjustmentHistory();

  const handleSubmit = (location: string) => {
    const limit = parseFloat(tempLimit);
    if (!isNaN(limit) && limit > 0) {
      onPowerLimitChange(location, limit);
      setEditingLimit('');
      setTempLimit('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Power Distribution</h3>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
        >
          <History className="w-4 h-4 mr-2" />
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      {showHistory && adjustmentHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h4 className="font-medium mb-4">Power Adjustment History</h4>
          <div className="space-y-3">
            {adjustmentHistory.slice().reverse().map((adjustment, index) => (
              <div key={index} className="text-sm border-l-4 border-blue-200 pl-3">
                <div className="text-gray-600">
                  {adjustment.timestamp.toLocaleTimeString()}
                </div>
                <div>
                  <span className="font-medium">{adjustment.location}</span>: {adjustment.oldLimit} kWh → {adjustment.newLimit} kWh
                </div>
                <div className="text-gray-500 text-sm">{adjustment.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sensorData.map((sensor) => (
          <div key={sensor.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                {sensor.location} Power Usage
              </h3>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Power Limit:</span>
                {editingLimit === sensor.location ? (
                  <div className="flex items-center">
                    <input
                      type="number"
                      className="w-24 px-2 py-1 border rounded mr-2"
                      value={tempLimit}
                      onChange={(e) => setTempLimit(e.target.value)}
                      placeholder="kWh"
                    />
                    <button
                      onClick={() => handleSubmit(sensor.location)}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                    >
                      Set
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingLimit(sensor.location);
                      setTempLimit(sensor.powerLimit?.toString() || '');
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {sensor.powerLimit ? `${sensor.powerLimit} kWh` : 'Set Limit'}
                  </button>
                )}
              </div>
            </div>

            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[sensor]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="energyUsage" stroke="#eab308" name="Current Usage (kWh)" />
                  {sensor.powerLimit && (
                    <Line type="monotone" dataKey="powerLimit" stroke="#ef4444" name="Power Limit (kWh)" strokeDasharray="5 5" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <h4 className="text-lg font-semibold text-red-700">Power Usage Alerts</h4>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="text-red-600">
                {alert.location}: Using {alert.currentUsage.toFixed(1)} kWh (Limit: {alert.limit} kWh)
                <span className="text-sm text-red-500 ml-2">
                  at {alert.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}