import React from 'react';

export const SchedaDati: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number | null;
    unit?: string;
    bgColor: string;
    iconColor: string;
  }> = ({ icon, label, value, unit, bgColor, iconColor }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`${bgColor} p-2 rounded-lg`}>
          <div className={`${iconColor}`}>{icon}</div>
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <h3 className="text-xl font-bold">
            {value !== null ? `${value}${unit || ''}` : 'N/A'}
          </h3>
        </div>
      </div>
    </div>
  );

// export default DataCard;