/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Gauge, Activity, Zap, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export type TabType = 'cockpit' | 'telemetry' | 'dyno' | 'diag' | 'logs';

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isRecording?: boolean;
  hasActiveDtc?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  isRecording,
  hasActiveDtc,
}) => {
  const tabs = [
    { id: 'cockpit' as TabType, label: 'Cockpit', icon: Gauge },
    { id: 'telemetry' as TabType, label: 'Sensors', icon: Activity },
    { id: 'dyno' as TabType, label: '0-100 & Dyno', icon: Zap },
    { id: 'diag' as TabType, label: 'DTC Scan', icon: AlertTriangle, badge: hasActiveDtc },
    { id: 'logs' as TabType, label: 'Datalog', icon: FileSpreadsheet, recording: isRecording },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d15]/95 backdrop-blur-md border-t border-slate-800/80 px-2 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors min-h-[44px] ${
                isActive
                  ? 'text-red-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
                {tab.recording && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-0.5 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
