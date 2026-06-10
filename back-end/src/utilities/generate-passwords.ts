export function generateRandomPassword(): string {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "@#$%^&+!=*";
    const allCharacters = letters + numbers + symbols;

    const getRandomChar = (chars: string): string => chars[Math.floor(Math.random() * chars.length)];
    let password = getRandomChar(letters) + getRandomChar(numbers) + getRandomChar(symbols);

    for (let i = password.length; i < 12; i++) {
        password += getRandomChar(allCharacters);
    }

    const shuffledPassword = password
        .split('')
        .sort(() => 0.5 - Math.random())
        .join('');
    
    return shuffledPassword;
}
