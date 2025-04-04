import React, { useState } from 'react';
import { SensorData } from '../types';
import { Timer, User, Zap, PlayCircle, PauseCircle, Calendar, ArrowRight, Settings, CheckCircle, XCircle, Info } from 'lucide-react';

interface Rule {
  id: string;
  name: string;
  condition: {
    type: 'occupancy' | 'temperature' | 'time' | 'energy';
    operator: '>' | '<' | '==' | 'between';
    value: number | [number, number]; // For 'between' operator, we use a tuple
    location?: string;
  };
  action: {
    type: 'adjust_power' | 'notify' | 'shutdown';
    value?: number; // For adjust_power
    target?: string; // Location to target
  };
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  lastTriggered?: Date;
}

interface Schedule {
  id: string;
  name: string;
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  startTime: string;
  endTime: string;
  action: {
    type: 'power_reduction' | 'power_increase' | 'hvac_adjust';
    value: number;
    locations: string[];
  };
  enabled: boolean;
}

// Sample rules
const sampleRules: Rule[] = [
  {
    id: 'rule-1',
    name: 'Low Occupancy Power Saving',
    condition: {
      type: 'occupancy',
      operator: '<',
      value: 10
    },
    action: {
      type: 'adjust_power',
      value: 30, // 30% reduction
    },
    enabled: true,
    priority: 'medium'
  },
  {
    id: 'rule-2',
    name: 'High Temperature Alert',
    condition: {
      type: 'temperature',
      operator: '>',
      value: 28,
      location: 'Computer Lab'
    },
    action: {
      type: 'notify',
      target: 'admin'
    },
    enabled: true,
    priority: 'high',
    lastTriggered: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    id: 'rule-3',
    name: 'Energy Usage Cap',
    condition: {
      type: 'energy',
      operator: '>',
      value: 400,
      location: 'Auditorium'
    },
    action: {
      type: 'adjust_power',
      value: 20,
      target: 'Auditorium'
    },
    enabled: false,
    priority: 'high'
  },
  {
    id: 'rule-4',
    name: 'Optimal Working Hours',
    condition: {
      type: 'time',
      operator: 'between',
      value: [9, 17] // 9 AM to 5 PM
    },
    action: {
      type: 'adjust_power',
      value: -10, // Increase power by 10%
    },
    enabled: true,
    priority: 'low'
  }
];

// Sample schedules
const sampleSchedules: Schedule[] = [
  {
    id: 'schedule-1',
    name: 'Weekend Power Reduction',
    days: ['sat', 'sun'],
    startTime: '00:00',
    endTime: '23:59',
    action: {
      type: 'power_reduction',
      value: 40, // 40% reduction
      locations: ['Main Hall', 'Library', 'Computer Lab']
    },
    enabled: true
  },
  {
    id: 'schedule-2',
    name: 'Night Mode',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    startTime: '19:00',
    endTime: '07:00',
    action: {
      type: 'power_reduction',
      value: 50, // 50% reduction
      locations: ['Main Hall', 'Library', 'Computer Lab', 'Auditorium']
    },
    enabled: true
  },
  {
    id: 'schedule-3',
    name: 'Cafeteria Peak Hours',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    startTime: '11:30',
    endTime: '14:00',
    action: {
      type: 'power_increase',
      value: 20, // 20% increase
      locations: ['Cafeteria']
    },
    enabled: true
  }
];

interface EnergySavingAutomationProps {
  sensorData: SensorData[];
}

