/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VehicleProfile, TelemetryData, DtcCode } from '../types/telemetry';

export const VEHICLE_PROFILES: VehicleProfile[] = [
  {
    id: 'evo-9-mr',
    name: 'Mitsubishi Lancer Evolution IX MR',
    engine: '2.0L 4G63T MIVEC Turbo',
    displacement: '1997 cc',
    curbWeightKg: 1410,
    redlineRpm: 7800,
    maxBoostPsi: 24.5,
    gearRatios: [3.20, 2.11, 1.45, 1.10, 0.85, 0.69],
    finalDrive: 4.58,
    tireCircumferenceMeters: 2.01,
  },
  {
    id: 'wrx-sti',
    name: 'Subaru Impreza WRX STI',
    engine: '2.5L EJ257 Boxer Turbo',
    displacement: '2457 cc',
    curbWeightKg: 1530,
    redlineRpm: 7200,
    maxBoostPsi: 19.0,
    gearRatios: [3.63, 2.23, 1.52, 1.13, 0.97, 0.75],
    finalDrive: 3.90,
    tireCircumferenceMeters: 2.04,
  },
  {
    id: 'gr-yaris',
    name: 'Toyota GR Yaris High Performance',
    engine: '1.6L G16E-GTS 3-Cyl Turbo',
    displacement: '1618 cc',
    curbWeightKg: 1280,
    redlineRpm: 7200,
    maxBoostPsi: 23.2,
    gearRatios: [3.53, 2.23, 1.53, 1.16, 0.91, 0.73],
    finalDrive: 3.94,
    tireCircumferenceMeters: 1.98,
  },
  {
    id: 'gtr-r35',
    name: 'Nissan GT-R Nismo Spec',
    engine: '3.8L VR38DETT Twin-Turbo',
    displacement: '3799 cc',
    curbWeightKg: 1720,
    redlineRpm: 7100,
    maxBoostPsi: 17.5,
    gearRatios: [4.05, 2.30, 1.59, 1.24, 1.00, 0.79],
    finalDrive: 3.70,
    tireCircumferenceMeters: 2.15,
  },
];

export const COMMON_DTC_DATABASE: DtcCode[] = [
  {
    code: 'P0300',
    system: 'Powertrain',
    description: 'Random / Multiple Cylinder Misfire Detected',
    severity: 'critical',
    status: 'active',
  },
  {
    code: 'P0171',
    system: 'Powertrain',
    description: 'System Too Lean (Bank 1) - Fuel Trim Exhaust Lean Condition',
    severity: 'moderate',
    status: 'active',
  },
  {
    code: 'P0234',
    system: 'Powertrain',
    description: 'Turbocharger Engine Overboost Condition (Wastegate Target Exceeded)',
    severity: 'critical',
    status: 'active',
  },
  {
    code: 'P0118',
    system: 'Powertrain',
    description: 'Engine Coolant Temperature Circuit High Input',
    severity: 'mild',
    status: 'pending',
  },
  {
    code: 'P0420',
    system: 'Powertrain',
    description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    severity: 'mild',
    status: 'historical',
  },
];

export class VehicleSimulationEngine {
  private profile: VehicleProfile;
  private telemetry: TelemetryData;
  private targetThrottle = 0;
  private isAutoShift = true;
  private dtcCodes: DtcCode[] = [];
  private lastUpdateTimestamp = performance.now();
  private revLimiterBounce = false;

  constructor(profile: VehicleProfile = VEHICLE_PROFILES[0]) {
    this.profile = profile;
    this.telemetry = this.getInitialState();
  }

  public setVehicleProfile(profile: VehicleProfile) {
    this.profile = profile;
  }

  public getVehicleProfile(): VehicleProfile {
    return this.profile;
  }

  public setThrottle(pct: number) {
    this.targetThrottle = Math.max(0, Math.min(100, pct));
  }

  public getTargetThrottle(): number {
    return this.targetThrottle;
  }

  public setGear(gear: number) {
    this.telemetry.gear = Math.max(0, Math.min(6, gear));
  }

  public toggleAutoShift(enabled?: boolean) {
    this.isAutoShift = enabled !== undefined ? enabled : !this.isAutoShift;
    return this.isAutoShift;
  }

  public getAutoShift(): boolean {
    return this.isAutoShift;
  }

  public getActiveDtcs(): DtcCode[] {
    return this.dtcCodes;
  }

  public triggerDtc(code: DtcCode) {
    if (!this.dtcCodes.some((d) => d.code === code.code)) {
      this.dtcCodes.push({
        ...code,
        freezeFrame: {
          rpm: Math.round(this.telemetry.rpm),
          speed: Math.round(this.telemetry.speed),
          coolantTemp: Math.round(this.telemetry.coolantTemp),
          load: Math.round(this.telemetry.throttle),
        },
      });
      this.telemetry.checkEngineLight = true;
    }
  }

