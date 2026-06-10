import * as crypto from 'crypto';
import bcrypt from "bcrypt";

// export const createHashPassword = (password: string): string => {
//     const hash = crypto.createHash('md5').update(password).digest('hex');
//     return hash;
// };

// export const verifyHashedPassword = (password: string, hash: string): boolean => {
//     const hashedPassword = createHashPassword(password);
//     return hashedPassword === hash;
// };


export const createHash = async (password: string ): Promise<string> => {
    return await bcrypt.hash(password, 10);
}

export const verifyHash = async (password: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword)
}