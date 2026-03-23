import { Device } from '../entities';

export interface IDeviceRepository {
    save(device: Device): Promise<Device>;
    findById(id: string): Promise<Device | null>;
    findMany(query?: {
        ownerId?: string;
        serial?: string;
        isActive?: boolean;
        skip?: number;
        take?: number;
    }): Promise<Device[]>;
    findOne(query: { id?: string; serial?: string; ownerId?: string }): Promise<Device | null>;
    exists(query: { id?: string; serial?: string }): Promise<boolean>;
    count(query?: { ownerId?: string; isActive?: boolean }): Promise<number>;
    delete(id: string): Promise<void>;
}

export const DEVICE_REPOSITORY = Symbol('DEVICE_REPOSITORY');
