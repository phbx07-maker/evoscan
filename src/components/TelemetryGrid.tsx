/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TelemetryData } from '../types/telemetry';
import { Activity, Wind, Zap, Thermometer, Battery, Gauge, Droplet, Clock } from 'lucide-react';

interface TelemetryGridProps {
  telemetry: TelemetryData;
}

interface MetricHistory {
  rpm: number[];
  speed: number[];
  boost: number[];
  afr: number[];
  coolant: number[];
  maf: number[];
  timing: number[];
}

export const TelemetryGrid: React.FC<TelemetryGridProps> = ({ telemetry }) => {
  const [history, setHistory] = useState<MetricHistory>({
    rpm: [],
    speed: [],
    boost: [],
    afr: [],
    coolant: [],
    maf: [],
    timing: [],
  });

  // Track history for sparklines (last 20 points)
  useEffect(() => {
    setHistory((prev) => ({
      rpm: [...prev.rpm.slice(-24), telemetry.rpm],
      speed: [...prev.speed.slice(-24), telemetry.speed],
      boost: [...prev.boost.slice(-24), telemetry.boostPsi],
      afr: [...prev.afr.slice(-24), telemetry.afr],
      coolant: [...prev.coolant.slice(-24), telemetry.coolantTemp],
      maf: [...prev.maf.slice(-24), telemetry.mafAirflow],
      timing: [...prev.timing.slice(-24), telemetry.timingAdvance],
    }));
  }, [telemetry]);

  const renderMiniSparkline = (data: number[], color: string, minVal?: number, maxVal?: number) => {
    if (data.length < 2) return null;
    const min = minVal !== undefined ? minVal : Math.min(...data);
    const max = maxVal !== undefined ? maxVal : Math.max(...data);
    const range = Math.max(1, max - min);

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * 100;
        const y = 28 - ((val - min) / range) * 24;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="w-full h-8 overflow-visible mt-2" viewBox="0 0 100 28">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const tiles = [
    {
      id: 'rpm',
      title: 'ENGINE SPEED',
      value: Math.round(telemetry.rpm),
      unit: 'RPM',
      subtext: `GEAR: ${telemetry.gear === 0 ? 'N' : telemetry.gear}`,
      icon: Gauge,
      color: '#ef4444',
      history: history.rpm,
    },
    {
      id: 'speed',
      title: 'VEHICLE SPEED',
      value: Math.round(telemetry.speed),
      unit: 'KM/H',
      subtext: `${(telemetry.speed * 0.621371).toFixed(0)} MPH`,
      icon: Activity,
      color: '#06b6d4',
      history: history.speed,
    },
    {
      id: 'boost',
      title: 'MANIFOLD PRESSURE',
      value: telemetry.boostPsi >= 0 ? `+${telemetry.boostPsi.toFixed(1)}` : telemetry.boostPsi.toFixed(1),
      unit: telemetry.boostPsi >= 0 ? 'PSI' : 'inHg',
      subtext: telemetry.boostPsi >= 0 ? 'BOOST' : 'VACUUM',
      icon: Wind,
      color: '#f59e0b',
      history: history.boost,
    },
    {
      id: 'afr',
      title: 'AIR / FUEL RATIO',
      value: telemetry.afr.toFixed(2),
      unit: 'AFR',
      subtext: telemetry.afr < 12.0 ? 'RICH' : telemetry.afr > 15.5 ? 'LEAN' : 'STOICH',
      icon: Droplet,
      color: '#10b981',
      history: history.afr,
    },
    {
      id: 'coolant',
      title: 'COOLANT TEMPERATURE',
      value: Math.round(telemetry.coolantTemp),
      unit: '°C',
      subtext: `${((telemetry.coolantTemp * 9) / 5 + 32).toFixed(0)}°F`,
      icon: Thermometer,
      color: telemetry.coolantTemp > 100 ? '#ef4444' : '#38bdf8',
      history: history.coolant,
    },
    {
      id: 'iat',
      title: 'INTAKE AIR TEMP (IAT)',
      value: Math.round(telemetry.intakeAirTemp),
      unit: '°C',
      subtext: 'INTERCOOLER OUTLET',
      icon: Thermometer,
      color: '#a855f7',
      history: [],
    },
    {
      id: 'timing',
      title: 'TIMING ADVANCE',
      value: telemetry.timingAdvance.toFixed(1),
      unit: '° BTDC',
      subtext: 'IGNITION SPARK',
      icon: Zap,
      color: '#eab308',
      history: history.timing,
    },
    {
      id: 'maf',
      title: 'MASS AIR FLOW (MAF)',
      value: telemetry.mafAirflow.toFixed(1),
      unit: 'g/sec',
      subtext: 'INTAKE VOLUME',
      icon: Wind,
      color: '#6366f1',
      history: history.maf,
    },
    {
      id: 'battery',
      title: 'BATTERY VOLTAGE',
      value: telemetry.batteryVolts.toFixed(1),
      unit: 'VOLTS',
      subtext: 'ALTERNATOR OUTPUT',
      icon: Battery,
      color: '#14b8a6',
      history: [],
    },
    {
      id: 'oil',
      title: 'ENGINE OIL PRESSURE',
      value: Math.round(telemetry.oilPressurePsi),
      unit: 'PSI',
      subtext: 'LUBRICATION FEED',
      icon: Droplet,
      color: '#f97316',
      history: [],
    },
    {
      id: 'stft',
      title: 'SHORT TERM FUEL TRIM',
      value: telemetry.stft > 0 ? `+${telemetry.stft}%` : `${telemetry.stft}%`,
      unit: 'STFT',
      subtext: `LTFT: ${telemetry.ltft}%`,
      icon: Activity,
      color: '#84cc16',
      history: [],
    },
    {
      id: 'knock',
      title: 'KNOCK SENSOR',
      value: telemetry.knockCount,
      unit: 'COUNTS',
      subtext: telemetry.knockCount === 0 ? 'ZERO KNOCK' : 'KNOCK WARNING',
      icon: Clock,
      color: telemetry.knockCount > 0 ? '#ef4444' : '#10b981',
      history: [],
    },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-4">
      {/* Overview Banner */}
      <div className="bg-[#0b101a] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            LIVE ECU TELEMETRY PARAMETERS
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Streaming Mode 01 PIDs at high sampling rate (~25Hz)
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>CHANNEL STATUS: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Grid of Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.id}
              className="bg-[#0f1422] border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider truncate">
                  {tile.title}
                </span>
                <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
              </div>

              <div className="my-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-mono font-black tabular-nums text-white">
                    {tile.value}
                  </span>
                  <span className="text-xs font-mono text-slate-400 uppercase">
                    {tile.unit}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  {tile.subtext}
                </div>
              </div>

              {tile.history.length > 1 && (
                <div className="pt-1 border-t border-slate-800/60">
                  {renderMiniSparkline(tile.history, tile.color)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
