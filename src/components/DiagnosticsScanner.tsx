/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DtcCode } from '../types/telemetry';
import { COMMON_DTC_DATABASE } from '../services/vehicleSimulation';
import { AlertTriangle, CheckCircle2, RefreshCw, Trash2, ShieldAlert, Cpu, Bug } from 'lucide-react';

interface DiagnosticsScannerProps {
  activeDtcs: DtcCode[];
  checkEngineLight: boolean;
  onClearDtcs: () => void;
  onInjectDtc: (dtc: DtcCode) => void;
}

export const DiagnosticsScanner: React.FC<DiagnosticsScannerProps> = ({
  activeDtcs,
  checkEngineLight,
  onClearDtcs,
  onInjectDtc,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [selectedDtc, setSelectedDtc] = useState<DtcCode | null>(null);

  const handleScan = () => {
    setIsScanning(true);
    setScanMessage('Connecting to ECU memory (Mode 03 / Mode 07)...');

    setTimeout(() => {
      setIsScanning(false);
      setScanMessage(`Scan selesai: Ditemukan ${activeDtcs.length} kode kerusakan (DTC) aktif.`);
    }, 1200);
  };

  const handleClear = () => {
    onClearDtcs();
    setSelectedDtc(null);
    setScanMessage('Perintah Mode 04 Clear DTCs berhasil dikirim. Lampu CEL padam.');
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-4">
      {/* ECU Scanner Status Banner */}
      <div className="bg-[#0b101a] border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                checkEngineLight
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {checkEngineLight ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                  ECU DIAGNOSTIC TROUBLE CODES (DTC)
                </h2>
                {checkEngineLight ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                    CEL ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ALL SYSTEMS NOMINAL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Standar OBD-II Mode 03 (Stored), Mode 04 (Clear), Mode 07 (Pending)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-mono text-xs flex items-center justify-center gap-2 border border-slate-700 min-h-[44px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'MEMINDAI ECU...' : 'SCAN ECU'}</span>
            </button>

            <button
              onClick={handleClear}
              disabled={activeDtcs.length === 0 && !checkEngineLight}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 min-h-[44px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>HAPUS DTC & RESET CEL</span>
            </button>
          </div>
        </div>

        {scanMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            {scanMessage}
          </div>
        )}
      </div>

      {/* Active Fault Codes List */}
      <div className="bg-[#0b101a] border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              DAFTAR KODE GANGGUAN TERDETEKSI ({activeDtcs.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Klik kode untuk Freeze Frame Data
          </span>
        </div>

        {activeDtcs.length === 0 ? (
          <div className="text-center py-8 px-4 bg-[#070a10] border border-slate-800/80 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <div className="text-sm font-semibold text-slate-200">
              Tidak Ada Kode Kerusakan (DTC)
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Semua sistem emisi, pengapian, dan sensor mesin dalam status normal.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeDtcs.map((dtc) => (
              <div
                key={dtc.code}
                onClick={() => setSelectedDtc(dtc)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedDtc?.code === dtc.code
                    ? 'bg-slate-800 border-red-500/60 shadow-lg'
                    : 'bg-[#0f1422] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-red-600/30 border border-red-500/50 text-red-400 font-mono font-black text-sm">
                      {dtc.code}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {dtc.description}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        SISTEM: {dtc.system} · STATUS: {dtc.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      dtc.severity === 'critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {dtc.severity}
                  </span>
                </div>

                {selectedDtc?.code === dtc.code && dtc.freezeFrame && (
                  <div className="mt-3 pt-3 border-t border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="bg-slate-900/80 p-2 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">RPM SAAT FAULT:</span>
                      <strong className="text-white">{dtc.freezeFrame.rpm} RPM</strong>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">KECEPATAN:</span>
                      <strong className="text-white">{dtc.freezeFrame.speed} KM/H</strong>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">COOLANT TEMP:</span>
                      <strong className="text-white">{dtc.freezeFrame.coolantTemp}°C</strong>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">ENGINE LOAD:</span>
                      <strong className="text-white">{dtc.freezeFrame.load}%</strong>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simulator Fault Injector / Testing Tool */}
      <div className="bg-[#0b101a] border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Bug className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            SIMULASI UJI FAULT INJECTION
          </h3>
        </div>
        <p className="text-xs text-slate-400 font-mono mb-3">
          Uji kemampuan diagnostik dengan menyuntikkan kode kerusakan umum ke sistem simulator:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {COMMON_DTC_DATABASE.slice(0, 3).map((sampleDtc) => (
            <button
              key={sampleDtc.code}
              onClick={() => onInjectDtc(sampleDtc)}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors min-h-[44px]"
            >
              <div className="text-xs font-mono font-bold text-red-400">
                + PICU {sampleDtc.code}
              </div>
              <div className="text-[11px] text-slate-300 truncate mt-0.5">
                {sampleDtc.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
