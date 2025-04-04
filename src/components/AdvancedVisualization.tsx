import React, { useState } from 'react';
import { SensorData } from '../types';
import { Layers, Thermometer, Users, Grid, Zap } from 'lucide-react';

// Mock floor plan coordinates for sensors
const FLOOR_PLAN = {
  width: 800,
  height: 600,
  rooms: [
    { id: 'main-hall', name: 'Main Hall', x: 50, y: 50, width: 300, height: 200 },
    { id: 'library', name: 'Library', x: 400, y: 50, width: 350, height: 200 },
    { id: 'cafeteria', name: 'Cafeteria', x: 50, y: 300, width: 250, height: 250 },
    { id: 'computer-lab', name: 'Computer Lab', x: 350, y: 300, width: 200, height: 150 },
    { id: 'auditorium', name: 'Auditorium', x: 600, y: 300, width: 150, height: 250 }
  ],
  // Paths represent hallways/connections
  paths: [
    { x1: 200, y1: 250, x2: 200, y2: 300 },
    { x1: 400, y1: 150, x2: 350, y2: 150 },
    { x1: 450, y1: 250, x2: 450, y2: 300 },
    { x1: 550, y1: 300, x2: 600, y2: 300 }
  ]
};

interface AdvancedVisualizationProps {
  sensorData: SensorData[];
}

