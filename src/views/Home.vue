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
        <button>{{ $ml.get('signUp') }}</button>
        <button>{{ $ml.get('signIn') }}</button>
      </div>
    </form>
  </div>
</template>

<script>
  import Socket from '@/utils/socket';
  import { generateKeyPair, getPEM } from '@/utils/RSA';

  const sock = new Socket();
  let foreignPEM;

  sock.on('connect', () => {
      sock.emit('rsa:getKey', '');
  });

  sock.on('rsa:publicKey', async (data) => {
      foreignPEM = data;
      console.log(foreignPEM);

      const keys = await generateKeyPair();
      const pem = await getPEM(keys);

      sock.emit('rsa:sendKeyOAEP', pem);
  });

  sock.init('secure');

export default {
  name: 'Home',
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