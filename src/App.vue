<template>
  <div id="app">
<!--    <div id="nav">-->
<!--      <router-link to="/">Home</router-link> |-->
<!--      <router-link to="/about">About</router-link>-->
<!--    </div>-->
    <router-view/>
    <div v-if="$store.state.errorTitle !== null" id="error-block">
      <h3>{{ $store.state.errorTitle }}</h3>
      <p>{{ $store.state.errorSolution }}</p>
      <button>{{ $ml.get('reportError') }}</button>
    </div>
  </div>
</template>

<style lang="scss">
    @import url('https://fonts.googleapis.com/css2?family=Ubuntu&display=swap');
    @import "scss/_vars.scss";

    body {
      margin: 0;
    }

    #app {
      font-family: $font-family;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-align: center;
      color: $main-colour;
    }

    #nav {
      padding: 30px;
    }

    #nav a {
      font-weight: bold;
      color: #2c3e50;
    }

    #nav a.router-link-exact-active {
      color: #42b983;
    }
</style>
