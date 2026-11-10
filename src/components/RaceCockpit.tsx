/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TelemetryData, VehicleProfile } from '../types/telemetry';
import { Play, Pause, RotateCcw, Flame, Compass, ChevronUp, ChevronDown } from 'lucide-react';

interface RaceCockpitProps {
  telemetry: TelemetryData;
  profile: VehicleProfile;
  onSetThrottle: (pct: number) => void;
  onSetGear: (gear: number) => void;
  onToggleAutoShift: (enabled?: boolean) => boolean;
  isAutoShift: boolean;
  onResetVehicle: () => void;
}

export const RaceCockpit: React.FC<RaceCockpitProps> = ({
  telemetry,
  profile,
  onSetThrottle,
  onSetGear,
  onToggleAutoShift,
  isAutoShift,
  onResetVehicle,
}) => {
  const [useMph, setUseMph] = useState(false);
  const [peakRpm, setPeakRpm] = useState(850);
  const [peakBoost, setPeakBoost] = useState(0);
  const [isPedalPressed, setIsPedalPressed] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  // Track peaks
  useEffect(() => {
    if (telemetry.rpm > peakRpm) setPeakRpm(Math.round(telemetry.rpm));
    if (telemetry.boostPsi > peakBoost) setPeakBoost(Number(telemetry.boostPsi.toFixed(1)));
  }, [telemetry.rpm, telemetry.boostPsi, peakRpm, peakBoost]);

  const resetPeaks = () => {
    setPeakRpm(Math.round(telemetry.rpm));
    setPeakBoost(Number(Math.max(0, telemetry.boostPsi).toFixed(1)));
  };

  // Tachometer geometry (-225 deg to +45 deg, 270 deg total)
  const maxDialRpm = 9000;
  const rpmClamped = Math.max(0, Math.min(maxDialRpm, telemetry.rpm));
  const rpmRatio = rpmClamped / maxDialRpm;
  const tachAngle = -225 + rpmRatio * 270;

  // Boost geometry (-225 deg to +45 deg, covering -30 inHg to +35 PSI = 65 total range)
  const minBoostVal = -30;
  const maxBoostVal = 35;
  const boostRange = maxBoostVal - minBoostVal;
  const currentBoostVal = Math.max(minBoostVal, Math.min(maxBoostVal, telemetry.boostPsi));
  const boostRatio = (currentBoostVal - minBoostVal) / boostRange;
  const boostAngle = -225 + boostRatio * 270;

  // Shift light LED calculations
  // 8 LEDs: 3 green (5000, 5600, 6200), 3 yellow (6600, 7000, 7400), 2 red (7600, 7800)
  const shiftThresholds = [5000, 5600, 6200, 6600, 7000, 7400, 7600, 7800];
  const isRedlineFlashing = telemetry.rpm >= profile.redlineRpm;

  // Speed in mph or km/h
  const displaySpeed = useMph
    ? Math.round(telemetry.speed * 0.621371)
    : Math.round(telemetry.speed);
  const speedUnit = useMph ? 'MPH' : 'KM/H';

  // Handling pedal press and scenarios
  const handlePedalStart = () => {
    setIsPedalPressed(true);
    setActiveScenario(null);
    onSetThrottle(100);
  };

  const handlePedalEnd = () => {
    setIsPedalPressed(false);
    onSetThrottle(0);
  };

  const triggerScenario = (name: string, targetThrottle: number, durationMs: number = 3000) => {
    setActiveScenario(name);
    onSetThrottle(targetThrottle);
    setTimeout(() => {
      onSetThrottle(0);
      setActiveScenario(null);
    }, durationMs);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-4">
      {/* Top Shift Light Bar */}
      <div className="bg-[#0b101a] border border-slate-800/80 rounded-2xl p-3 shadow-lg flex flex-col items-center gap-2">
        <div className="flex items-center justify-between w-full px-2 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>PROGRESSIVE SHIFT LIGHT</span>
          </span>
          <span className="text-slate-400">REDLINE {profile.redlineRpm} RPM</span>
        </div>

        <div className="grid grid-cols-8 gap-1.5 sm:gap-2.5 w-full max-w-md px-1">
          {shiftThresholds.map((thresh, idx) => {
            const isLit = telemetry.rpm >= thresh;
            const isGreen = idx < 3;
            const isYellow = idx >= 3 && idx < 6;
            const isRed = idx >= 6;

            let bgClass = 'bg-slate-800/60 border-slate-700/40';
            if (isLit) {
              if (isGreen) bgClass = 'bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/50';
              else if (isYellow) bgClass = 'bg-amber-400 border-amber-300 shadow-md shadow-amber-400/50';
              else bgClass = 'bg-red-500 border-red-400 shadow-lg shadow-red-500/70';
            }

            return (
              <div
                key={thresh}
                className={`h-3.5 sm:h-4 rounded border transition-all duration-75 ${bgClass} ${
                  isRedlineFlashing ? 'animate-ping' : ''
                }`}
              />
            );
          })}
        </div>

        {isRedlineFlashing && (
          <div className="text-xs font-mono font-black text-red-500 tracking-wider animate-pulse">
            ▲ SHIFT NOW ▲
          </div>
        )}
      </div>

      {/* Main Dual Gauge Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gauge 1: Tachometer with Integrated Gear & Speed */}
        <div className="bg-[#0b101a] border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1 text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider font-semibold">ENGINE TACHOMETER</span>
            <span className="text-slate-400">PEAK: <strong className="text-white">{peakRpm}</strong> RPM</span>
          </div>

          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg viewBox="0 0 280 280" className="w-full h-full transform">
              <defs>
                <radialGradient id="tachCenter" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#253248" />
                  <stop offset="100%" stopColor="#0d131f" />
                </radialGradient>
                <linearGradient id="needleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff4b4b" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>

              {/* Background Outer Ring */}
              <circle
                cx="140"
                cy="140"
                r="118"
                fill="none"
                stroke="#151d2c"
                strokeWidth="10"
              />

              {/* Normal RPM Sector Arc (0 - 7000) */}
              <path
                d="M 56.5 223.5 A 118 118 0 1 1 247.3 189.5"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
                strokeLinecap="round"
              />

              {/* Redline Sector Arc (7000 - 9000) */}
              <path
                d="M 247.3 189.5 A 118 118 0 0 1 223.5 223.5"
                fill="none"
                stroke="#ef4444"
                strokeWidth="10"
                strokeLinecap="round"
              />

              {/* Major Ticks & Numbers (0 to 9) */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => {
                const angle = -225 + (val / 9) * 270;
                const rad = (angle * Math.PI) / 180;
                const x1 = 140 + 104 * Math.cos(rad);
                const y1 = 140 + 104 * Math.sin(rad);
                const x2 = 140 + 116 * Math.cos(rad);
                const y2 = 140 + 116 * Math.sin(rad);
                const textX = 140 + 88 * Math.cos(rad);
                const textY = 140 + 88 * Math.sin(rad);

                const isRedlineNum = val >= 7;

                return (
                  <g key={val}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isRedlineNum ? '#ef4444' : '#64748b'}
                      strokeWidth={val % 2 === 0 ? '3' : '2'}
                    />
                    <text
                      x={textX}
                      y={textY + 4}
                      textAnchor="middle"
                      fill={isRedlineNum ? '#f87171' : '#cbd5e1'}
                      fontSize="14"
                      fontFamily="var(--font-mono)"
                      fontWeight="bold"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Center Hub Display */}
              <circle cx="140" cy="140" r="54" fill="url(#tachCenter)" stroke="#334155" strokeWidth="2" />

              {/* Needle */}
              <g
                transform={`rotate(${tachAngle} 140 140)`}
                className="transition-transform duration-75 ease-out"
              >
                <polygon
                  points="137,140 140,30 143,140 140,165"
                  fill="url(#needleGlow)"
                  filter="drop-shadow(0 0 6px rgba(239, 68, 68, 0.8))"
                />
                <circle cx="140" cy="140" r="9" fill="#f87171" stroke="#ffffff" strokeWidth="1.5" />
              </g>
            </svg>

            {/* In-Dial Digital Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-[10px] font-mono tracking-widest text-slate-400">RPM × 1000</span>
              <span className="text-3xl sm:text-4xl font-mono font-black tabular-nums tracking-tight text-white drop-shadow-md">
                {Math.round(telemetry.rpm)}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-mono text-slate-400">GEAR</span>
                <span className="w-6 h-6 rounded bg-red-600/30 border border-red-500/50 flex items-center justify-center font-mono font-black text-sm text-red-400">
                  {telemetry.gear === 0 ? 'N' : telemetry.gear}
                </span>
              </div>
            </div>
          </div>

          {/* Speed Indicator Below */}
          <div className="flex items-center justify-between w-full pt-2 border-t border-slate-800/80">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-mono font-extrabold tabular-nums text-white">
                {displaySpeed}
              </span>
              <button
                onClick={() => setUseMph(!useMph)}
                className="text-[11px] font-mono font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
                title="Klik untuk ganti satuan KM/H atau MPH"
              >
                {speedUnit}
              </button>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">THROTTLE</span>
              <span className="text-sm font-mono font-bold text-cyan-400 tabular-nums">
                {Math.round(telemetry.throttle)}%
              </span>
            </div>
          </div>
        </div>

        {/* Gauge 2: Turbo Boost / Vacuum Gauge */}
        <div className="bg-[#0b101a] border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1 text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider font-semibold">TURBO BOOST / VACUUM</span>
            <span className="text-slate-400">PEAK: <strong className="text-amber-400">+{peakBoost}</strong> PSI</span>
          </div>

          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg viewBox="0 0 280 280" className="w-full h-full transform">
              <defs>
                <radialGradient id="boostCenter" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#223043" />
                  <stop offset="100%" stopColor="#0c111a" />
                </radialGradient>
                <linearGradient id="boostNeedle" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>

              <circle cx="140" cy="140" r="118" fill="none" stroke="#151d2c" strokeWidth="10" />

              {/* Vacuum Arc (-30 to 0) in Cyan */}
              <path
                d="M 56.5 223.5 A 118 118 0 0 1 140 22"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="7"
                strokeLinecap="round"
              />

              {/* Boost Arc (0 to +35 PSI) in Amber/Red */}
              <path
                d="M 140 22 A 118 118 0 0 1 223.5 223.5"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="8"
                strokeLinecap="round"
              />

              {/* Boost Calibration Labels (-30, -20, -10, 0, 10, 20, 30) */}
              {[
                { val: -30, label: '-30' },
                { val: -20, label: '-20' },
                { val: -10, label: '-10' },
                { val: 0, label: '0' },
                { val: 10, label: '+10' },
                { val: 20, label: '+20' },
                { val: 30, label: '+30' },
              ].map(({ val, label }) => {
                const ratio = (val - minBoostVal) / boostRange;
                const angle = -225 + ratio * 270;
                const rad = (angle * Math.PI) / 180;
                const x1 = 140 + 104 * Math.cos(rad);
                const y1 = 140 + 104 * Math.sin(rad);
                const x2 = 140 + 116 * Math.cos(rad);
                const y2 = 140 + 116 * Math.sin(rad);
                const textX = 140 + 88 * Math.cos(rad);
                const textY = 140 + 88 * Math.sin(rad);

                const isBoost = val > 0;
                const isZero = val === 0;

                return (
                  <g key={val}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isZero ? '#ffffff' : isBoost ? '#f59e0b' : '#06b6d4'}
                      strokeWidth={isZero ? '3' : '2'}
                    />
                    <text
                      x={textX}
                      y={textY + 4}
                      textAnchor="middle"
                      fill={isZero ? '#ffffff' : isBoost ? '#fbbf24' : '#67e8f9'}
                      fontSize="12"
                      fontFamily="var(--font-mono)"
                      fontWeight="bold"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              <circle cx="140" cy="140" r="54" fill="url(#boostCenter)" stroke="#334155" strokeWidth="2" />

              {/* Needle */}
              <g
                transform={`rotate(${boostAngle} 140 140)`}
                className="transition-transform duration-75 ease-out"
              >
                <polygon
                  points="137,140 140,30 143,140 140,165"
                  fill="url(#boostNeedle)"
                  filter="drop-shadow(0 0 6px rgba(245, 158, 11, 0.7))"
                />
                <circle cx="140" cy="140" r="9" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
              </g>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-[10px] font-mono tracking-widest text-slate-400">
                {telemetry.boostPsi >= 0 ? 'BOOST (PSI)' : 'VACUUM (inHg)'}
              </span>
              <span
                className={`text-3xl sm:text-4xl font-mono font-black tabular-nums tracking-tight drop-shadow-md ${
                  telemetry.boostPsi >= 0 ? 'text-amber-400' : 'text-cyan-400'
                }`}
              >
                {telemetry.boostPsi >= 0
                  ? `+${telemetry.boostPsi.toFixed(1)}`
                  : telemetry.boostPsi.toFixed(1)}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                MAX TARGET {profile.maxBoostPsi} PSI
              </span>
            </div>
          </div>

          {/* Quick Stats Below Boost */}
          <div className="grid grid-cols-2 w-full pt-2 border-t border-slate-800/80 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">AFR LAMBDA</span>
              <span
                className={`font-bold tabular-nums ${
                  telemetry.afr < 12.0
                    ? 'text-amber-400'
                    : telemetry.afr > 15.5
                    ? 'text-cyan-400'
                    : 'text-emerald-400'
                }`}
              >
                {telemetry.afr.toFixed(2)} : 1
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">COOLANT</span>
              <span
                className={`font-bold tabular-nums ${
                  telemetry.coolantTemp > 100 ? 'text-red-400' : 'text-slate-200'
                }`}
              >
                {Math.round(telemetry.coolantTemp)}°C
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Gauges Strip (AFR, G-Force, Knock) */}
      <div className="grid grid-cols-3 gap-3">
        {/* AFR Dial Strip */}
        <div className="bg-[#0b101a] border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>AIR-FUEL RATIO</span>
            <span className="text-emerald-400">STP 14.7</span>
          </div>
          <div className="my-2">
            <div className="h-2 rounded-full bg-slate-800 flex overflow-hidden">
              <div className="w-1/3 bg-amber-500/80" title="Rich < 12.5" />
              <div className="w-1/3 bg-emerald-500/80" title="Stoich 14.7" />
              <div className="w-1/3 bg-cyan-500/80" title="Lean > 15.5" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>RICH</span>
              <span>14.7</span>
              <span>LEAN</span>
            </div>
          </div>
          <div className="text-base font-mono font-bold text-white tabular-nums">
            {telemetry.afr.toFixed(1)} <span className="text-xs font-normal text-slate-400">AFR</span>
          </div>
        </div>

        {/* G-Force Ball Meter */}
        <div className="bg-[#0b101a] border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between items-center text-center">
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between w-full">
            <span>G-FORCE ACCEL</span>
            <Compass className="w-3 h-3 text-cyan-400" />
          </div>

          <div className="relative w-14 h-14 rounded-full border border-slate-700/60 bg-[#070a10] flex items-center justify-center my-1">
            <div className="absolute w-full h-[1px] bg-slate-800" />
            <div className="absolute h-full w-[1px] bg-slate-800" />
            {/* G-Ball */}
            <div
              className="absolute w-3 h-3 rounded-full bg-red-500 shadow-md shadow-red-500/80 transition-all duration-75"
              style={{
                transform: `translate(${Math.max(-22, Math.min(22, telemetry.gForceLat * 18))}px, ${Math.max(
                  -22,
                  Math.min(22, -telemetry.gForceLong * 18)
                )}px)`,
              }}
            />
          </div>

          <div className="text-xs font-mono text-slate-300">
            +{telemetry.gForceLong.toFixed(2)}G <span className="text-slate-500">long</span>
          </div>
        </div>

        {/* Knock & Timing Advance */}
        <div className="bg-[#0b101a] border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>KNOCK COUNT</span>
            {telemetry.knockCount > 0 ? (
              <span className="text-amber-400 font-bold">⚠ DETECTED</span>
            ) : (
              <span className="text-emerald-400">SAFE</span>
            )}
          </div>
          <div className="my-1">
            <div className="text-2xl font-mono font-black tabular-nums text-white">
              {telemetry.knockCount}
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            TIMING: <strong className="text-cyan-400">{telemetry.timingAdvance.toFixed(1)}°</strong> BTDC
          </div>
        </div>
      </div>

      {/* Interactive Driving & Throttle Controls */}
      <div className="bg-[#0f1422] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-2">
            <span>INTERACTIVE DRIVING & THROTTLE DECK</span>
            <span className="text-slate-500">·</span>
            <span className="text-[11px] text-slate-400">Hold gas pedal or choose preset pull</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleAutoShift()}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors border ${
                isAutoShift
                  ? 'bg-red-950/60 border-red-500/50 text-red-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              AUTO-SHIFT: {isAutoShift ? 'ON' : 'MANUAL'}
            </button>

            <button
              onClick={onResetVehicle}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Reset ke posisi diam (Idle 850 RPM)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pedal & Manual Shifter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
          {/* Main Hold Gas Pedal Button */}
          <div className="sm:col-span-2 flex flex-col gap-2">
            <button
              onMouseDown={handlePedalStart}
              onMouseUp={handlePedalEnd}
              onTouchStart={handlePedalStart}
              onTouchEnd={handlePedalEnd}
              className={`w-full py-5 sm:py-6 px-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] select-none min-h-[64px] ${
                isPedalPressed
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 border-red-400 text-white shadow-xl shadow-red-600/40'
                  : 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 text-slate-200'
              }`}
            >
              <Flame className={`w-6 h-6 ${isPedalPressed ? 'animate-bounce text-amber-200' : 'text-red-500'}`} />
              <div className="text-center">
                <div className="text-lg sm:text-xl font-black tracking-widest uppercase text-white">
                  ACCELERATE
                </div>
              </div>
            </button>

            {/* Slider for precision steady throttle */}
            <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">STEADY THROTTLE:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={telemetry.throttle}
                onChange={(e) => onSetThrottle(Number(e.target.value))}
                className="flex-1 accent-red-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
              <span className="tabular-nums w-12 text-right font-bold text-white">
                {Math.round(telemetry.throttle)}%
              </span>
            </div>
          </div>

          {/* Manual Shifter Column */}
          <div className="flex flex-col justify-between gap-2 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <div className="text-[11px] font-mono text-slate-400 flex justify-between items-center">
              <span>MANUAL GEAR</span>
              <span className="font-bold text-white">GEAR {telemetry.gear === 0 ? 'N' : telemetry.gear}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSetGear(Math.min(6, telemetry.gear + 1))}
                disabled={isAutoShift || telemetry.gear >= 6}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-mono text-xs flex items-center justify-center gap-1 border border-slate-700 min-h-[44px]"
              >
                <ChevronUp className="w-4 h-4 text-emerald-400" />
                <span>SHIFT UP</span>
              </button>

              <button
                onClick={() => onSetGear(Math.max(0, telemetry.gear - 1))}
                disabled={isAutoShift || telemetry.gear <= 0}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-mono text-xs flex items-center justify-center gap-1 border border-slate-700 min-h-[44px]"
              >
                <ChevronDown className="w-4 h-4 text-amber-400" />
                <span>SHIFT DOWN</span>
              </button>
            </div>

            <button
              onClick={() => onSetGear(0)}
              disabled={isAutoShift}
              className="w-full py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white font-mono text-[11px] border border-slate-700/60"
            >
              NEUTRAL (N)
            </button>
          </div>
        </div>

        {/* Quick Driving Scenarios */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500">PRESET SCENARIOS:</span>

          <button
            onClick={() => triggerScenario('Rev Blip', 75, 1200)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              activeScenario === 'Rev Blip'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            REV BLIP (Idle)
          </button>

          <button
            onClick={() => triggerScenario('Dyno 3rd Pull', 100, 4500)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              activeScenario === 'Dyno 3rd Pull'
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            DYNO 3RD GEAR PULL
          </button>

          <button
            onClick={() => triggerScenario('Launch Drag', 100, 6000)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              activeScenario === 'Launch Drag'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            0-100 DRAG LAUNCH
          </button>
        </div>
      </div>
    </div>
  );
};
