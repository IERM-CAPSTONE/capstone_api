import { Email } from '../value-objects/email.vo';
import { Role, RoleType } from '../value-objects/role.vo';
import { UserCode } from '../value-objects/user-code.vo';

/**
 * User Entity
 * Rich domain model with encapsulated business logic
 */
export class User {
    private constructor(
        private readonly _id: string,
        private _email: Email,
        private _fullName: string | null,
        private _code: UserCode | null,
        private _avatarUrl: string | null,
        private _isActive: boolean,
        private _role: Role | null,
        private readonly _createdAt: Date,
        private _updatedAt: Date,
    ) { }

    // ==================== GETTERS ====================

    get id(): string {
        return this._id;
    }

    get email(): Email {
        return this._email;
    }

    get fullName(): string | null {
        return this._fullName;
    }

    get code(): UserCode | null {
        return this._code;
    }

    get avatarUrl(): string | null {
        return this._avatarUrl;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get role(): Role | null {
        return this._role;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    get updatedAt(): Date {
        return this._updatedAt;
    }

    // ==================== FACTORY METHODS ====================

    /**
     * Create new User entity
     */
    static create(props: {
        id: string;
        email: string;
        fullName?: string;
        code?: string;
        avatarUrl?: string;
        role?: RoleType;
        isActive?: boolean;
    }): User {
        const email = Email.create(props.email);
        const code = props.code ? UserCode.create(props.code) : null;
        const role = props.role ? Role.create(props.role) : null;

        return new User(
            props.id,
            email,
            props.fullName ?? null,
            code,
            props.avatarUrl ?? null,
            props.isActive ?? true,
            role,
            new Date(),
            new Date(),
        );
    }

    /**
     * Reconstitute User entity from persistence data
     */
    static fromPersistence(props: {
        id: string;
        email: string;
        fullName: string | null;
        code: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        role: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): User {
        return new User(
            props.id,
            Email.create(props.email),
            props.fullName,
            props.code ? UserCode.create(props.code) : null,
            props.avatarUrl,
            props.isActive,
            props.role ? Role.create(props.role as RoleType) : null,
            props.createdAt,
            props.updatedAt,
        );
    }



    // ==================== COMMANDS (Mutating Methods) ====================

    /**
     * Update user profile
     */
    updateProfile(props: {
        fullName?: string;
        code?: string;
        avatarUrl?: string;
    }): void {
        if (props.fullName !== undefined) {
            this._fullName = props.fullName || null;
        }
        if (props.code !== undefined) {
            this._code = props.code ? UserCode.create(props.code) : null;
        }
        if (props.avatarUrl !== undefined) {
            this._avatarUrl = props.avatarUrl || null;
        }
        this._updatedAt = new Date();
    }

    /**
     * Update user email
     */
    updateEmail(email: string): void {
        this._email = Email.create(email);
        this._updatedAt = new Date();
    }

    /**
     * Change user role
     */
    changeRole(roleType: RoleType): void {
        this._role = Role.create(roleType);
        this._updatedAt = new Date();
    }

    /**
     * Activate user account
     */
    activate(): void {
        if (this._isActive) {
            throw new Error('User is already active');
        }
        this._isActive = true;
        this._updatedAt = new Date();
    }

    /**
     * Deactivate user account
     */
    deactivate(): void {
        if (!this._isActive) {
            throw new Error('User is already inactive');
        }
        this._isActive = false;
        this._updatedAt = new Date();
    }

    // ==================== QUERIES ====================

    isAdmin(): boolean {
        return this._role?.isAdmin() ?? false;
    }

    isStudent(): boolean {
        return this._role?.isStudent() ?? false;
    }
}
