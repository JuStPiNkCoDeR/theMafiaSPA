<template>
  <div class="home">
    <form>
      <label>
        {{ $ml.get('emailLabel') }}
        <input type="text" v-model.trim="name" :placeholder="$ml.get('emailPlaceholder')">
      </label>
      <label>
        {{ $ml.get('passwordLabel') }}
        <input type="password" v-model.trim="password" :placeholder="$ml.get('passwordPlaceholder')">
      </label>
      <div id="button-field">
        <button @click="signUp">{{ $ml.get('signUp') }}</button>
        <button>{{ $ml.get('signIn') }}</button>
      </div>
    </form>
  </div>
</template>

<script>
  import Socket from '@/utils/socket';

  export default {
      name: 'Home',
      data() {
          return {
              name: '',
              password: '',
          }
      },
      methods: {
          async signUp(event) {
              this.$store.commit('addStoryEvent', {
                  info: 'signUp method triggered',
                  input: {
                      name: this.name,
                      password: this.password,
                  },
              });
              event.preventDefault();

              const sock = new Socket();

              sock.on('error', (error) => {
                  this.$store.commit('setError', {
                      title: this.$ml.get('socketError'),
                      solution: this.$ml.get('socketSolution'),
                      error,
                  });

                  this.$store.commit('addStoryEvent', {
                      info: 'Sockets onerror event triggered',
                      error: `${error.message}\n${error.stack}`,
                  });
                  console.error(error);
              });

              const signUp = async () => {
                  this.$store.commit('addStoryEvent', 'RSA handshake complete successfully');

                  sock.on('rsa:signUp', (data) => {
                      if (data === 'NO') {
                          this.$store.commit('setError', {
                              title: this.$ml.get('serverResponseNoError'),
                              solution: this.$ml.get('serverResponseNoSolution'),
                              error: Error('Server response is NO'),
                          });

                          this.$store.commit('addStoryEvent', 'Server response is NO on "sign up" socket event');
                      } else {
                          sock.close(true, 1000, 'The task is done');

                          this.$store.commit('addStoryEvent', 'Socket closed. Successfully signed up');
                      }
                  });

                  try {
                      const reqID = await sock.emitSecure('rsa:signUp', {
                          password: this.password,
                          name: this.name,
                      });

                      this.$store.commit('addStoryEvent', `Send secure "sign up" socket event with ID - ${reqID}`);
                  } catch (error) {
                      this.$store.commit('setError', {
                          title: this.$ml.get('secureSocketEmitError'),
                          solution: this.$ml.get('secureSocketEmitSolution'),
                          error,
                      });

                      this.$store.commit('addStoryEvent', {
                          info: 'Cant send secure "sign up" socket event',
                          error: `${error.message}\n${error.stack}`,
                      });
                      console.error(error);
                  }
              };

              try {
                  await sock.init('secure', signUp);
                  this.$store.commit('addStoryEvent', 'Secure socket connection established');
              } catch (error) {
                  this.$store.commit('setError', {
                      title: this.$ml.get('secureSocketEstablishmentError'),
                      solution: this.$ml.get('secureSocketEstablishmentSolution'),
                      error,
                  });

                  this.$store.commit('addStoryEvent', {
                      info: 'Cant initialize secure socket',
                      error: `${error.message}\n${error.stack}`,
                  });
                  console.error(error);
              }
          }
      }
  }

</script>

<style lang="scss">
  @import "../scss/_vars.scss";

  form {
    display: inline-flex;
    flex-direction: column;
    align-items: start;
    border: 3px solid $main-colour;
    border-radius: 30px;
    padding: 10px 15px;
  }

  label {
    margin: 5px 0;
  }

  #button-field button {
    margin: 30px 7px 10px;
    cursor: pointer;
  }
</style>