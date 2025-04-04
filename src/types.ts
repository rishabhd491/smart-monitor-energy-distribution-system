export interface SensorData {
  id: string;
  location: string;
  temperature: number;
  humidity: number;
  occupancy: number;
  energyUsage: number;
  timestamp: Date;
  powerLimit: number;
}

export interface BuildingStats {
  totalOccupancy: number;
  averageTemperature: number;
  totalEnergyUsage: number;
}

export interface PowerAlert {
  id: string;
  location: string;
  currentUsage: number;
  limit: number;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  notes?: string;
}