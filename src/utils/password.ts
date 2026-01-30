import bcrypt from 'bcrypt';

export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
    return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (enteredPassword: string, storedHash: string): Promise<boolean> => {
    return await bcrypt.compare(enteredPassword, storedHash);
};