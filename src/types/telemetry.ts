/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TelemetryData {
  timestamp: number;
  rpm: number;
  speed: number; // in km/h
  gear: number; // 0 = Neutral, 1-6 = Gears, -1 = Reverse
  throttle: number; // 0 - 100 %
  boostPsi: number; // negative is inHg vacuum (-30 to 0), positive is PSI boost (0 to 35)
  afr: number; // Air-fuel ratio, typically 10.0 to 18.0
  coolantTemp: number; // in Celsius (e.g. 85-105 C)
  intakeAirTemp: number; // in Celsius (e.g. 25-60 C)
  timingAdvance: number; // degrees BTDC (-5 to 45 deg)
  knockCount: number; // counts (0 = safe, >3 = warning)
  batteryVolts: number; // Volts (12.4 to 14.4 V)
  mafAirflow: number; // g/sec (e.g. 3.5 to 280 g/s)
  stft: number; // Short term fuel trim % (-25% to +25%)
  ltft: number; // Long term fuel trim % (-25% to +25%)
  oilPressurePsi: number; // PSI (20 to 85 PSI)
  gForceLat: number; // Lateral G (-1.5 to +1.5)
  gForceLong: number; // Longitudinal G (-1.5 to +1.5)
  checkEngineLight: boolean;
}

export type ConnectionMode = 'simulation' | 'bluetooth_obd' | 'wifi_obd';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface VehicleProfile {
  id: string;
  name: string;
  engine: string;
  displacement: string;
  curbWeightKg: number;
  redlineRpm: number;
  maxBoostPsi: number;
  gearRatios: number[];
  finalDrive: number;
  tireCircumferenceMeters: number;
}

export interface DtcCode {
  code: string;
  system: 'Powertrain' | 'Chassis' | 'Body' | 'Network';
  description: string;
  severity: 'mild' | 'moderate' | 'critical';
  status: 'active' | 'pending' | 'historical';
  freezeFrame?: {
    rpm: number;
    speed: number;
    coolantTemp: number;
    load: number;
  };
}

export interface SprintRunResult {
  id: string;
  timestamp: number;
  target: string;
  time0to60: number; // in seconds
  time0to100: number; // in seconds
  timeQuarterMile?: number; // in seconds
  peakSpeed: number; // km/h
  peakGForce: number; // G
  peakHp: number; // WHP
  peakTorque: number; // Nm
}

export interface LoggedDataPoint {
  timeMs: number;
  rpm: number;
  speed: number;
  boostPsi: number;
  throttle: number;
  afr: number;
  coolantTemp: number;
  knockCount: number;
  timingAdvance: number;
}

export interface LogSession {
  id: string;
  name: string;
  startTime: number;
  durationSeconds: number;
  dataPoints: LoggedDataPoint[];
}
