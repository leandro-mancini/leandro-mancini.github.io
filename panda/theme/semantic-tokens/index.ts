import { defineSemanticTokens } from '@pandacss/dev'

export const createSemanticTokens = () => {
  return defineSemanticTokens({
    colors: {
      bg: {
        canvas: { value: '{colors.black.a1}' }
      }
    },
  })
}