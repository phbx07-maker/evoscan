/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TelemetryData, LogSession, LoggedDataPoint } from '../types/telemetry';
import { FileSpreadsheet, Play, Square, Download, Trash2, Database, Eye } from 'lucide-react';

interface DataloggerPanelProps {
  telemetry: TelemetryData;
  isRecording: boolean;
  onToggleRecording: () => void;
  recordedSessions: LogSession[];
  currentPointsCount: number;
  onDownloadCsv: (session: LogSession) => void;
  onClearSessions: () => void;
}

export const DataloggerPanel: React.FC<DataloggerPanelProps> = ({
  telemetry,
  isRecording,
  onToggleRecording,
  recordedSessions,
  currentPointsCount,
  onDownloadCsv,
  onClearSessions,
}) => {
  const [selectedSession, setSelectedSession] = useState<LogSession | null>(null);

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-4">
      {/* Recording Control Console */}
      <div className="bg-[#0b101a] border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-600/20 text-red-400">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                HIGH-SPEED ECU DATALOGGER & CSV EXPORT
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Sample rate 25Hz per channel · Format kompatibel EvoScan, MegaLogViewer & Excel
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onToggleRecording}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all min-h-[48px] ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/40 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>STOP REKAMAN ({currentPointsCount} PTS)</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>MULAI REKAMAN BARU</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Channel Monitor Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-[#070a10] p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-500 block text-[10px]">CURRENT RPM:</span>
            <strong className="text-white text-base tabular-nums">{Math.round(telemetry.rpm)}</strong>
          </div>
          <div className="bg-[#070a10] p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-500 block text-[10px]">SPEED:</span>
            <strong className="text-cyan-400 text-base tabular-nums">{Math.round(telemetry.speed)} km/h</strong>
          </div>
          <div className="bg-[#070a10] p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-500 block text-[10px]">BOOST:</span>
            <strong className="text-amber-400 text-base tabular-nums">
              {telemetry.boostPsi >= 0 ? `+${telemetry.boostPsi.toFixed(1)}` : telemetry.boostPsi.toFixed(1)} PSI
            </strong>
          </div>
          <div className="bg-[#070a10] p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-500 block text-[10px]">AFR LAMBDA:</span>
            <strong className="text-emerald-400 text-base tabular-nums">{telemetry.afr.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Saved Sessions & CSV Downloads */}
      <div className="bg-[#0b101a] border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              SESI REKAMAN TERSIMPAN ({recordedSessions.length})
            </h3>
          </div>

          {recordedSessions.length > 0 && (
            <button
              onClick={onClearSessions}
              className="text-xs font-mono text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>HAPUS SEMUA SESI</span>
            </button>
          )}
        </div>

        {recordedSessions.length === 0 ? (
          <div className="text-center py-8 px-4 bg-[#070a10] border border-slate-800/80 rounded-2xl">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-300">
              Belum Ada Sesi Datalog
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Tekan tombol "MULAI REKAMAN BARU" di atas untuk merekam telemetri saat akselerasi.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recordedSessions.map((session) => (
              <div
                key={session.id}
                className="bg-[#0f1422] border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">
                      {session.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {session.dataPoints.length} SAMPLES
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Durasi: {session.durationSeconds.toFixed(1)} detik · Dimulai pada:{' '}
                    {new Date(session.startTime).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedSession(session === selectedSession ? null : session)}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>PREVIEW TABEL</span>
                  </button>

                  <button
                    onClick={() => onDownloadCsv(session)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 min-h-[44px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>EXPORT CSV</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Session Preview Table */}
        {selectedSession && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-slate-300">
                PREVIEW 10 SAMPEL DARI {selectedSession.name}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Total {selectedSession.dataPoints.length} baris
              </span>
            </div>

            <div className="overflow-x-auto bg-[#070a10] border border-slate-800 rounded-xl p-2">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-1.5">TIME (ms)</th>
                    <th className="p-1.5">RPM</th>
                    <th className="p-1.5">SPEED (km/h)</th>
                    <th className="p-1.5">BOOST (psi)</th>
                    <th className="p-1.5">THROTTLE (%)</th>
                    <th className="p-1.5">AFR</th>
                    <th className="p-1.5">KNOCK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {selectedSession.dataPoints.slice(0, 10).map((pt, i) => (
                    <tr key={i}>
                      <td className="p-1.5 text-slate-500">{pt.timeMs}</td>
                      <td className="p-1.5 text-white font-bold">{Math.round(pt.rpm)}</td>
                      <td className="p-1.5 text-cyan-400">{Math.round(pt.speed)}</td>
                      <td className="p-1.5 text-amber-400">{pt.boostPsi.toFixed(1)}</td>
                      <td className="p-1.5">{Math.round(pt.throttle)}%</td>
                      <td className="p-1.5 text-emerald-400">{pt.afr.toFixed(2)}</td>
                      <td className="p-1.5">{pt.knockCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
