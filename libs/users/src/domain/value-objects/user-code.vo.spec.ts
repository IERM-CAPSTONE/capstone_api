import { UserCode } from './user-code.vo';

describe('UserCode Value Object', () => {
    it('should create a valid user code', () => {
        const codeStr = 'se123456';
        const code = UserCode.create(codeStr);
        expect(code.value).toBe(codeStr.toUpperCase());
    });

    it('should throw error if code is empty', () => {
        expect(() => UserCode.create('')).toThrow('User code cannot be empty');
    });

    it('should throw error if code length is invalid', () => {
        expect(() => UserCode.create('A')).toThrow('User code must be between 2 and 20 characters');
        expect(() => UserCode.create('A'.repeat(21))).toThrow('User code must be between 2 and 20 characters');
    });

    it('should create from persistence', () => {
        const code = UserCode.fromPersistence('ORIGINAL_CODE');
        expect(code.value).toBe('ORIGINAL_CODE');
    });

    it('should compare two codes', () => {
        const code1 = UserCode.create('se123');
        const code2 = UserCode.create('SE123');
        const code3 = UserCode.create('se456');

        expect(code1.equals(code2)).toBe(true);
        expect(code1.equals(code3)).toBe(false);
    });

    it('should convert to string', () => {
        const code = UserCode.create('se123');
        expect(code.toString()).toBe('SE123');
    });
});
