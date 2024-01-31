import { defineConfig } from '@pandacss/dev'
import { createPreset } from './panda'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/preset-base', createPreset()],
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  jsxFramework: 'react',
  outdir: '@mancini/styled-system',
  emitPackage: true
})