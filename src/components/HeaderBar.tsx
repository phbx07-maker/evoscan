/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Gauge, Radio, Bluetooth, Maximize, Minimize } from 'lucide-react';
import { ConnectionMode, ConnectionStatus, VehicleProfile } from '../types/telemetry';

interface HeaderBarProps {
  currentProfile: VehicleProfile;
  connectionMode: ConnectionMode;
  connectionStatus: ConnectionStatus;
  onOpenConnectModal: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  checkEngineLight: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentProfile,
  connectionMode,
  connectionStatus,
  onOpenConnectModal,
  isFullscreen,
  onToggleFullscreen,
  checkEngineLight,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d15]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: EvoFranklin Official Logo & Brand Identification */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-white/20 shadow-md shadow-black/40 bg-slate-900/90 shrink-0 flex items-center justify-center p-0.5 transition-transform hover:scale-105">
            <img
              src="/assets/aistudio/image_fc08f5eb.png"
              alt="EvoFranklin Official Logo"
              className="w-full h-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white leading-none">
                Evoscan
              </span>
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-medium tracking-wide text-white leading-tight mt-0.5">
              Virus and malware scaner
            </span>
          </div>
        </div>

        {/* Zone 2: Vehicle title and CEL status */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-200 truncate max-w-[220px]">
            {currentProfile.name}
          </span>
          <span className="text-slate-500" aria-hidden="true">·</span>
          <span className="font-mono text-slate-400">{currentProfile.engine}</span>

          {checkEngineLight && (
            <div className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[11px] font-mono font-bold animate-pulse">
              <span>⚠ CEL ACTIVE</span>
            </div>
          )}
        </div>

        {/* Zone 3: Connection & HUD action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenConnectModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors border ${
              connectionMode === 'simulation'
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
                : connectionStatus === 'connected'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
            }`}
          >
            {connectionMode === 'simulation' ? (
              <>
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="whitespace-nowrap">SIMULATOR</span>
              </>
            ) : (
              <>
                <Bluetooth className="w-3.5 h-3.5 text-emerald-400" />
                <span className="whitespace-nowrap">OBD-II LIVE</span>
              </>
            )}
          </button>

          <button
            onClick={onToggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
