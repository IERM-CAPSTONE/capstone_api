/**
 * Role Value Object
 */
export enum RoleType {
    ADMIN = 'ADMIN',
    EXAM_OFFICER = 'EXAM_OFFICER',
    PROCTOR = 'PROCTOR',
    STUDENT = 'STUDENT',
}

export class Role {
    private constructor(private readonly _value: RoleType) { }

    get value(): RoleType {
        return this._value;
    }

    static create(role: RoleType): Role {
        if (!Object.values(RoleType).includes(role)) {
            throw new Error(`Invalid role: ${role}`);
        }
        return new Role(role);
    }

    static fromString(role: string): Role {
        const roleType = RoleType[role as keyof typeof RoleType];
        if (!roleType) {
            throw new Error(`Invalid role string: ${role}`);
        }
        return new Role(roleType);
    }

    equals(other: Role): boolean {
        return this._value === other._value;
    }

    isAdmin(): boolean {
        return this._value === RoleType.ADMIN;
    }

    isExamOfficer(): boolean {
        return this._value === RoleType.EXAM_OFFICER;
    }

    isProctor(): boolean {
        return this._value === RoleType.PROCTOR;
    }

    isStudent(): boolean {
        return this._value === RoleType.STUDENT;
    }

    canManageUsers(): boolean {
        return this.isAdmin() || this.isExamOfficer();
    }

    toString(): string {
        return this._value;
    }
}
