import Vue from 'vue'
import { MLInstaller, MLCreate, MLanguage } from 'vue-multilanguage'
import ru from './ru-RU'

Vue.use(MLInstaller)

export default new MLCreate({
    initial: 'russian',
    save: process.env.NODE_ENV === 'production',
    languages: [
        new MLanguage('russian').create(ru),
    ]
})