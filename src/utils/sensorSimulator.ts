import { SensorData, PowerAlert } from '../types';
import { addMinutes } from 'date-fns';

const LOCATIONS = [
  'Main Hall',
  'Library',
  'Cafeteria',
  'Computer Lab',
  'Auditorium'
];

const powerLimits: Record<string, number> = {};
const powerAdjustmentHistory: Array<{
  timestamp: Date;
  location: string;
  oldLimit: number;
  newLimit: number;
  reason: string;
}> = [];

export function setPowerLimit(location: string, limit: number, reason = 'Manual adjustment') {
  const oldLimit = powerLimits[location] || 0;
  powerLimits[location] = limit;
  powerAdjustmentHistory.push({
    timestamp: new Date(),
    location,
    oldLimit,
    newLimit: limit,
    reason
  });
}

export function getAdjustmentHistory() {
  return powerAdjustmentHistory;
}

export function generateSensorData(): SensorData[] {
  const now = new Date();
  
  return LOCATIONS.map((location, index) => ({
    id: `sensor-${index + 1}`,
    location,
    temperature: 20 + Math.random() * 8, // 20-28°C
    humidity: 30 + Math.random() * 40, // 30-70%
    occupancy: Math.floor(Math.random() * 100),
    energyUsage: 100 + Math.random() * 400, // 100-500 kWh
    timestamp: addMinutes(now, -Math.floor(Math.random() * 30)),
    powerLimit: powerLimits[location] || 0
  }));
}

export function calculateBuildingStats(data: SensorData[]) {
  return {
    totalOccupancy: data.reduce((sum, sensor) => sum + sensor.occupancy, 0),
    averageTemperature: data.reduce((sum, sensor) => sum + sensor.temperature, 0) / data.length,
    totalEnergyUsage: data.reduce((sum, sensor) => sum + sensor.energyUsage, 0)
  };
}

export function redistributePower(data: SensorData[], alert: PowerAlert): boolean {
  const excessPower = alert.currentUsage - alert.limit;
  const otherLocations = data.filter(sensor => 
    sensor.location !== alert.location && 
    sensor.powerLimit > 0 &&
    sensor.energyUsage < sensor.powerLimit
  );

  if (otherLocations.length === 0) return false;

  // Calculate available power from other locations
  const totalAvailablePower = otherLocations.reduce((sum, sensor) => {
    const margin = sensor.powerLimit - sensor.energyUsage;
    return sum + (margin > 0 ? margin * 0.8 : 0); // Take 80% of available margin
  }, 0);

  if (totalAvailablePower < excessPower) return false;

  // Redistribute power proportionally
  otherLocations.forEach(sensor => {
    const margin = sensor.powerLimit - sensor.energyUsage;
    const contribution = (margin / totalAvailablePower) * excessPower;
    const newLimit = Math.max(sensor.energyUsage, sensor.powerLimit - contribution);
    
    setPowerLimit(
      sensor.location, 
      Math.round(newLimit), 
      `Contributed ${Math.round(contribution)} kWh to ${alert.location}`
    );
  });

  // Increase limit for the alerted location
  setPowerLimit(
    alert.location,
    Math.round(alert.currentUsage * 1.1), // Add 10% buffer
    `Received power from other locations`
  );

  return true;
}

export function checkPowerAlerts(data: SensorData[]): PowerAlert[] {
  const alerts = data
    .filter(sensor => sensor.powerLimit && sensor.energyUsage > sensor.powerLimit)
    .map(sensor => ({
      id: `${sensor.id}-${Date.now()}`,
      location: sensor.location,
      currentUsage: sensor.energyUsage,
      limit: sensor.powerLimit,
      timestamp: new Date(),
      status: 'active'
    }));

  // Try to automatically resolve alerts through power redistribution
  alerts.forEach(alert => {
    const resolved = redistributePower(data, alert);
    if (resolved) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      alert.notes = 'Automatically resolved through power redistribution';
    }
  });

  return alerts;
}