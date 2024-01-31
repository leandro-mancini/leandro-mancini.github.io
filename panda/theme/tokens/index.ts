import { defineTokens } from '@pandacss/dev'
import { animations } from './animations'
import { borders } from './borders'
import { defineColorTokens } from './colors'
import { durations } from './durations'
import { easings } from './easings'
import { radii } from './radii'
import { sizes } from './sizes'
import { spacing } from './spacing'
import { fontSizes, fontWeights, fonts, letterSpacings, lineHeights } from './typography'
import { zIndex } from './z-index'

export const createTokens = () => {
    return defineTokens({
        animations,
        borders,
        colors: defineColorTokens(),
        durations,
        easings,
        fonts,
        fontSizes,
        fontWeights,
        letterSpacings,
        lineHeights,
        radii,
        sizes,
        spacing,
        zIndex,
    })
}