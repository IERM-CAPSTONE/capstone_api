import { DeviceApplication } from '../entities';

export interface IDeviceApplicationRepository {
    save(application: DeviceApplication): Promise<DeviceApplication>;
    findById(id: string): Promise<DeviceApplication | null>;
    findMany(query?: {
        deviceId?: string;
        registeredBy?: string;
        status?: string;
        skip?: number;
        take?: number;
    }): Promise<DeviceApplication[]>;
    findOne(query: { id?: string; deviceId?: string; registeredBy?: string; status?: string }): Promise<DeviceApplication | null>;
    exists(query: { id?: string; deviceId?: string }): Promise<boolean>;
    count(query?: { deviceId?: string; registeredBy?: string; status?: string }): Promise<number>;
    delete(id: string): Promise<void>;
}

export const DEVICE_APPLICATION_REPOSITORY = Symbol('DEVICE_APPLICATION_REPOSITORY');
