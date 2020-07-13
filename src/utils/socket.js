// Copyright sasha.los.0148@gmail.com
// All Rights have been taken by Mafia :)

import {arrayBufferToBase64, encrypt, generateKeyPair, getPEM, importKey, sign} from '@/utils/RSA';
import {guid} from "@/lib/helper";

const PORT = 8001;
// Uri for secure namespace
const SECURE_SOCKET_URI = `ws://localhost:${PORT}/ws/secure`;
const DEFAULT_LISTENERS = {
    /**
     * @description Default connect handler
     *
     * @param {Event} event
     * @param {{port: number, uri: string, namespace: string}} options
     */
    connect(event, options) {
        console.log(`Connected to ${options.uri}`);
    },
    /**
     * @description Default error handler
     *
     * @param {Error} error
     * @param {{port: number, uri: string, namespace: string}} options
     */
    error(error, options) {
        console.error(`Error on ${options.uri}\n[error]: ${error.message}`);
    },
    /**
     * @description Default close handler
     *
     * @param {CloseEvent} event
     * @param {{port: number, uri: string, namespace: string}} options
     */
    close(event, options) {
        if (event.wasClean) {
            console.log(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}\nURI: ${options.uri}`);
        } else {
            console.log('[close] Соединение прервано');
        }
    }
};

export default class {
    /**
     * @type {WebSocket|null}
     */
    #ws = null;
    options = {
        port: PORT,
        uri: 'none',
        namespace: 'none',
    };
    /**
     * @type {Object<string, function(*, {port: number, uri: string, namespace: string}, MessageEvent): void>}
     */
    #listeners = DEFAULT_LISTENERS;
    /**
     * @type {{pssPem: null|string, pss: null|CryptoKeyPair, oaepPem: null|string, oaep: null|CryptoKeyPair, foreignPemPss: null|string, foreignPemOaep: null|string, foreignOaep: null|CryptoKey, foreignPss: null|CryptoKey}}
     */
    #secureCredentials = {
        oaep: null,
        oaepPem: null,
        pss: null,
        pssPem: null,
        foreignPemOaep: null,
        foreignPemPss: null,
        foreignOaep: null,
        foreignPss: null,
    }

    /**
     * @description Start RSA handshake with server
     * @throws Error
     *
     * @param {function} onReady
     *
     * @return {Promise<void>}
     */
    async rsaHandshakeSetup(onReady = () => {}) {
        // Generate own RSA keys
        const keysOAEP = await generateKeyPair(true);
        const pemOAEP = await getPEM(keysOAEP);
        const keysPSS = await generateKeyPair(false);
        const pemPSS = await getPEM(keysPSS);

        this.#secureCredentials.oaep = keysOAEP;
        this.#secureCredentials.oaepPem = pemOAEP;
        this.#secureCredentials.pss = keysPSS;
        this.#secureCredentials.pssPem = pemPSS;
        // Send request for servers keys
        this.on('connect', () => {
            this.emit('rsa:getServerKeys');
        });
        // Set servers keys
        this.on('rsa:serverKeys', async (data) => {
            this.#secureCredentials.foreignPemOaep = data['OAEP'];
            this.#secureCredentials.foreignPemPss = data['PSS'];

            const keyOAEP = await importKey(data['OAEP'], 'RSA-OAEP', ['encrypt']);
            const keyPSS = await importKey(data['PSS'], 'RSA-PSS', ['verify']);

            this.#secureCredentials.foreignOaep = keyOAEP;
            this.#secureCredentials.foreignPss = keyPSS;
            // Send own public keys
            this.emit('rsa:setClientKeys', {
                oaep: this.#secureCredentials.oaepPem,
                pss: this.#secureCredentials.pssPem,
            });
        });
        // Server accepts clients keys
        this.on('rsa:acceptClientKeys', async (data) => {
            if (data === "NO") {
                throw Error('Server cant accept clients keys');
            }

            console.log('[secure] handshake complete successfully!');

            onReady();
        });
    }

    setupMainEvents() {
        this.#ws.onopen = (event) => {
            this.#listeners.connect(event, this.options);
        };

        this.#ws.onmessage = (event) => {
            const input = JSON.parse(event.data);

            const eventName = input.name;

            let data;

            try {
                const parsed = JSON.parse(input.data);

                data = parsed;
            } catch (e) {
                data = input.data;
            }

            this.#listeners[eventName](data, this.options, event);
        };

        this.#ws.onerror = (error) => {
            this.#listeners.error(error, this.options);
        };

        this.#ws.onclose = (event) => {
            this.#listeners.close(event, this.options);
        };
    }

    /**
     * @description Establish new socket
     * @throws Error
     *
     * @param {"secure"} namespace
     * @param {function} onReady
     */
    async init(namespace, onReady = () => {}) {
        switch (namespace) {
            case 'secure':
                await this.rsaHandshakeSetup(onReady);

                this.#ws = new WebSocket(SECURE_SOCKET_URI);
                this.options.uri = SECURE_SOCKET_URI;
                this.options.namespace = 'secure';

                break
            default:
                throw Error("Unknown socket namespace")
        }

        this.setupMainEvents();
    }

    /**
     * @description Add event handler to the current socket
     *              Handler get 3 params
     *              1 -> response data block from server
     *              2 -> options for current socket
     *              3 -> pure event object
     *
     * @param {"connect"|"error"|"close"|"rsa:serverKeys"|"rsa:acceptClientKeys"|"rsa:signUp"} event
     * @param {function(*, {port: number, uri: string, namespace: string}, MessageEvent): void} handler
     */
    on(event, handler) {
        this.#listeners[event] = handler;
    }

    /**
     * @description Trigger event on server with data
     * @throws Error
     *
     * @param {"rsa:getServerKeys"|"rsa:setClientKeys"|"rsa:signUp"} event
     * @param {*} data
     *
     * @return string
     */
    emit(event, data = '') {
        const reqID = guid();

        const out = {
            reqID,
            name: event,
            data
        };

        if (this.#ws === null) {
            throw Error("You need establish(init) socket first");
        }

        this.#ws.send(JSON.stringify(out));

        return reqID;
    }

    /**
     * @description Trigger event on server with encrypted data
     * @throws Error
     *
     * @param {"rsa:signUp"} event
     * @param {*} data
     *
     * @return string
     */
    async emitSecure(event, data = {}) {
        if (this.#secureCredentials.foreignOaep === null || this.#secureCredentials.pss === null) {
            throw Error('Encryption require RSA keys');
        }

        const encryptedData = {};

        for (const [key, value] of Object.entries(data)) {
            const encrypted = await encrypt(this.#secureCredentials.foreignOaep, value);
            const signature = await sign(this.#secureCredentials.pss.privateKey, encrypted);

            encryptedData[key] = arrayBufferToBase64(encrypted);
            encryptedData[`${key}Sign`] = arrayBufferToBase64(signature);
        }

        return this.emit(event, encryptedData);
    }

    /**
     * @description Close current socket
     * @throws Error
     *
     * @param {boolean} removeListeners
     * @param {number} [code]
     * @param {string} [reason]
     */
    close(removeListeners, code, reason) {
        if (this.#ws === null) {
            throw Error("You need establish(init) socket first before close it!")
        }

        this.#ws.close(code, reason);
        // Clean everything
        this.#ws = null;

        if (removeListeners) {
            this.#listeners = DEFAULT_LISTENERS;
        }
    }
}