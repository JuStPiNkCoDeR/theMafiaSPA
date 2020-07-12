// Copyright sasha.los.0148@gmail.com
// All Rights have been taken by Mafia :)

export function arrayBufferToBase64(arrayBuffer) {
    return window.btoa(new Uint8Array(arrayBuffer).reduce((s, b) => s + String.fromCharCode(b), ''));
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

/**
 * @description Remove PEM type blocks
 *
 * @param {string} pem
 */
function removeHeaders(pem) {
    return pem.split('\n').slice(1, -2).join('\n');
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
    const contentPEM = removeHeaders(pem);
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
 * @param {CryptoKey} foreignPublicKey
 * @param {*} data
 *
 * @return {Promise<ArrayBuffer>}
 */
export async function encrypt(foreignPublicKey, data) {
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: 'RSA-OAEP',
        },
        foreignPublicKey,
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