export function AdvancedVisualization({ sensorData }: AdvancedVisualizationProps) {
  const [visualizationType, setVisualizationType] = useState<'heatmap' | 'floorplan' | '3d'>('heatmap');
  const [dataType, setDataType] = useState<'temperature' | 'occupancy' | 'energy'>('temperature');
  
  // Calculate color for heatmap cells based on data type and value
  const getColor = (value: number, type: 'temperature' | 'occupancy' | 'energy') => {
    if (type === 'temperature') {
      // Blue (cold) to red (hot)
      const normalizedValue = Math.min(Math.max((value - 18) / 12, 0), 1); // 18-30°C range
      const hue = (1 - normalizedValue) * 240; // 240 (blue) to 0 (red)
      return `hsl(${hue}, 100%, 50%)`;
    } else if (type === 'occupancy') {
      // Light to dark green
      const normalizedValue = Math.min(Math.max(value / 100, 0), 1); // 0-100 range
      return `rgba(0, 128, 0, ${0.2 + normalizedValue * 0.8})`;
    } else { // energy
      // Yellow to red
      const normalizedValue = Math.min(Math.max(value / 500, 0), 1); // 0-500 kWh range
      const hue = 60 - normalizedValue * 60; // 60 (yellow) to 0 (red)
      return `hsl(${hue}, 100%, 50%)`;
    }
  };
  
  // Find sensor data for a specific location
  const getSensorByLocation = (location: string) => {
    return sensorData.find(sensor => sensor.location === location) || null;
  };
  
  // Render temperature heatmap
  const renderHeatmap = () => {
    const gridSize = 10;
    const cells = [];
    
    // Create grid cells with interpolated values
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        // Calculate distance-weighted values from all sensors
        let totalWeight = 0;
        let weightedValue = 0;
        
        sensorData.forEach(sensor => {
          // Map sensor locations to grid positions (simplified)
          const sensorX = sensor.location === 'Main Hall' ? 2 : 
                          sensor.location === 'Library' ? 7 : 
                          sensor.location === 'Cafeteria' ? 3 : 
                          sensor.location === 'Computer Lab' ? 6 : 8;
          
          const sensorY = sensor.location === 'Main Hall' ? 2 : 
                          sensor.location === 'Library' ? 2 : 
                          sensor.location === 'Cafeteria' ? 7 : 
                          sensor.location === 'Computer Lab' ? 6 : 8;
          
          // Calculate inverse squared distance (avoid division by zero)
          const dx = x - sensorX;
          const dy = y - sensorY;
          const distSquared = dx * dx + dy * dy;
          const weight = 1 / (distSquared + 0.1);
          
          totalWeight += weight;
          
          // Get value based on selected data type
          const value = dataType === 'temperature' ? sensor.temperature :
                        dataType === 'occupancy' ? sensor.occupancy : 
                        sensor.energyUsage;
          
          weightedValue += value * weight;
        });
        
        // Calculate final interpolated value
        const value = weightedValue / totalWeight;
        
        cells.push(
          <div 
            key={`${x}-${y}`}
            className="absolute rounded-sm border border-gray-100"
            style={{
              left: `${x * 10}%`,
              top: `${y * 10}%`,
              width: '10%',
              height: '10%',
              backgroundColor: getColor(value, dataType),
              opacity: 0.8
            }}
          />
        );
      }
    }
    
    // Add legend
    const legend = (
      <div className="absolute bottom-2 right-2 bg-white p-2 rounded shadow-md">
        <div className="text-xs font-medium mb-1">
          {dataType === 'temperature' ? 'Temperature (°C)' : 
           dataType === 'occupancy' ? 'Occupancy (%)' : 
           'Energy Usage (kWh)'}
        </div>
        <div className="flex items-center">
          <div className="w-full h-2 rounded-full" style={{ 
            background: dataType === 'temperature' ? 
              'linear-gradient(to right, blue, red)' : 
              dataType === 'occupancy' ? 
              'linear-gradient(to right, rgba(0,128,0,0.2), rgba(0,128,0,1))' : 
              'linear-gradient(to right, yellow, red)'
          }}/>
          <div className="flex justify-between w-full text-xs mt-1">
            <span>
              {dataType === 'temperature' ? '18°C' : 
               dataType === 'occupancy' ? '0%' : 
               '0 kWh'}
            </span>
            <span>
              {dataType === 'temperature' ? '30°C' : 
               dataType === 'occupancy' ? '100%' : 
               '500 kWh'}
            </span>
          </div>
        </div>
      </div>
    );
    
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">Building Heatmap</h3>
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
          {cells}
          {legend}
        </div>
      </div>
    );
  };
  
  // Render floor plan with sensor data
  const renderFloorPlan = () => {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">Building Floor Plan</h3>
        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ 
          width: '100%', 
          height: '500px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {/* Building outline */}
          <svg width="100%" height="100%" viewBox={`0 0 ${FLOOR_PLAN.width} ${FLOOR_PLAN.height}`} className="absolute inset-0">
            {/* Hallways/paths */}
            {FLOOR_PLAN.paths.map((path, index) => (
              <line 
                key={`path-${index}`}
                x1={path.x1} 
                y1={path.y1} 
                x2={path.x2} 
                y2={path.y2}
                stroke="#aaa"
                strokeWidth="10"
                strokeLinecap="round"
              />
            ))}
            
            {/* Rooms */}
            {FLOOR_PLAN.rooms.map(room => {
              const sensorData = getSensorByLocation(room.name);
              const fillColor = sensorData ? 
                getColor(
                  dataType === 'temperature' ? sensorData.temperature :
                  dataType === 'occupancy' ? sensorData.occupancy :
                  sensorData.energyUsage,
                  dataType
                ) : 
                '#f9fafb';
              
              return (
                <g key={room.id}>
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.width}
                    height={room.height}
                    rx="5"
                    ry="5"
                    fill={fillColor}
                    stroke="#666"
                    strokeWidth="2"
                  />
                  <text
                    x={room.x + room.width/2}
                    y={room.y + room.height/2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#333"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {room.name}
                  </text>
                  
                  {sensorData && (
                    <text
                      x={room.x + room.width/2}
                      y={room.y + room.height/2 + 20}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#333"
                      fontSize="12"
                    >
                      {dataType === 'temperature' && `${sensorData.temperature.toFixed(1)}°C`}
                      {dataType === 'occupancy' && `${sensorData.occupancy} people`}
                      {dataType === 'energy' && `${sensorData.energyUsage.toFixed(0)} kWh`}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };
  
  // Render 3D visualization (simplified with CSS transforms)
  const render3D = () => {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">3D Building Visualization</h3>
        <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ width: '100%', height: '500px' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[400px] h-[300px] transform-gpu preserve-3d" style={{ 
              transformStyle: 'preserve-3d',
              transform: 'rotateX(60deg) rotateZ(-30deg)',
            }}>
              {/* Base platform */}
              <div className="absolute w-[400px] h-[300px] transform-gpu bg-gray-400 rounded-lg" style={{ 
                transform: 'translateZ(0px)',
                boxShadow: '0 0 20px rgba(0,0,0,0.3)'
              }}></div>
              
              {/* Buildings */}
              {FLOOR_PLAN.rooms.map(room => {
                const sensorData = getSensorByLocation(room.name);
                const height = sensorData ? 
                  dataType === 'temperature' ? Math.max(20, sensorData.temperature * 5) :
                  dataType === 'occupancy' ? Math.max(20, sensorData.occupancy) :
                  Math.max(20, sensorData.energyUsage / 5) : 20;
                
                const color = sensorData ? 
                  getColor(
                    dataType === 'temperature' ? sensorData.temperature :
                    dataType === 'occupancy' ? sensorData.occupancy :
                    sensorData.energyUsage,
                    dataType
                  ) : 
                  'rgba(200, 200, 200, 0.8)';
                
                // Scale room coordinates to our 3D view
                const x = (room.x / FLOOR_PLAN.width) * 400 - 200 + (room.width / FLOOR_PLAN.width) * 200;
                const y = (room.y / FLOOR_PLAN.height) * 300 - 150 + (room.height / FLOOR_PLAN.height) * 150;
                const width = (room.width / FLOOR_PLAN.width) * 400;
                const depth = (room.height / FLOOR_PLAN.height) * 300;
                
                return (
                  <div key={room.id} className="absolute rounded transform-gpu" style={{ 
                    width: `${width}px`,
                    height: `${depth}px`,
                    transform: `translate(${x - width/2}px, ${y - depth/2}px) translateZ(${height}px)`,
                    backgroundColor: color,
                    boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '10px',
                    color: '#333',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    <div>{room.name}</div>
                    {sensorData && (
                      <div>
                        {dataType === 'temperature' && `${sensorData.temperature.toFixed(1)}°C`}
                        {dataType === 'occupancy' && `${sensorData.occupancy} people`}
                        {dataType === 'energy' && `${sensorData.energyUsage.toFixed(0)} kWh`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="absolute bottom-4 left-4 text-white text-sm">
            <div className="mb-1 italic font-light">
              Note: This is a simplified 3D visualization using CSS transforms
            </div>
            <div>
              Building heights represent {dataType === 'temperature' ? 'temperature levels' : 
                dataType === 'occupancy' ? 'occupancy levels' : 'energy usage'}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Visualization type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visualization Type</label>
            <div className="flex space-x-1">
              <button
                onClick={() => setVisualizationType('heatmap')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  visualizationType === 'heatmap' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-4 h-4 mr-1" />
                Heatmap
              </button>
              <button
                onClick={() => setVisualizationType('floorplan')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  visualizationType === 'floorplan' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Layers className="w-4 h-4 mr-1" />
                Floor Plan
              </button>
              <button
                onClick={() => setVisualizationType('3d')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  visualizationType === '3d' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12L20 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12L4 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                3D View
              </button>
            </div>
          </div>
          
          {/* Data type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
            <div className="flex space-x-1">
              <button
                onClick={() => setDataType('temperature')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  dataType === 'temperature' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Thermometer className="w-4 h-4 mr-1" />
                Temperature
              </button>
              <button
                onClick={() => setDataType('occupancy')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  dataType === 'occupancy' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4 mr-1" />
                Occupancy
              </button>
              <button
                onClick={() => setDataType('energy')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  dataType === 'energy' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Zap className="w-4 h-4 mr-1" />
                Energy
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Render selected visualization */}
      {visualizationType === 'heatmap' && renderHeatmap()}
      {visualizationType === 'floorplan' && renderFloorPlan()}
      {visualizationType === '3d' && render3D()}
      
      {/* Info panel */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-2">About this Visualization</h3>
        <p className="text-sm text-gray-600">
          {visualizationType === 'heatmap' && 
            'This heatmap uses interpolation to estimate values between sensor points, providing a continuous visualization of data across the entire building. Areas with similar values are shown in similar colors.'}
          {visualizationType === 'floorplan' && 
            'The floor plan visualization shows the actual layout of the building with rooms colored according to their current sensor readings. This helps to understand the spatial relationship between different areas and their measurements.'}
          {visualizationType === '3d' && 
            'The 3D visualization represents the building with extruded heights corresponding to measurement values. Higher values result in taller representations, providing an intuitive way to compare values across different locations.'}
        </p>
      </div>
    </div>
  );
} 