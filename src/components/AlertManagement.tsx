import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, MessageSquare, X } from 'lucide-react';
import { PowerAlert } from '../types';

interface AlertManagementProps {
  alerts: PowerAlert[];
  onUpdateAlert: (alertId: string, updates: Partial<PowerAlert>) => void;
  onDismissAlert: (alertId: string) => void;
}

export function AlertManagement({ alerts, onUpdateAlert, onDismissAlert }: AlertManagementProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');
  const [noteInput, setNoteInput] = useState<string>('');
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter(alert => {
    if (selectedFilter === 'all') return true;
    return alert.status === selectedFilter;
  });

  const handleAddNote = (alertId: string) => {
    if (noteInput.trim()) {
      onUpdateAlert(alertId, {
        notes: noteInput.trim()
      });
      setNoteInput('');
      setEditingAlertId(null);
    }
  };

  const getStatusColor = (status: PowerAlert['status']) => {
    switch (status) {
      case 'active': return 'text-red-600';
      case 'acknowledged': return 'text-yellow-600';
      case 'resolved': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: PowerAlert['status']) => {
    switch (status) {
      case 'active': return <AlertTriangle className="w-4 h-4" />;
      case 'acknowledged': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Alert Management</h2>
        <div className="flex gap-2">
          {(['all', 'active', 'acknowledged', 'resolved'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1 rounded ${
                selectedFilter === filter
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 ${
              alert.status === 'active' ? 'border-red-200 bg-red-50' :
              alert.status === 'acknowledged' ? 'border-yellow-200 bg-yellow-50' :
              'border-green-200 bg-green-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={getStatusColor(alert.status)}>
                  {getStatusIcon(alert.status)}
                </span>
                <span className="font-medium">{alert.location}</span>
                <span className="text-gray-600">
                  {alert.currentUsage.toFixed(1)} kWh / {alert.limit} kWh
                </span>
              </div>
              <div className="flex items-center gap-2">
                {alert.status === 'active' && (
                  <button
                    onClick={() => onUpdateAlert(alert.id, { 
                      status: 'acknowledged',
                      acknowledgedAt: new Date()
                    })}
                    className="px-2 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  >
                    Acknowledge
                  </button>
                )}
                {alert.status === 'acknowledged' && (
                  <button
                    onClick={() => onUpdateAlert(alert.id, {
                      status: 'resolved',
                      resolvedAt: new Date()
                    })}
                    className="px-2 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => onDismissAlert(alert.id)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-500">
              Triggered at {alert.timestamp.toLocaleString()}
              {alert.acknowledgedAt && (
                <span className="ml-2">• Acknowledged at {alert.acknowledgedAt.toLocaleString()}</span>
              )}
              {alert.resolvedAt && (
                <span className="ml-2">• Resolved at {alert.resolvedAt.toLocaleString()}</span>
              )}
            </div>

            {alert.notes && (
              <div className="mt-2 text-sm bg-white bg-opacity-50 p-2 rounded">
                {alert.notes}
              </div>
            )}

            {editingAlertId === alert.id ? (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 px-2 py-1 text-sm border rounded"
                />
                <button
                  onClick={() => handleAddNote(alert.id)}
                  className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingAlertId(alert.id)}
                className="mt-2 flex items-center text-sm text-blue-500 hover:text-blue-700"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Add Note
              </button>
            )}
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {selectedFilter === 'all' ? '' : selectedFilter} alerts to display
          </div>
        )}
      </div>
    </div>
  );
}