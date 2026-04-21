export interface DeviceMetadata {
    brand?: string | null;
    model?: string | null;
    deviceName?: string | null;
    osName?: string | null;
    osVersion?: string | null;
    appVersion?: string | null;
    buildNumber?: string | null;
    manufacturer?: string | null;
    isPhysicalDevice?: boolean | null;
}

export class Device {
    private constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly serial: string,
        public readonly ownerId: string,
        public readonly metadata: DeviceMetadata | null,
        public readonly isActive: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        id: string;
        name: string;
        serial: string;
        ownerId: string;
        metadata?: DeviceMetadata | null;
        isActive?: boolean;
    }): Device {
        return new Device(
            props.id,
            props.name,
            props.serial,
            props.ownerId,
            Device.sanitizeMetadata(props.metadata ?? null),
            props.isActive ?? true,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: {
        id: string;
        name: string;
        serial: string;
        ownerId: string;
        metadata: DeviceMetadata | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): Device {
        return new Device(
            props.id,
            props.name,
            props.serial,
            props.ownerId,
            Device.sanitizeMetadata(props.metadata),
            props.isActive,
            props.createdAt,
            props.updatedAt,
        );
    }

    static mapFromPrisma(found: any): Device {
        return Device.reconstitute({
            id: found.id,
            name: found.name,
            serial: found.serial,
            ownerId: found.ownerId,
            metadata: found.metadata,
            isActive: found.isActive,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
        });
    }

    update(props: {
        name?: string;
        metadata?: DeviceMetadata | null;
        isActive?: boolean;
    }): Device {
        return new Device(
            this.id,
            props.name !== undefined ? props.name : this.name,
            this.serial,
            this.ownerId,
            props.metadata !== undefined ? Device.sanitizeMetadata(props.metadata) : this.metadata,
            props.isActive !== undefined ? props.isActive : this.isActive,
            this.createdAt,
            new Date(),
        );
    }

    private static sanitizeMetadata(metadata: DeviceMetadata | null): DeviceMetadata | null {
        if (!metadata) {
            return null;
        }

        return {
            brand: metadata.brand ?? null,
            model: metadata.model ?? null,
            deviceName: metadata.deviceName ?? null,
            osName: metadata.osName ?? null,
            osVersion: metadata.osVersion ?? null,
            appVersion: metadata.appVersion ?? null,
            buildNumber: metadata.buildNumber ?? null,
            manufacturer: metadata.manufacturer ?? null,
            isPhysicalDevice: metadata.isPhysicalDevice ?? null,
        };
    }
}
