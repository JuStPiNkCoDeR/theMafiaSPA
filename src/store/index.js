// Copyright sasha.los.0148@gmail.com
// All Rights have been taken by Mafia :)

import Vue from 'vue'
import Vuex from 'vuex'
import { generateKeyPair, getPEM } from '@/utils/RSA';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  },
  mutations: {
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
         * @description Server public key
         *              usage: encode outgoing data
         *
         * @type {CryptoKey|null}
         */
        foreignPublicKey: null,
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
        setForeignPublicKey(state, payload) {
          state.foreignPublicKey = payload;
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
      }
    }
  }
})
