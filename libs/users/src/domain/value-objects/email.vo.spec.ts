import { Email } from './email.vo';

describe('Email Value Object', () => {
    it('should create a valid fpt email', () => {
        const emailStr = 'test@fpt.edu.vn';
        const email = Email.create(emailStr);
        expect(email.value).toBe(emailStr.toLowerCase());
    });

    it('should throw error if email is empty', () => {
        expect(() => Email.create('')).toThrow('Email cannot be empty');
        expect(() => Email.create('   ')).toThrow('Email cannot be empty');
    });

    it('should throw error if email format is invalid', () => {
        expect(() => Email.create('invalid-email')).toThrow('Invalid email format');
        expect(() => Email.create('test@com')).toThrow('Invalid email format');
    });

    it('should throw error if email does not end with @fpt.edu.vn', () => {
        expect(() => Email.create('test@gmail.com')).toThrow('Email must end with @fpt.edu.vn');
    });

    it('should create from persistence without validation', () => {
        const emailStr = 'external@gmail.com';
        const email = Email.fromPersistence(emailStr);
        expect(email.value).toBe(emailStr);
    });

    it('should compare two emails for equality', () => {
        const email1 = Email.create('TEST@fpt.edu.vn');
        const email2 = Email.create('test@fpt.edu.vn');
        const email3 = Email.create('other@fpt.edu.vn');

        expect(email1.equals(email2)).toBe(true);
        expect(email1.equals(email3)).toBe(false);
    });

    it('should convert to string', () => {
        const emailStr = 'test@fpt.edu.vn';
        const email = Email.create(emailStr);
        expect(email.toString()).toBe(emailStr);
    });
});
