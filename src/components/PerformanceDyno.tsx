/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TelemetryData, VehicleProfile, SprintRunResult } from '../types/telemetry';
import { Timer, Zap, Play, RotateCcw, Award, TrendingUp, Flag } from 'lucide-react';

interface PerformanceDynoProps {
  telemetry: TelemetryData;
  profile: VehicleProfile;
  onSetThrottle: (pct: number) => void;
  onResetVehicle: () => void;
}

export const PerformanceDyno: React.FC<PerformanceDynoProps> = ({
  telemetry,
  profile,
  onSetThrottle,
  onResetVehicle,
}) => {
  // Test states: 'idle' | 'staged' | 'countdown' | 'running' | 'completed'
  const [testState, setTestState] = useState<'idle' | 'staged' | 'countdown' | 'running' | 'completed'>('idle');
  const [countdownStep, setCountdownStep] = useState(0); // 0 = off, 1 = yellow1, 2 = yellow2, 3 = yellow3, 4 = green
  const [elapsedTime, setElapsedTime] = useState(0);
  const [split0to60, setSplit0to60] = useState<number | null>(null);
  const [split0to100, setSplit0to100] = useState<number | null>(null);
  const [peakG, setPeakG] = useState(0);
  const [peakHp, setPeakHp] = useState(0);
  const [peakTorque, setPeakTorque] = useState(0);

  // Past test run history
  const [sprintHistory, setSprintHistory] = useState<SprintRunResult[]>([
    {
      id: 'run-prev-1',
      timestamp: Date.now() - 3600000,
      target: '0-100 KM/H',
      time0to60: 2.15,
      time0to100: 4.62,
      timeQuarterMile: 12.84,
      peakSpeed: 104,
      peakGForce: 0.94,
      peakHp: 326,
      peakTorque: 415,
    },
  ]);

  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);

  // Auto detect launch when staged
  useEffect(() => {
    if (testState === 'staged' && telemetry.speed > 1.5) {
      // Launch detected!
      startSprintRun();
    }
  }, [telemetry.speed, testState]);

  // Track sprint splits and dyno calculations while running
  useEffect(() => {
    if (testState !== 'running') return;

    // Track G-force peak
    if (telemetry.gForceLong > peakG) {
      setPeakG(telemetry.gForceLong);
    }

    // Dynamic horsepower calculation
    // Power (WHP) = (Mass * Accel * Speed + Aero) / 745.7
    const speedMs = (telemetry.speed * 1000) / 3600;
    const accelMs2 = telemetry.gForceLong * 9.81;
    if (accelMs2 > 0 && speedMs > 2) {
      const mass = profile.curbWeightKg;
      const powerWatts = mass * accelMs2 * speedMs + 0.5 * 1.2 * 0.35 * 2.1 * Math.pow(speedMs, 3);
      const calculatedHp = Math.round(powerWatts / 745.7);
      if (calculatedHp > peakHp && calculatedHp < 900) {
        setPeakHp(calculatedHp);
      }
      // Torque (Nm) = (HP * 5252 / RPM) * 1.3558
      if (telemetry.rpm > 1500) {
        const calculatedTorque = Math.round(((calculatedHp * 5252) / telemetry.rpm) * 1.3558);
        if (calculatedTorque > peakTorque && calculatedTorque < 1200) {
          setPeakTorque(calculatedTorque);
        }
      }
    }

    // 0-60 km/h split
    if (telemetry.speed >= 60 && split0to60 === null) {
      const now = performance.now();
      const s60 = Number(((now - startTimeRef.current) / 1000).toFixed(2));
      setSplit0to60(s60);
    }

    // 0-100 km/h completion
    if (telemetry.speed >= 100 && split0to100 === null) {
      const now = performance.now();
      const s100 = Number(((now - startTimeRef.current) / 1000).toFixed(2));
      setSplit0to100(s100);
      setTestState('completed');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      // Record result
      const newResult: SprintRunResult = {
        id: `run-${Date.now()}`,
        timestamp: Date.now(),
        target: '0-100 KM/H',
        time0to60: split0to60 || Number((s100 * 0.48).toFixed(2)),
        time0to100: s100,
        peakSpeed: Math.round(telemetry.speed),
        peakGForce: Number(Math.max(0.7, peakG).toFixed(2)),
        peakHp: Math.max(280, peakHp),
        peakTorque: Math.max(380, peakTorque),
      };

      setSprintHistory((prev) => [newResult, ...prev]);
    }
  }, [telemetry.speed, telemetry.gForceLong, telemetry.rpm, testState, split0to60, split0to100, peakG, peakHp, peakTorque, profile.curbWeightKg]);

  const stageCar = () => {
    onResetVehicle();
    setTestState('staged');
    setCountdownStep(0);
    setElapsedTime(0);
    setSplit0to60(null);
    setSplit0to100(null);
    setPeakG(0);
    setPeakHp(0);
    setPeakTorque(0);
  };

  const startCountdown = () => {
    stageCar();
    setTestState('countdown');
    setCountdownStep(1); // Amber 1

    setTimeout(() => {
      setCountdownStep(2); // Amber 2
      setTimeout(() => {
        setCountdownStep(3); // Amber 3
        setTimeout(() => {
          setCountdownStep(4); // GREEN GO!
          startSprintRun();
          // Full throttle launch
          onSetThrottle(100);
        }, 500);
      }, 500);
    }, 500);
  };

  const startSprintRun = () => {
    startTimeRef.current = performance.now();
    setTestState('running');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      const curr = (performance.now() - startTimeRef.current) / 1000;
      setElapsedTime(curr);
    }, 30);
  };

  const resetTest = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTestState('idle');
    setCountdownStep(0);
    setElapsedTime(0);
    setSplit0to60(null);
    setSplit0to100(null);
    onSetThrottle(0);
    onResetVehicle();
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-4">
      {/* Drag Tree & Staging Strip */}
      <div className="bg-[#0b101a] border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-600/20 text-red-400">
                <Flag className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                0-100 KM/H ACCELERATION SPRINT & ON-ROAD DYNO
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Automated launch detection with drag staging tree and real-time HP telemetry
            </p>
          </div>

          <div className="flex items-center gap-2">
            {testState === 'idle' && (
              <button
                onClick={startCountdown}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-mono text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all min-h-[44px]"
              >
                <Play className="w-4 h-4" />
                <span>MULAI DRAG COUNTDOWN</span>
              </button>
            )}

            {testState === 'staged' && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs animate-pulse">
                  STAGED: ACCELERATE TO LAUNCH!
                </span>
                <button
                  onClick={resetTest}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            {(testState === 'running' || testState === 'completed' || testState === 'countdown') && (
              <button
                onClick={resetTest}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET TEST</span>
              </button>
            )}
          </div>
        </div>

        {/* Drag Staging Light Tree Graphic */}
        <div className="bg-[#070a10] border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center">
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Pre-Stage / Stage */}
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[9px] font-mono text-slate-500">STAGE</span>
              <div
                className={`w-4 h-4 rounded-full border ${
                  testState === 'staged' || testState === 'countdown' || testState === 'running'
                    ? 'bg-amber-400 border-amber-300 shadow-md shadow-amber-400/80'
                    : 'bg-slate-800 border-slate-700'
                }`}
              />
            </div>

            {/* Amber 1 */}
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[9px] font-mono text-slate-500">AMBER 1</span>
              <div
                className={`w-5 h-5 rounded-full border ${
                  countdownStep >= 1 && countdownStep < 4
                    ? 'bg-amber-500 border-amber-300 shadow-md shadow-amber-500/90'
                    : 'bg-slate-800 border-slate-700'
                }`}
              />
            </div>

            {/* Amber 2 */}
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[9px] font-mono text-slate-500">AMBER 2</span>
              <div
                className={`w-5 h-5 rounded-full border ${
                  countdownStep >= 2 && countdownStep < 4
                    ? 'bg-amber-500 border-amber-300 shadow-md shadow-amber-500/90'
                    : 'bg-slate-800 border-slate-700'
                }`}
              />
            </div>

            {/* Amber 3 */}
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[9px] font-mono text-slate-500">AMBER 3</span>
              <div
                className={`w-5 h-5 rounded-full border ${
                  countdownStep >= 3 && countdownStep < 4
                    ? 'bg-amber-500 border-amber-300 shadow-md shadow-amber-500/90'
                    : 'bg-slate-800 border-slate-700'
                }`}
              />
            </div>

            {/* Green GO */}
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[9px] font-mono text-slate-500">GREEN</span>
              <div
                className={`w-6 h-6 rounded-full border ${
                  countdownStep === 4 || testState === 'running'
                    ? 'bg-emerald-500 border-emerald-300 shadow-lg shadow-emerald-500/90'
                    : 'bg-slate-800 border-slate-700'
                }`}
              />
            </div>
          </div>

          {/* Central Live Sprint Timer Display */}
          <div className="mt-4 text-center">
            <span className="text-xs font-mono text-slate-400 block tracking-widest">
              ELAPSED SPRINT TIME
            </span>
            <div className="text-5xl sm:text-6xl font-mono font-black tabular-nums tracking-tight text-white my-1">
              {elapsedTime.toFixed(2)}
              <span className="text-xl sm:text-2xl text-slate-400 font-normal ml-1">s</span>
            </div>
            <div className="text-xs font-mono text-cyan-400">
              CURRENT: <strong className="text-white text-sm">{Math.round(telemetry.speed)}</strong> KM/H
            </div>
          </div>
        </div>

        {/* Sprint Splits Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-[#0f1422] border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] font-mono text-slate-400 block">0 - 60 KM/H</span>
            <span className="text-2xl font-mono font-extrabold text-white tabular-nums">
              {split0to60 !== null ? `${split0to60.toFixed(2)}s` : '--'}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">LAUNCH ACCEL</span>
          </div>

          <div className="bg-[#0f1422] border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] font-mono text-slate-400 block">0 - 100 KM/H</span>
            <span className="text-2xl font-mono font-extrabold text-amber-400 tabular-nums">
              {split0to100 !== null ? `${split0to100.toFixed(2)}s` : '--'}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">TARGET FINISH</span>
          </div>

          <div className="bg-[#0f1422] border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] font-mono text-slate-400 block">PEAK ACCEL G</span>
            <span className="text-2xl font-mono font-extrabold text-cyan-400 tabular-nums">
              +{peakG.toFixed(2)}G
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">LONGITUDINAL</span>
          </div>

          <div className="bg-[#0f1422] border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] font-mono text-slate-400 block">ESTIMATED DYNO</span>
            <span className="text-2xl font-mono font-extrabold text-red-400 tabular-nums">
              {peakHp > 0 ? `${peakHp} WHP` : '--'}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
              {peakTorque > 0 ? `${peakTorque} Nm TORQUE` : 'ON-ROAD DYNO'}
            </span>
          </div>
        </div>
      </div>

      {/* On-Road Dyno Graph & Analysis */}
      <div className="bg-[#0b101a] border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              ON-ROAD DYNO ESTIMATOR CURVE
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-red-500" />
              <span>HORSEPOWER (WHP)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-cyan-400" />
              <span>TORQUE (Nm)</span>
            </span>
          </div>
        </div>

        {/* Dyno SVG Graph */}
        <div className="relative w-full h-56 bg-[#070a10] border border-slate-800/80 rounded-2xl p-3">
          <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
            <defs>
              <linearGradient id="hpFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="50" y1="20" x2="480" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="50" y1="60" x2="480" y2="60" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="50" y1="100" x2="480" y2="100" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="50" y1="140" x2="480" y2="140" stroke="#1e293b" strokeDasharray="3 3" />

            {/* Y Axis HP Labels */}
            <text x="42" y="24" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="var(--font-mono)">400</text>
            <text x="42" y="64" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="var(--font-mono)">300</text>
            <text x="42" y="104" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="var(--font-mono)">200</text>
            <text x="42" y="144" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="var(--font-mono)">100</text>

            {/* X Axis RPM Labels */}
            <text x="50" y="165" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="var(--font-mono)">2k</text>
            <text x="157" y="165" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="var(--font-mono)">3.5k</text>
            <text x="265" y="165" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="var(--font-mono)">5k</text>
            <text x="372" y="165" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="var(--font-mono)">6.5k</text>
            <text x="480" y="165" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="var(--font-mono)">8k</text>

            {/* Torque Curve (Cyan) */}
            <path
              d="M 50 135 C 120 70, 180 50, 240 55 C 310 65, 380 90, 480 125"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Horsepower Curve (Red) */}
            <path
              d="M 50 145 C 140 120, 220 80, 310 45 C 380 32, 430 40, 480 65"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Current RPM Cursor Line */}
            {telemetry.rpm >= 2000 && telemetry.rpm <= 8500 && (
              <line
                x1={50 + ((telemetry.rpm - 2000) / 6000) * 430}
                y1="15"
                x2={50 + ((telemetry.rpm - 2000) / 6000) * 430}
                y2="150"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="2 2"
              />
            )}
          </svg>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-xs font-mono text-slate-400">
          <div>
            <span>CURB WEIGHT: </span>
            <strong className="text-white">{profile.curbWeightKg} kg</strong>
          </div>
          <div>
            <span>ENGINE: </span>
            <strong className="text-white">{profile.engine}</strong>
          </div>
          <div>
            <span>DRIVE: </span>
            <strong className="text-white">AWD Turbo (1.0:1 Drag Factor)</strong>
          </div>
        </div>
      </div>

      {/* Sprint Test History Table */}
      <div className="bg-[#0b101a] border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            RECORDED SPRINT LOGS
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="pb-2">WAKTU UJI</th>
                <th className="pb-2">0-60 KM/H</th>
                <th className="pb-2">0-100 KM/H</th>
                <th className="pb-2">PEAK SPEED</th>
                <th className="pb-2">PEAK G</th>
                <th className="pb-2">EST. WHP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sprintHistory.map((run) => (
                <tr key={run.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 text-slate-400">
                    {new Date(run.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 font-bold text-slate-200">{run.time0to60.toFixed(2)}s</td>
                  <td className="py-2.5 font-bold text-amber-400">{run.time0to100.toFixed(2)}s</td>
                  <td className="py-2.5">{run.peakSpeed} km/h</td>
                  <td className="py-2.5 text-cyan-400">+{run.peakGForce}G</td>
                  <td className="py-2.5 font-bold text-red-400">{run.peakHp} WHP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
