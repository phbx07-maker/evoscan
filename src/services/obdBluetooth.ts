/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConnectionStatus } from '../types/telemetry';

export class ObdBluetoothService {
  private device: any = null;
  private server: any = null;
  private characteristic: any = null;
  private status: ConnectionStatus = 'disconnected';
  private onStatusChangeCallback: ((status: ConnectionStatus, message?: string) => void) | null = null;
  private onDataCallback: ((rawText: string) => void) | null = null;

  public setCallbacks(
    onStatusChange: (status: ConnectionStatus, message?: string) => void,
    onData: (rawText: string) => void
  ) {
    this.onStatusChangeCallback = onStatusChange;
    this.onDataCallback = onData;
  }

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public async connect(): Promise<boolean> {
    if (!this.isBluetoothSupported()) {
      this.status = 'error';
      this.onStatusChangeCallback?.('error', 'Browser tidak mendukung Web Bluetooth API. Gunakan Chrome di Android/Desktop.');
      return false;
    }

    try {
      this.status = 'connecting';
      this.onStatusChangeCallback?.('connecting', 'Mencari perangkat OBD-II ELM327 Bluetooth...');

      // Common OBD-II ELM327 BLE / SPP Service UUIDs
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '0000fff0-0000-1000-8000-00805f9b34fb',
          '000018f0-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '0000fee7-0000-1000-8000-00805f9b34fb',
        ],
      });

      this.device = device;
      this.onStatusChangeCallback?.('connecting', `Menghubungkan ke ${device.name || 'OBD Device'}...`);

      const server = await device.gatt.connect();
      this.server = server;

      // Try discovering primary services
      let primaryService;
      try {
        const services = await server.getPrimaryServices();
        if (services && services.length > 0) {
          primaryService = services[0];
        }
      } catch (err) {
        // Fallback
      }

      if (primaryService) {
        const characteristics = await primaryService.getCharacteristics();
        if (characteristics && characteristics.length > 0) {
          this.characteristic = characteristics[0];
          await this.characteristic.startNotifications();
          this.characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
            const value = event.target.value;
            const decoder = new TextDecoder('utf-8');
            const str = decoder.decode(value);
            this.onDataCallback?.(str);
          });
        }
      }

      this.status = 'connected';
      this.onStatusChangeCallback?.('connected', `Terhubung ke ${device.name || 'ELM327'}`);
      return true;
    } catch (error: any) {
      this.status = 'error';
      const msg = error?.message || 'Gagal terhubung ke perangkat OBD-II.';
      this.onStatusChangeCallback?.('error', msg);
      return false;
    }
  }

  public disconnect() {
    try {
      if (this.server && this.server.connected) {
        this.server.disconnect();
      }
      this.device = null;
      this.server = null;
      this.characteristic = null;
      this.status = 'disconnected';
      this.onStatusChangeCallback?.('disconnected', 'Terputus dari OBD-II.');
    } catch (e) {
      // Ignore
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }
}

export const obdBluetoothService = new ObdBluetoothService();
