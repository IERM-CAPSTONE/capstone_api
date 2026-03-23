export type DeviceApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class DeviceApplication {
    private constructor(
        public readonly id: string,
        public readonly deviceId: string,
        public readonly registeredBy: string,
        public readonly status: DeviceApplicationStatus,
        public readonly approvedBy: string | null,
        public readonly approvedAt: Date | null,
        public readonly rejectedReason: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        id: string;
        deviceId: string;
        registeredBy: string;
    }): DeviceApplication {
        return new DeviceApplication(
            props.id,
            props.deviceId,
            props.registeredBy,
            'PENDING',
            null,
            null,
            null,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: {
        id: string;
        deviceId: string;
        registeredBy: string;
        status: DeviceApplicationStatus;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): DeviceApplication {
        return new DeviceApplication(
            props.id,
            props.deviceId,
            props.registeredBy,
            props.status,
            props.approvedBy,
            props.approvedAt,
            props.rejectedReason,
            props.createdAt,
            props.updatedAt,
        );
    }

    static mapFromPrisma(found: any): DeviceApplication {
        return DeviceApplication.reconstitute({
            id: found.id,
            deviceId: found.deviceId,
            registeredBy: found.registeredBy,
            status: found.status,
            approvedBy: found.approvedBy,
            approvedAt: found.approvedAt,
            rejectedReason: found.rejectedReason,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
        });
    }

    update(props: {
        status?: DeviceApplicationStatus;
        approvedBy?: string | null;
        approvedAt?: Date | null;
        rejectedReason?: string | null;
    }): DeviceApplication {
        return new DeviceApplication(
            this.id,
            this.deviceId,
            this.registeredBy,
            props.status !== undefined ? props.status : this.status,
            props.approvedBy !== undefined ? props.approvedBy : this.approvedBy,
            props.approvedAt !== undefined ? props.approvedAt : this.approvedAt,
            props.rejectedReason !== undefined ? props.rejectedReason : this.rejectedReason,
            this.createdAt,
            new Date(),
        );
    }
}