  public clearDtcs(): boolean {
    this.dtcCodes = [];
    this.telemetry.checkEngineLight = false;
    return true;
  }

  public resetToIdle() {
    this.targetThrottle = 0;
    this.telemetry.speed = 0;
    this.telemetry.rpm = 850;
    this.telemetry.gear = 1;
    this.telemetry.boostPsi = -21.4;
    this.telemetry.throttle = 0;
    this.telemetry.knockCount = 0;
    this.telemetry.gForceLat = 0;
    this.telemetry.gForceLong = 0;
  }

  private getInitialState(): TelemetryData {
    return {
      timestamp: Date.now(),
      rpm: 850,
      speed: 0,
      gear: 1,
      throttle: 0,
      boostPsi: -21.8,
      afr: 14.7,
      coolantTemp: 89,
      intakeAirTemp: 32,
      timingAdvance: 14.5,
      knockCount: 0,
      batteryVolts: 14.2,
      mafAirflow: 4.2,
      stft: 0.8,
      ltft: -1.2,
      oilPressurePsi: 38.5,
      gForceLat: 0.0,
      gForceLong: 0.0,
      checkEngineLight: false,
    };
  }

  public update(now: number = performance.now()): TelemetryData {
    const dt = Math.min((now - this.lastUpdateTimestamp) / 1000, 0.1);
    this.lastUpdateTimestamp = now;

    // Smooth throttle interpolation
    const throttleDiff = this.targetThrottle - this.telemetry.throttle;
    this.telemetry.throttle += throttleDiff * Math.min(1, dt * 12);
    const throttle = this.telemetry.throttle;

    // Gear ratios
    const currentGear = this.telemetry.gear;
    const gearRatio = currentGear > 0 ? this.profile.gearRatios[currentGear - 1] : 0;
    const totalRatio = gearRatio * this.profile.finalDrive;

    // In gear with clutch engaged
    if (currentGear === 0) {
      // Neutral revving
      const targetRpm = 850 + (throttle / 100) * (this.profile.redlineRpm - 850);
      const rpmRate = throttle > 10 ? 8000 : 4500;
      if (this.telemetry.rpm < targetRpm) {
        this.telemetry.rpm = Math.min(targetRpm, this.telemetry.rpm + rpmRate * dt);
      } else {
        this.telemetry.rpm = Math.max(targetRpm, this.telemetry.rpm - 5000 * dt);
      }
      this.telemetry.speed = Math.max(0, this.telemetry.speed - 12 * dt);
    } else {
      // Vehicle in gear (1-6)
      // Rev limiter detection
      if (this.telemetry.rpm >= this.profile.redlineRpm) {
        this.revLimiterBounce = !this.revLimiterBounce;
        if (this.revLimiterBounce) {
          this.telemetry.rpm = this.profile.redlineRpm - 250;
        }
      }

      // Acceleration force based on throttle and turbo boost
      const effectiveThrottle = throttle / 100;
      const boostSpool = Math.max(0, this.telemetry.boostPsi) / this.profile.maxBoostPsi;
      const enginePowerCoeff = 0.4 + 0.6 * boostSpool;
      const tractiveForce = effectiveThrottle * 4200 * enginePowerCoeff * (gearRatio / 1.5);
      
      // Resistances: Aero drag + Rolling resistance
      const vMs = (this.telemetry.speed * 1000) / 3600;
      const aeroDrag = 0.5 * 1.225 * 0.35 * 2.1 * (vMs * vMs);
      const rollingResistance = this.profile.curbWeightKg * 9.81 * 0.015;
      const netForce = tractiveForce - aeroDrag - rollingResistance;
      
      const accelMs2 = netForce / this.profile.curbWeightKg;
      const prevSpeed = this.telemetry.speed;
      const newSpeed = Math.max(0, this.telemetry.speed + (accelMs2 * 3.6) * dt);
      this.telemetry.speed = newSpeed;

      // Longitudinal G-Force
      const gLong = (newSpeed - prevSpeed) / (3.6 * Math.max(dt, 0.001) * 9.81);
      this.telemetry.gForceLong = Number(Math.max(-1.5, Math.min(1.5, gLong)).toFixed(2));

      // Calculate RPM directly from speed & gear ratio
      if (totalRatio > 0 && this.profile.tireCircumferenceMeters > 0) {
        // speed (km/h) = (RPM / totalRatio) * tireCircumference (m) * 60 / 1000
        // RPM = speed * 1000 * totalRatio / (tireCircumference * 60)
        const calculatedRpm = (this.telemetry.speed * 1000 * totalRatio) / (this.profile.tireCircumferenceMeters * 60);
        this.telemetry.rpm = Math.max(850, Math.min(this.profile.redlineRpm + 100, calculatedRpm));
      }

      // Automatic gear shifting logic
      if (this.isAutoShift) {
        if (this.telemetry.rpm >= this.profile.redlineRpm - 300 && currentGear < 6) {
          this.telemetry.gear += 1;
        } else if (this.telemetry.rpm <= 1800 && currentGear > 1 && throttle < 30) {
          this.telemetry.gear -= 1;
        }
      }
    }

    // Turbo Boost Calculation
    // Below 2500 RPM, turbo doesn't spool fully. Above 3200 RPM, builds full target boost.
    if (throttle > 5) {
      const spoolCapability = Math.min(1, Math.max(0, (this.telemetry.rpm - 1800) / 1800));
      const targetBoost = (throttle / 100) * this.profile.maxBoostPsi * spoolCapability;
      const vacuumOffset = -22 * (1 - throttle / 100);
      const desiredBoostOrVac = targetBoost > 0 ? targetBoost : vacuumOffset;
      const spoolSpeed = targetBoost > this.telemetry.boostPsi ? 18 : 30;
      this.telemetry.boostPsi += (desiredBoostOrVac - this.telemetry.boostPsi) * Math.min(1, dt * spoolSpeed);
    } else {
      // Idle vacuum: -20 to -23 inHg
      const idleVac = -22.5 + Math.sin(now / 500) * 0.6;
      this.telemetry.boostPsi += (idleVac - this.telemetry.boostPsi) * Math.min(1, dt * 8);
    }

    // AFR (Air-Fuel Ratio): Stoich 14.7, Rich under boost 11.2, Lean under decel 16.5-19.0
    if (throttle < 2 && this.telemetry.rpm > 1500) {
      this.telemetry.afr = 17.5 + Math.random() * 0.4; // Fuel cut decel
    } else if (this.telemetry.boostPsi > 5) {
      const boostFraction = Math.min(1, this.telemetry.boostPsi / this.profile.maxBoostPsi);
      this.telemetry.afr = 13.5 - boostFraction * 2.3 + (Math.random() - 0.5) * 0.15;
    } else {
      this.telemetry.afr = 14.7 + (Math.random() - 0.5) * 0.25;
    }

    // Dynamic Coolant and Intake Temp
    const baseTemp = 90;
    const loadTempIncrease = (this.telemetry.boostPsi > 0 ? this.telemetry.boostPsi : 0) * 0.35;
    this.telemetry.coolantTemp += ((baseTemp + loadTempIncrease) - this.telemetry.coolantTemp) * dt * 0.1;

    // Intake Air Temp (IAT)
    const baseIat = 28;
    const boostIat = (Math.max(0, this.telemetry.boostPsi) / 2) * 1.2;
    this.telemetry.intakeAirTemp += ((baseIat + boostIat) - this.telemetry.intakeAirTemp) * dt * 0.2;

    // Timing Advance (BTDC)
    // Advance decreases under high boost to prevent knock
    if (this.telemetry.boostPsi > 5) {
      this.telemetry.timingAdvance = Math.max(6, 24 - (this.telemetry.boostPsi / 24) * 14 + (Math.random() - 0.5) * 0.8);
    } else {
      this.telemetry.timingAdvance = 14 + (this.telemetry.rpm / 4000) * 18 + (Math.random() - 0.5) * 0.5;
    }

    // Knock Count (occasional knock if high boost + high coolant temp)
    if (this.telemetry.boostPsi > 18 && this.telemetry.coolantTemp > 95 && Math.random() < 0.03) {
      this.telemetry.knockCount += 1;
    }

    // Battery Voltage
    this.telemetry.batteryVolts = 14.2 + (this.telemetry.rpm > 2000 ? 0.2 : 0) + (Math.sin(now / 1000) * 0.1);

    // MAF Airflow (g/s)
    this.telemetry.mafAirflow = (this.telemetry.rpm * (this.telemetry.boostPsi > 0 ? 1 + this.telemetry.boostPsi / 14.7 : 0.85)) / 42;

    // Fuel trims
    this.telemetry.stft = Number((Math.sin(now / 1500) * 2.5).toFixed(1));
    this.telemetry.ltft = -1.1;

    // Oil pressure proportional to RPM
    this.telemetry.oilPressurePsi = 22 + (this.telemetry.rpm / 8000) * 62 + (Math.random() - 0.5) * 0.8;

    // Lateral G Force (simulated road sway / steering curve)
    if (this.telemetry.speed > 20) {
      this.telemetry.gForceLat = Number((Math.sin(now / 2200) * (this.telemetry.speed / 140)).toFixed(2));
    } else {
      this.telemetry.gForceLat = 0;
    }

    this.telemetry.timestamp = Date.now();
    return { ...this.telemetry };
  }
}
