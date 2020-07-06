// Copyright sasha.los.0148@gmail.com
// All Rights have been taken by Mafia :)

import Vue from 'vue'
import Vuex from 'vuex'
import {generateKeyPair, getPEM, importKey} from '@/utils/RSA';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    /**
     * @description Short information about error
     *
     * @type {string|null}
     */
    errorTitle: null,
    /**
     * @description The way to solve it for user
     *
     * @type {string|null}
     */
    errorSolution: null,
    /**
     * @description Error object for report
     *
     * @type {Error|null}
     */
    error: null,
  },
  mutations: {
    /**
     * @param state
     * @param {{title: string, solution: string, error: Error}} payload
     */
    setError(state, payload) {
      state.errorTitle = payload.title;
      state.errorSolution = payload.solution;
      state.error = payload.error;
    }
  },
  actions: {
  },
  modules: {
    secure: {
      namespaced: true,

      state: {
        /**
         * @description Key pair which generated via window.crypto to decode response data
         *              and to give to server public key
         *
         * @type {CryptoKeyPair|null}
         */
        ownKeyPairOAEP: null,
        /**
         * @description Key pair which generated via window.crypto to sign and verify server sign
         *
         * @type {CryptoKeyPair|null}
         */
        ownKeyPairPSS: null,
        /**
         * @description String in PEM(PUBLIC KEY) style of own OAEP public key
         *
         * @type {string|null}
         */
        pemOAEP: null,
        /**
         * @description String in PEM(PUBLIC KEY) style of own PSS public key
         *
         * @type {string|null}
         */
        pemPSS: null,
        /**
         * @description Server OAEP public key
         *              usage: encode outgoing data
         *
         * @type {CryptoKey|null}
         */
        foreignPublicKeyOAEP: null,
        /**
         * @description Server PSS public key
         *              usage: verify signatures
         *
         * @type {CryptoKey|null}
         */
        foreignPublicKeyPSS: null,
      },
      mutations: {
        /**
         * @param state
         * @param {CryptoKeyPair|null} payload
         */
        setKeyPairOAEP(state, payload) {
          state.ownKeyPairOAEP = payload;
        },
        /**
         * @param state
         * @param {CryptoKeyPair|null} payload
         */
        setKeyPairPSS(state, payload) {
          state.ownKeyPairPSS = payload;
        },
        /**
         * @param state
         * @param {string|null} payload
         */
        setPemOAEP(state, payload) {
          state.pemOAEP = payload;
        },
        /**
         * @param state
         * @param {string|null} payload
         */
        setPemPSS(state, payload) {
          state.pemPSS = payload
        },
        /**
         * @param state
         * @param {CryptoKey|null} payload
         */
        setForeignPublicKeyOAEP(state, payload) {
          state.foreignPublicKeyOAEP = payload;
        },
        /**
         * @param state
         * @param {CryptoKey|null} payload
         */
        setForeignPublicKeyPSS(state, payload) {
          state.foreignPublicKeyPSS = payload;
        }
      },
      actions: {
        async generateAllKeyPair({ commit }) {
          const keysOAEP = await generateKeyPair(true);
          const pemOAEP = await getPEM(keysOAEP);
          const keysPSS = await generateKeyPair(false);
          const pemPSS = await getPEM(keysPSS);

          commit('setKeyPairOAEP', keysOAEP);
          commit('setPemOAEP', pemOAEP);
          commit('setKeyPairPSS', keysPSS);
          commit('setPemPSS', pemPSS);
        },
        /**
         *
         * @param commit
         * @param {{oaep: string, pss: string}} PEMs
         * @return {Promise<void>}
         */
        async reproduceForeignPublicKeysFromPEM({ commit }, PEMs) {
          const keyOAEP = await importKey(PEMs.oaep, 'RSA-OAEP', ['encrypt']);
          commit('setForeignPublicKeyOAEP', keyOAEP);

          const keyPSS = await importKey(PEMs.pss, 'RSA-PSS', ['verify']);
          commit('setForeignPublicKeyPSS', keyPSS);
        }
      },
    }
  }
})
