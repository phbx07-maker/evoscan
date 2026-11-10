/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  TelemetryData,
  ConnectionMode,
  ConnectionStatus,
  VehicleProfile,
  DtcCode,
  LogSession,
  LoggedDataPoint,
} from './types/telemetry';
import {
  VehicleSimulationEngine,
  VEHICLE_PROFILES,
} from './services/vehicleSimulation';
import { obdBluetoothService } from './services/obdBluetooth';
import { HeaderBar } from './components/HeaderBar';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { RaceCockpit } from './components/RaceCockpit';
import { TelemetryGrid } from './components/TelemetryGrid';
import { PerformanceDyno } from './components/PerformanceDyno';
import { DiagnosticsScanner } from './components/DiagnosticsScanner';
import { DataloggerPanel } from './components/DataloggerPanel';
import { ConnectionModal } from './components/ConnectionModal';

export default function App() {
  const [profile, setProfile] = useState<VehicleProfile>(VEHICLE_PROFILES[0]);
  const simEngineRef = useRef<VehicleSimulationEngine>(new VehicleSimulationEngine(VEHICLE_PROFILES[0]));

  const [activeTab, setActiveTab] = useState<TabType>('cockpit');
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('simulation');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [statusMessage, setStatusMessage] = useState<string>('Simulator ECU aktif');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoShift, setIsAutoShift] = useState(true);

  // Live telemetry state
  const [telemetry, setTelemetry] = useState<TelemetryData>(() => simEngineRef.current.update());
  const [activeDtcs, setActiveDtcs] = useState<DtcCode[]>(() => simEngineRef.current.getActiveDtcs());

  // Datalogger state
  const [isRecording, setIsRecording] = useState(false);
  const [currentLogPoints, setCurrentLogPoints] = useState<LoggedDataPoint[]>([]);
  const [recordedSessions, setRecordedSessions] = useState<LogSession[]>([
    {
      id: 'sample-session-1',
      name: 'Evo IX Dyno Pull 3rd Gear',
      startTime: Date.now() - 7200000,
      durationSeconds: 14.5,
      dataPoints: [
        { timeMs: 0, rpm: 2200, speed: 45, boostPsi: 2.1, throttle: 100, afr: 13.8, coolantTemp: 89, knockCount: 0, timingAdvance: 21 },
        { timeMs: 500, rpm: 3100, speed: 52, boostPsi: 14.5, throttle: 100, afr: 12.1, coolantTemp: 89, knockCount: 0, timingAdvance: 17 },
        { timeMs: 1000, rpm: 4200, speed: 64, boostPsi: 23.8, throttle: 100, afr: 11.4, coolantTemp: 90, knockCount: 0, timingAdvance: 13 },
        { timeMs: 1500, rpm: 5400, speed: 82, boostPsi: 24.2, throttle: 100, afr: 11.2, coolantTemp: 91, knockCount: 0, timingAdvance: 11 },
        { timeMs: 2000, rpm: 6800, speed: 102, boostPsi: 22.8, throttle: 100, afr: 11.3, coolantTemp: 92, knockCount: 1, timingAdvance: 9 },
        { timeMs: 2500, rpm: 7750, speed: 118, boostPsi: 20.5, throttle: 100, afr: 11.4, coolantTemp: 93, knockCount: 1, timingAdvance: 8 },
      ],
    },
  ]);

  // Main high-speed simulation update loop (30 FPS)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      if (now - lastTime >= 33) {
        // ~30Hz update rate
        lastTime = now;
        const nextTelemetry = simEngineRef.current.update(now);
        setTelemetry(nextTelemetry);

        // If recording is active, capture snapshot
        if (isRecording) {
          setCurrentLogPoints((prev) => [
            ...prev,
            {
              timeMs: Date.now(),
              rpm: Math.round(nextTelemetry.rpm),
              speed: Math.round(nextTelemetry.speed),
              boostPsi: Number(nextTelemetry.boostPsi.toFixed(1)),
              throttle: Math.round(nextTelemetry.throttle),
              afr: Number(nextTelemetry.afr.toFixed(2)),
              coolantTemp: Math.round(nextTelemetry.coolantTemp),
              knockCount: nextTelemetry.knockCount,
              timingAdvance: Number(nextTelemetry.timingAdvance.toFixed(1)),
            },
          ]);
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRecording]);

  // Keyboard controls for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space' || e.key === 'ArrowUp') {
        simEngineRef.current.setThrottle(100);
      } else if (e.key === 'ArrowDown') {
        simEngineRef.current.setThrottle(0);
      } else if (e.key === 'r' || e.key === 'R') {
        handleResetVehicle();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space' || e.key === 'ArrowUp') {
        simEngineRef.current.setThrottle(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Profile switch
  const handleSelectProfile = (newProfile: VehicleProfile) => {
    setProfile(newProfile);
    simEngineRef.current.setVehicleProfile(newProfile);
  };

  // Throttle & Shifter actions
  const handleSetThrottle = (pct: number) => {
    simEngineRef.current.setThrottle(pct);
  };

  const handleSetGear = (gear: number) => {
    simEngineRef.current.setGear(gear);
  };

  const handleToggleAutoShift = (enabled?: boolean) => {
    const nextVal = simEngineRef.current.toggleAutoShift(enabled);
    setIsAutoShift(nextVal);
    return nextVal;
  };

  const handleResetVehicle = () => {
    simEngineRef.current.resetToIdle();
  };

  // DTC handlers
  const handleInjectDtc = (dtc: DtcCode) => {
    simEngineRef.current.triggerDtc(dtc);
    setActiveDtcs([...simEngineRef.current.getActiveDtcs()]);
  };

  const handleClearDtcs = () => {
    simEngineRef.current.clearDtcs();
    setActiveDtcs([]);
  };

  // Bluetooth connect
  const handleConnectBluetooth = async () => {
    obdBluetoothService.setCallbacks(
      (status, msg) => {
        setConnectionStatus(status);
        if (msg) setStatusMessage(msg);
      },
      (data) => {
        // Raw serial data from ELM327 parsed here
      }
    );
    const success = await obdBluetoothService.connect();
    if (success) {
      setConnectionMode('bluetooth_obd');
    }
  };

  const handleDisconnectBluetooth = () => {
    obdBluetoothService.disconnect();
    setConnectionMode('simulation');
    setConnectionStatus('connected');
    setStatusMessage('Beralih kembali ke Simulator Realistis.');
  };

  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Datalogger recording toggle
  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop and save
      setIsRecording(false);
      if (currentLogPoints.length > 0) {
        const durationSec = currentLogPoints.length * 0.033;
        const newSession: LogSession = {
          id: `log-${Date.now()}`,
          name: `${profile.name} - ${new Date().toLocaleTimeString()}`,
          startTime: currentLogPoints[0].timeMs,
          durationSeconds: Number(durationSec.toFixed(1)),
          dataPoints: [...currentLogPoints],
        };
        setRecordedSessions((prev) => [newSession, ...prev]);
        setCurrentLogPoints([]);
      }
    } else {
      // Start
      setCurrentLogPoints([]);
      setIsRecording(true);
    }
  };

  // CSV Export
  const handleDownloadCsv = (session: LogSession) => {
    const headers = [
      'Time_ms',
      'RPM',
      'Speed_kmh',
      'Boost_psi',
      'Throttle_pct',
      'AFR',
      'Coolant_C',
      'Knock_count',
      'Timing_deg',
    ];

    const rows = session.dataPoints.map((pt) =>
      [
        pt.timeMs,
        pt.rpm,
        pt.speed,
        pt.boostPsi,
        pt.throttle,
        pt.afr,
        pt.coolantTemp,
        pt.knockCount,
        pt.timingAdvance,
      ].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `evoscan_log_${session.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearSessions = () => {
    setRecordedSessions([]);
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans pb-20 selection:bg-red-500/30">
      {/* Top Header */}
      <HeaderBar
        currentProfile={profile}
        connectionMode={connectionMode}
        connectionStatus={connectionStatus}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        checkEngineLight={telemetry.checkEngineLight}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-3 sm:px-6 pt-4 max-w-7xl w-full mx-auto">
        {activeTab === 'cockpit' && (
          <RaceCockpit
            telemetry={telemetry}
            profile={profile}
            onSetThrottle={handleSetThrottle}
            onSetGear={handleSetGear}
            onToggleAutoShift={handleToggleAutoShift}
            isAutoShift={isAutoShift}
            onResetVehicle={handleResetVehicle}
          />
        )}

        {activeTab === 'telemetry' && (
          <TelemetryGrid telemetry={telemetry} />
        )}

        {activeTab === 'dyno' && (
          <PerformanceDyno
            telemetry={telemetry}
            profile={profile}
            onSetThrottle={handleSetThrottle}
            onResetVehicle={handleResetVehicle}
          />
        )}

        {activeTab === 'diag' && (
          <DiagnosticsScanner
            activeDtcs={activeDtcs}
            checkEngineLight={telemetry.checkEngineLight}
            onClearDtcs={handleClearDtcs}
            onInjectDtc={handleInjectDtc}
          />
        )}

        {activeTab === 'logs' && (
          <DataloggerPanel
            telemetry={telemetry}
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            recordedSessions={recordedSessions}
            currentPointsCount={currentLogPoints.length}
            onDownloadCsv={handleDownloadCsv}
            onClearSessions={handleClearSessions}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isRecording={isRecording}
        hasActiveDtc={activeDtcs.length > 0 || telemetry.checkEngineLight}
      />

      {/* Connection & Profile Modal */}
      <ConnectionModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        connectionMode={connectionMode}
        connectionStatus={connectionStatus}
        currentProfile={profile}
        onSelectProfile={handleSelectProfile}
        onSelectMode={(mode) => {
          setConnectionMode(mode);
          if (mode === 'simulation') {
            setConnectionStatus('connected');
            setStatusMessage('Simulator ECU aktif');
          }
        }}
        onConnectBluetooth={handleConnectBluetooth}
        onDisconnectBluetooth={handleDisconnectBluetooth}
        statusMessage={statusMessage}
      />
    </div>
  );
}
