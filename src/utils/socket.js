// Copyright sasha.los.0148@gmail.com
// All Rights have been taken by Mafia :)

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
     * @description Establish new socket
     * @throws Error
     *
     * @param {"secure"} namespace
     */
    init(namespace) {
        switch (namespace) {
            case 'secure':
                this.#ws = new WebSocket(SECURE_SOCKET_URI);
                this.options.uri = SECURE_SOCKET_URI;
                this.options.namespace = 'secure';
                break
            default:
                throw Error("Unknown socket namespace")
        }

        this.#ws.onopen = (event) => {
            this.#listeners.connect(event, this.options);
        };

        this.#ws.onmessage = (event) => {
            const input = JSON.parse(event.data);

            const eventName = input.name;
            this.#listeners[eventName](JSON.parse(input.data), this.options, event);
        };

        this.#ws.onerror = (error) => {
            this.#listeners.error(error, this.options);
        };

        this.#ws.onclose = (event) => {
            this.#listeners.close(event, this.options);
        };
    }

    /**
     * @description Add event handler to the current socket
     *              Handler get 3 params
     *              1 -> response data block from server
     *              2 -> options for current socket
     *              3 -> pure event object
     *
     * @param {"connect"|"error"|"close"|"rsa:serverKeys"} event
     * @param {function(*, {port: number, uri: string, namespace: string}, MessageEvent): void} handler
     */
    on(event, handler) {
        this.#listeners[event] = handler;
    }

    /**
     * @description Trigger event on server with data
     * @throws Error
     *
     * @param {"rsa:getServerKeys"|"rsa:setClientKeys"} event
     * @param {*} data
     */
    emit(event, data) {
        const out = {
            name: event,
            data
        };

        if (this.#ws === null) {
            throw Error("You need establish(init) socket first");
        }

        this.#ws.send(JSON.stringify(out));
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