import { Role, RoleType } from './role.vo';

describe('Role Value Object', () => {
    it('should create a valid role', () => {
        const role = Role.create(RoleType.ADMIN);
        expect(role.value).toBe(RoleType.ADMIN);
    });

    it('should throw error for invalid role type', () => {
        expect(() => Role.create('INVALID' as any)).toThrow('Invalid role');
    });

    it('should create from string', () => {
        const role = Role.fromString('STUDENT');
        expect(role.value).toBe(RoleType.STUDENT);
    });

    it('should throw error for invalid role string', () => {
        expect(() => Role.fromString('GHOST')).toThrow('Invalid role string');
    });

    it('should check role types correctly', () => {
        const admin = Role.create(RoleType.ADMIN);
        const student = Role.create(RoleType.STUDENT);

        const proctor = Role.create(RoleType.PROCTOR);

        expect(admin.isAdmin()).toBe(true);
        expect(admin.isStudent()).toBe(false);
        expect(student.isStudent()).toBe(true);
        expect(student.isAdmin()).toBe(false);
        expect(proctor.isProctor()).toBe(true);
    });

    it('should convert role to string', () => {
        const role = Role.create(RoleType.ADMIN);
        expect(role.toString()).toBe('ADMIN');
    });

    it('should check permissions', () => {
        const admin = Role.create(RoleType.ADMIN);
        const officer = Role.create(RoleType.EXAM_OFFICER);
        const student = Role.create(RoleType.STUDENT);

        expect(admin.canManageUsers()).toBe(true);
        expect(officer.canManageUsers()).toBe(true);
        expect(student.canManageUsers()).toBe(false);
    });

    it('should compare two roles', () => {
        const role1 = Role.create(RoleType.ADMIN);
        const role2 = Role.create(RoleType.ADMIN);
        const role3 = Role.create(RoleType.STUDENT);

        expect(role1.equals(role2)).toBe(true);
        expect(role1.equals(role3)).toBe(false);
    });
});