export function EnergySavingAutomation({ sensorData }: EnergySavingAutomationProps) {
  const [rules, setRules] = useState<Rule[]>(sampleRules);
  const [schedules, setSchedules] = useState<Schedule[]>(sampleSchedules);
  const [activeTab, setActiveTab] = useState<'rules' | 'schedules' | 'occupancy'>('rules');
  const [optimizationMode, setOptimizationMode] = useState<'balanced' | 'aggressive' | 'conservative'>('balanced');
  
  // Toggle rule enabled state
  const toggleRuleEnabled = (ruleId: string) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };
  
  // Toggle schedule enabled state
  const toggleScheduleEnabled = (scheduleId: string) => {
    setSchedules(schedules.map(schedule => 
      schedule.id === scheduleId ? { ...schedule, enabled: !schedule.enabled } : schedule
    ));
  };
  
  // Check if a rule would be triggered with current sensor data
  const wouldRuleTrigger = (rule: Rule): boolean => {
    // For demo purposes, use some simplified logic
    const relevantSensor = rule.condition.location 
      ? sensorData.find(s => s.location === rule.condition.location)
      : sensorData[0]; // Just use first sensor if no location specified
    
    if (!relevantSensor) return false;
    
    switch (rule.condition.type) {
      case 'occupancy':
        return evaluateCondition(relevantSensor.occupancy, rule.condition.operator, rule.condition.value);
      case 'temperature':
        return evaluateCondition(relevantSensor.temperature, rule.condition.operator, rule.condition.value);
      case 'energy':
        return evaluateCondition(relevantSensor.energyUsage, rule.condition.operator, rule.condition.value);
      case 'time':
        const now = new Date();
        const hour = now.getHours();
        if (rule.condition.operator === 'between' && Array.isArray(rule.condition.value)) {
          return hour >= rule.condition.value[0] && hour <= rule.condition.value[1];
        }
        return false;
      default:
        return false;
    }
  };
  
  // Helper to evaluate conditions
  const evaluateCondition = (actual: number, operator: string, expected: number | [number, number]): boolean => {
    if (Array.isArray(expected)) return false; // Skip complex comparisons for simplicity
    
    switch (operator) {
      case '>': return actual > expected;
      case '<': return actual < expected;
      case '==': return actual === expected;
      default: return false;
    }
  };
  
  // Check if a schedule is currently active
  const isScheduleActive = (schedule: Schedule): boolean => {
    const now = new Date();
    const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
    
    if (!schedule.days.includes(day as any)) return false;
    
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
  };
  
  // Calculate potential energy savings
  const calculatePotentialSavings = (): number => {
    const baseEnergy = sensorData.reduce((sum, sensor) => sum + sensor.energyUsage, 0);
    
    // Calculate savings from enabled rules
    const ruleSavings = rules
      .filter(rule => rule.enabled && rule.action.type === 'adjust_power' && rule.action.value && rule.action.value > 0)
      .reduce((sum, rule) => {
        // Simplified calculation
        const savings = wouldRuleTrigger(rule) ? baseEnergy * (rule.action.value as number) / 100 : 0;
        return sum + savings;
      }, 0);
    
    // Calculate savings from enabled schedules
    const scheduleSavings = schedules
      .filter(schedule => schedule.enabled && schedule.action.type === 'power_reduction')
      .reduce((sum, schedule) => {
        const savings = isScheduleActive(schedule) ? 
          sensorData
            .filter(sensor => schedule.action.locations.includes(sensor.location))
            .reduce((locSum, sensor) => locSum + sensor.energyUsage * schedule.action.value / 100, 0) : 0;
        return sum + savings;
      }, 0);
    
    return Math.round(ruleSavings + scheduleSavings);
  };
  
  // Calculate occupancy-based savings
  const occupancyBasedSavings = (): { location: string, saving: number, adjustmentFactor: number }[] => {
    return sensorData.map(sensor => {
      // Calculate adjustment factor based on occupancy (simplified)
      // Lower occupancy = higher savings potential
      const maxOccupancy = 100; // Assumed maximum
      const occupancyRatio = sensor.occupancy / maxOccupancy;
      
      // More aggressive savings for low occupancy areas
      let adjustmentFactor: number;
      
      switch (optimizationMode) {
        case 'aggressive':
          adjustmentFactor = Math.max(0.1, 0.7 - occupancyRatio * 0.6);
          break;
        case 'conservative':
          adjustmentFactor = Math.max(0.05, 0.4 - occupancyRatio * 0.3);
          break;
        default: // balanced
          adjustmentFactor = Math.max(0.08, 0.5 - occupancyRatio * 0.4);
          break;
      }
      
      const saving = Math.round(sensor.energyUsage * adjustmentFactor);
      
      return {
        location: sensor.location,
        saving,
        adjustmentFactor: Math.round(adjustmentFactor * 100) // Convert to percentage
      };
    }).sort((a, b) => b.saving - a.saving); // Sort by highest savings
  };
  
  const renderRulesTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Automation Rules</h3>
          <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm flex items-center">
            <Settings className="w-4 h-4 mr-1" />
            Add Rule
          </button>
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Rules automatically adjust power usage based on conditions like occupancy, temperature, 
                time of day, or energy consumption thresholds.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className={`border rounded-lg overflow-hidden ${
              wouldRuleTrigger(rule) && rule.enabled ? 'border-green-300 bg-green-50' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center">
                  <div className={`h-8 w-8 flex items-center justify-center rounded-full mr-3 ${
                    rule.priority === 'high' ? 'bg-red-100 text-red-600' : 
                    rule.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {rule.priority === 'high' ? 'H' : rule.priority === 'medium' ? 'M' : 'L'}
                  </div>
                  <div>
                    <h4 className="font-medium">{rule.name}</h4>
                    <p className="text-sm text-gray-500">
                      {rule.condition.type === 'occupancy' && `Occupancy ${rule.condition.operator} ${rule.condition.value}`}
                      {rule.condition.type === 'temperature' && `Temperature ${rule.condition.operator} ${rule.condition.value}°C`}
                      {rule.condition.type === 'energy' && `Energy usage ${rule.condition.operator} ${rule.condition.value} kWh`}
                      {rule.condition.type === 'time' && rule.condition.operator === 'between' && 
                       Array.isArray(rule.condition.value) && 
                       `Time between ${rule.condition.value[0]}:00 and ${rule.condition.value[1]}:00`}
                      {rule.condition.location && ` in ${rule.condition.location}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {wouldRuleTrigger(rule) && rule.enabled && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Active
                    </span>
                  )}
                  <button 
                    onClick={() => toggleRuleEnabled(rule.id)} 
                    className={`h-6 w-12 rounded-full flex items-center ${
                      rule.enabled ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <span className="h-4 w-4 bg-white rounded-full block mx-1"></span>
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {rule.action.type === 'adjust_power' && `Adjust power by ${rule.action.value}%`}
                    {rule.action.type === 'notify' && `Send notification to ${rule.action.target}`}
                    {rule.action.type === 'shutdown' && 'Shut down system'}
                    {rule.action.target && rule.action.type === 'adjust_power' && ` in ${rule.action.target}`}
                  </span>
                  {rule.lastTriggered && (
                    <span className="text-gray-500">
                      Last triggered: {new Date(rule.lastTriggered).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderSchedulesTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Power Schedules</h3>
          <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Add Schedule
          </button>
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Schedules allow you to automatically adjust power usage based on time of day and day of week,
                perfect for managing energy usage during non-business hours.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {schedules.map(schedule => (
            <div key={schedule.id} className={`border rounded-lg overflow-hidden ${
              isScheduleActive(schedule) && schedule.enabled ? 'border-green-300 bg-green-50' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center">
                  <div className={`h-8 w-8 flex items-center justify-center rounded-full mr-3 bg-indigo-100 text-indigo-600`}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">{schedule.name}</h4>
                    <p className="text-sm text-gray-500">
                      {schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')} • 
                      {schedule.startTime} - {schedule.endTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {isScheduleActive(schedule) && schedule.enabled && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Active
                    </span>
                  )}
                  <button 
                    onClick={() => toggleScheduleEnabled(schedule.id)}
                    className={`h-6 w-12 rounded-full flex items-center ${
                      schedule.enabled ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <span className="h-4 w-4 bg-white rounded-full block mx-1"></span>
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex items-center justify-between text-sm">
                <span>
                  {schedule.action.type === 'power_reduction' && `Reduce power by ${schedule.action.value}%`}
                  {schedule.action.type === 'power_increase' && `Increase power by ${schedule.action.value}%`}
                  {schedule.action.type === 'hvac_adjust' && `Adjust HVAC by ${schedule.action.value}°C`}
                </span>
                <span className="text-gray-500">
                  Affects: {schedule.action.locations.join(', ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderOccupancyTab = () => {
    const occupancySavings = occupancyBasedSavings();
    const totalPotentialSavings = occupancySavings.reduce((sum, item) => sum + item.saving, 0);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Occupancy-Based Optimization</h3>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Mode:</span>
            <select 
              value={optimizationMode}
              onChange={(e) => setOptimizationMode(e.target.value as any)}
              className="text-sm border-gray-300 rounded-md"
            >
              <option value="conservative">Conservative</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Occupancy-based optimization dynamically adjusts power usage based on the number of people in each location.
                Areas with fewer people receive more aggressive energy-saving measures.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Potential Energy Savings by Location</h4>
              <div className="text-sm text-gray-500">
                Total: <span className="font-semibold text-green-600">{totalPotentialSavings} kWh</span>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {occupancySavings.map((item) => (
              <div key={item.location} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-3">
                    <User className={`h-5 w-5 ${
                      item.adjustmentFactor > 30 ? 'text-green-500' : 
                      item.adjustmentFactor > 15 ? 'text-yellow-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium">{item.location}</div>
                    <div className="text-sm text-gray-500">
                      Current occupancy: {sensorData.find(s => s.location === item.location)?.occupancy || 0} people
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-right mr-4">
                    <div className="font-semibold text-green-600">{item.saving} kWh</div>
                    <div className="text-sm text-gray-500">{item.adjustmentFactor}% reduction</div>
                  </div>
                  <button className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-sm flex items-center">
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Status panel */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <div className="mr-3 bg-blue-100 text-blue-600 p-2 rounded-full">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Potential Energy Savings</div>
              <div className="text-xl font-semibold">{calculatePotentialSavings()} kWh</div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="mr-3 bg-green-100 text-green-600 p-2 rounded-full">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Active Rules</div>
              <div className="text-xl font-semibold">
                {rules.filter(r => r.enabled && wouldRuleTrigger(r)).length} / {rules.filter(r => r.enabled).length}
              </div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-indigo-50 rounded-lg">
            <div className="mr-3 bg-indigo-100 text-indigo-600 p-2 rounded-full">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Active Schedules</div>
              <div className="text-xl font-semibold">
                {schedules.filter(s => s.enabled && isScheduleActive(s)).length} / {schedules.filter(s => s.enabled).length}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Automation Rules
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Power Schedules
          </button>
          <button
            onClick={() => setActiveTab('occupancy')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'occupancy'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Occupancy Optimization
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="bg-white rounded-lg shadow p-4">
        {activeTab === 'rules' && renderRulesTab()}
        {activeTab === 'schedules' && renderSchedulesTab()}
        {activeTab === 'occupancy' && renderOccupancyTab()}
      </div>
    </div>
  );
} 