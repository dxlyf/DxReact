import { defineConfig,transformerVariantGroup,transformerAttributifyJsx,presetWebFonts ,presetWind4 } from 'unocss'

export default defineConfig({
  // ...UnoCSS options
  presets:[presetWind4({
    preflights:{
      reset:true
    }
  })],
  transformers:[transformerVariantGroup(),transformerAttributifyJsx()]
})