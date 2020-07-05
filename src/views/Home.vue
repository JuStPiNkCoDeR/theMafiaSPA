<template>
  <div class="home">
    <form>
      <label>
        {{ $ml.get('nameLabel') }}
        <input type="text" :placeholder="$ml.get('namePlaceholder')">
      </label>
      <label>
        {{ $ml.get('passwordLabel') }}
        <input type="password" :placeholder="$ml.get('passwordPlaceholder')">
      </label>
      <div id="button-field">
        <button @click="signIn">{{ $ml.get('signUp') }}</button>
        <button>{{ $ml.get('signIn') }}</button>
      </div>
    </form>
  </div>
</template>

<script>
  import Socket from '@/utils/socket';

  export default {
      name: 'Home',
      methods: {
          async signIn(event) {
              event.preventDefault();

              await this.$store.dispatch('secure/generateAllKeyPair');

              const sock = new Socket();
              let foreignPemOAEP, foreignPemPSS;

              sock.on('connect', () => {
                  sock.emit('rsa:getServerKeys', '');
              });

              sock.on('rsa:serverKeys', async (data) => {
                  console.log(data)
                  foreignPemOAEP = data['OAEP'];
                  foreignPemPSS = data['PSS'];

                  try {
                      await this.$store.dispatch('secure/reproduceForeignPublicKeysFromPEM', {
                          oaep: foreignPemOAEP,
                          pss: foreignPemPSS,
                      });

                      sock.emit('rsa:setClientKeys', this.$store.state.secure.pemOAEP);
                  } catch (e) {
                      console.error(e);
                  }
              });

              sock.init('secure');
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