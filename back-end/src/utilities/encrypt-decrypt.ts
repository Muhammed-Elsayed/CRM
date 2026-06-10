import CryptoJS from "crypto-js";

const key = "0c617bc53fc30517e020964aeb5752bc064491f20ee45746189b9a0d4ee528e2";

export const encrypt = (data: string) =>
    CryptoJS.AES.encrypt(data, key).toString();

export const decrypt = (data: string) => {

    const bytes = CryptoJS.AES.decrypt(data, key);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

    return decryptedString;
};
