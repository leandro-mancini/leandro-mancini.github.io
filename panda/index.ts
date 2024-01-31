import { definePreset } from '@pandacss/dev'
import type { Preset } from '@pandacss/types'

import { globalCss } from './global-css'
import { breakpoints } from './theme/breakpoints'
import { createSemanticTokens } from './theme/semantic-tokens'
import { createTokens } from './theme/tokens'

const createPreset = (): Preset => {
    const semanticTokens = createSemanticTokens()
    const tokens = createTokens()
  
    return definePreset({
        theme: {
            extend: {
                breakpoints,
                semanticTokens,
                tokens,
            },
        },
        globalCss,
    })
}

const defaultPreset = createPreset()

export { createPreset, defaultPreset as default }