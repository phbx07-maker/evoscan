/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ConnectionMode, ConnectionStatus, VehicleProfile } from '../types/telemetry';
import { VEHICLE_PROFILES } from '../services/vehicleSimulation';
import { X, Bluetooth, Radio, Cpu, Check, AlertCircle } from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionMode: ConnectionMode;
  connectionStatus: ConnectionStatus;
  currentProfile: VehicleProfile;
  onSelectProfile: (profile: VehicleProfile) => void;
  onSelectMode: (mode: ConnectionMode) => void;
  onConnectBluetooth: () => Promise<void>;
  onDisconnectBluetooth: () => void;
  statusMessage?: string;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  connectionMode,
  connectionStatus,
  currentProfile,
  onSelectProfile,
  onSelectMode,
  onConnectBluetooth,
  onDisconnectBluetooth,
  statusMessage,
}) => {
  const [selectedProtocol, setSelectedProtocol] = useState('AUTO');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b101a] border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/image_fc08f5eb.png"
              alt="Evo Franklin"
              className="w-7 h-7 rounded-lg border border-cyan-500/40 object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                KONEKSI TELEMETRI OBD-II
              </h2>
              <div className="text-[10px] font-mono text-cyan-400">
                EVO FRANKLIN ECOSYSTEM
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Mode Selector (Simulation vs Physical OBD-II) */}
        <div>
          <label className="text-xs font-mono text-slate-400 block mb-2 font-semibold">
            PILIH SUMBER DATA (CONNECTION MODE):
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onSelectMode('simulation')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[48px] ${
                connectionMode === 'simulation'
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Radio className="w-4 h-4 text-cyan-400" />
                {connectionMode === 'simulation' && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold font-mono">SIMULATOR REALISTIS</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Fisika mesin turbo interaktif langsung di browser
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelectMode('bluetooth_obd')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[48px] ${
                connectionMode === 'bluetooth_obd'
                  ? 'bg-red-950/40 border-red-500 text-red-200 shadow-lg shadow-red-950/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Bluetooth className="w-4 h-4 text-red-400" />
                {connectionMode === 'bluetooth_obd' && <Check className="w-4 h-4 text-red-400" />}
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold font-mono">BLUETOOTH OBD-II</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Dongle ELM327 / OpenPort via Web Bluetooth
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* If Bluetooth Mode is Selected */}
        {connectionMode === 'bluetooth_obd' && (
          <div className="bg-[#070a10] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300">
                STATUS ADAPTER OBD-II
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : connectionStatus === 'connecting'
                    ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {connectionStatus}
              </span>
            </div>

            {statusMessage && (
              <div className="text-xs font-mono text-slate-400 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="pt-2">
              {connectionStatus === 'connected' ? (
                <button
                  onClick={onDisconnectBluetooth}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 font-mono text-xs font-bold border border-slate-700 min-h-[44px]"
                >
                  PUTUSKAN KONEKSI (DISCONNECT)
                </button>
              ) : (
                <button
                  onClick={onConnectBluetooth}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-md shadow-red-600/30 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Bluetooth className="w-4 h-4" />
                  <span>HUBUNGKAN DONGLE ELM327</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Vehicle Profile Selection (For Simulator & Dyno Specs) */}
        <div>
          <label className="text-xs font-mono text-slate-400 block mb-2 font-semibold">
            PILIH PROFIL KENDARAAN (SPEK MESIN & DYNO):
          </label>
          <div className="space-y-2">
            {VEHICLE_PROFILES.map((prof) => {
              const isSelected = prof.id === currentProfile.id;
              return (
                <div
                  key={prof.id}
                  onClick={() => onSelectProfile(prof)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-red-500 shadow-md text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold font-mono">{prof.name}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {prof.engine} · Redline {prof.redlineRpm} RPM · Max {prof.maxBoostPsi} PSI
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-red-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Protocol Settings */}
        <div>
          <label className="text-xs font-mono text-slate-400 block mb-1.5 font-semibold">
            OBD-II PROTOCOL BUS:
          </label>
          <select
            value={selectedProtocol}
            onChange={(e) => setSelectedProtocol(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
          >
            <option value="AUTO">AUTO DETECT (Recommended)</option>
            <option value="ISO_15765_CAN_11_500">ISO 15765-4 CAN (11 bit ID, 500 kbaud)</option>
            <option value="ISO_15765_CAN_29_500">ISO 15765-4 CAN (29 bit ID, 500 kbaud)</option>
            <option value="MUT_III">MUT-III Mitsubishi High Speed Protocol</option>
            <option value="ISO_14230_KWP">ISO 14230-4 KWP (Fast Init, 10.4 kbaud)</option>
          </select>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-colors min-h-[44px]"
          >
            SIMPAN & TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
