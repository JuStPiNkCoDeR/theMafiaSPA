// Copyright sasha.los.0148@gmail.com
// All Rights have been taken by Mafia :)

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const MAX_STORY_EVENTS = 50;

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
    /**
     * @description Local logging for bug reports
     *
     * @type Array<string>
     */
    story: [],
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
    },
    /**
     *
     * @param state
     * @param {*} payload
     */
    addStoryEvent(state, payload) {
      const updated = [...state.story, JSON.stringify(payload)];

      if (updated.length > MAX_STORY_EVENTS) {
        updated.shift();
      }

      state.story = updated;
    }
  },
  actions: {},
  modules: {}
})
