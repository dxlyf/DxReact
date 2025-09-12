import { defineConfig,transformerVariantGroup,presetWind3 } from 'unocss'

export default defineConfig({
  // ...UnoCSS options
  presets:[presetWind3()],
  transformers:[transformerVariantGroup()]
})