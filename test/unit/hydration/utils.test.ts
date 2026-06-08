import { describe, expect, it, vi } from 'vitest'

vi.mock('#shared/hints-config', () => ({
  features: {
    hydration: true,
  },
}))

describe('normalizeHTMLForComparison', () => {
  it('ignores style serialization whitespace differences', async () => {
    const { normalizeHTMLForComparison } = await import('../../../src/runtime/hydration/utils')
    const pre = '<div style="--demo-size:var(--demo-source);--demo-color:rgb(0, 0, 0);--demo-gap:0px;">'
    const post = '<div style="--demo-size:var(--demo-source);--demo-color:rgb(0,0,0);--demo-gap:0px;">'

    expect(normalizeHTMLForComparison(pre)).toBe(normalizeHTMLForComparison(post))
  })

  it('keeps real style value differences visible', async () => {
    const { normalizeHTMLForComparison } = await import('../../../src/runtime/hydration/utils')
    const pre = '<div style="--demo-gap:0px;">'
    const post = '<div style="--demo-gap:1px;">'

    expect(normalizeHTMLForComparison(pre)).not.toBe(normalizeHTMLForComparison(post))
  })

  it('keeps quoted comma whitespace differences visible', async () => {
    const { normalizeHTMLForComparison } = await import('../../../src/runtime/hydration/utils')
    const pre = '<div style="content:\'a, b\';">'
    const post = '<div style="content:\'a,b\';">'

    expect(normalizeHTMLForComparison(pre)).not.toBe(normalizeHTMLForComparison(post))
  })
})
