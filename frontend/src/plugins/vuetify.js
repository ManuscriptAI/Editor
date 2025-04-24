/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { VFileUpload, VFileUploadItem } from 'vuetify/labs/VFileUpload'
import { md3 } from 'vuetify/blueprints'



// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'light',
  },
  blueprint: md3,
  components:{
    VFileUpload, VFileUploadItem
  }
})
