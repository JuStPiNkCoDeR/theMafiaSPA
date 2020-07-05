// Copyright sasha.los.0148@gmail.com
// All Rights have been taken by Mafia :)

function arrayBufferToBase64(arrayBuffer) {
    const byteArray = new Uint8Array(arrayBuffer);
    let byteString = '';

    for(let i = 0; i < byteArray.byteLength; i++) {
        byteString += String.fromCharCode(byteArray[i]);
    }

    return window.btoa(byteString);
}

function stringToArrayBuffer(byteString){
    const buffer = new ArrayBuffer(byteString.length);
    const byteArray = new Uint8Array(buffer);

    for(let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
    }

    return buffer;
}

function addNewLines(str) {
    let finalString = '';

    while(str.length > 0) {
        finalString += str.substring(0, 64) + '\n';
        str = str.substring(64);
    }

    return finalString;
}

function removeLines(pem) {
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    return pem.substring(pemHeader.length, pem.length - pemFooter.length - 1);
}

/**
 * @description From PEM string produce key of type CryptoKey
 *
 * @param {string} pem
 * @param {"RSA-OAEP"|"RSA-PSS"} algorithm
 * @param {string[]} usage
 * @returns {Promise<CryptoKey>}
 */
export async function importKey(pem, algorithm, usage) {
    const pemEncodedKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAy3Xo3U13dc+xojwQYWoJLCbOQ5fOVY8LlnqcJm1W1BFtxIhOAJWohiHuIRMctv7dzx47TLlmARSKvTRjd0dF92jx/xY20Lz+DXp8YL5yUWAFgA3XkO3LSJgEOex10NB8jfkmgSb7QIudTVvbbUDfd5fwIBmCtaCwWx7NyeWWDb7A9cFxj7EjRdrDaK3ux/ToMLHFXVLqSL341TkCf4ZQoz96RFPUGPPLOfvN0x66CM1PQCkdhzjE6U5XGE964ZkkYUPPsy6Dcie4obhW4vDjgUmLzv0z7UD010RLIneUgDE2FqBfY/C+uWigNPBPkkQ+Bv/UigS6dHqTCVeD5wgyBQIDAQAB
-----END PUBLIC KEY-----`;
    const correct = removeLines(pemEncodedKey);
    console.log(correct);
    const contentPEM = removeLines(pem);
    const binaryStr = window.atob(contentPEM);
    const keyBuffer = stringToArrayBuffer(binaryStr);
    const key = await window.crypto.subtle.importKey(
        'spki',
        keyBuffer,
        {
            name: algorithm,
            hash: 'SHA-256',
        },
        true,
        usage,
    );

    return key;
}

/**
 * @description Transform RSA key to PEM string
 *
 * @param {ArrayBuffer} key
 * @param {"RSA PRIVATE KEY"|"PUBLIC KEY"} type
 * @returns {string}
 */
export function toPem(key, type) {
    const b64 = addNewLines(arrayBufferToBase64(key));
    return `-----BEGIN ${type}-----\n` + b64 + `-----END ${type}-----`;
}

/**
 * @description Produce new RSA key pair
 *
 * @param {boolean} isOAEP
 *
 * @returns {Promise<CryptoKeyPair>}
 */
export async function generateKeyPair(isOAEP) {
    const keys = await window.crypto.subtle.generateKey({
        name: isOAEP ? 'RSA-OAEP' : 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: { name: 'SHA-256' },
    },
    true,
    isOAEP ? ['encrypt', 'decrypt'] : ['sign', 'verify']);

    return keys;
}

/**
 * @description Generate PEM like string of RSA public key from RSA key pair
 *
 * @param {CryptoKeyPair} keyPair
 * @returns {Promise<string>}
 */
export async function getPEM(keyPair) {
    const publicKey = await window.crypto.subtle.exportKey(
        'spki',
        keyPair.publicKey
    );

    return toPem(publicKey, 'PUBLIC KEY');
}

/**
 * @description Encrypt data using foreign public key
 *
 * @param {string} foreignPublicKey
 * @param {*} data
 *
 * @return {Promise<ArrayBuffer>}
 */
export async function encrypt(foreignPublicKey, data) {
    const key = await importKey(foreignPublicKey);

    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: 'RSA-OAEP',
        },
        key,
        stringToArrayBuffer(JSON.stringify(data)),
    );

    return encrypted;
}

/**
 * @description Make a signature depended on encrypted text
 *
 * @param {CryptoKey} privateKey
 * @param {ArrayBuffer} encryptedText
 *
 * @return {Promise<ArrayBuffer>}
 */
export async function sign(privateKey, encryptedText) {
    const sign = await window.crypto.subtle.sign(
        {
            name: 'RSA-PSS',
            saltLength: 0,
        },
        privateKey,
        encryptedText,
    );

    return sign;
}