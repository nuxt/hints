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

  it('ignores trailing style semicolons', async () => {
    const { normalizeHTMLForComparison } = await import('../../../src/runtime/hydration/utils')
    const pre = '<div style="color:red;">'
    const post = '<div style="color:red">'

    expect(normalizeHTMLForComparison(pre)).toBe(normalizeHTMLForComparison(post))
  })

  it('keeps html without style attributes unchanged', async () => {
    const { normalizeHTMLForComparison } = await import('../../../src/runtime/hydration/utils')
    const html = '<div class="example">content</div>'

    expect(normalizeHTMLForComparison(html)).toBe(html)
  })

  it('handles empty style attributes', async () => {
    const { normalizeHTMLForComparison } = await import('../../../src/runtime/hydration/utils')

    expect(normalizeHTMLForComparison('<div style="">')).toBe('<div style="">')
  })

  it('ignores an empty class attribute', async () => {
    const { normalizeHTMLForComparison } = await import('../../../src/runtime/hydration/utils')
    const pre = '<div>\n  content\n</div>'
    const post = '<div class="">\n  content\n</div>'

    expect(normalizeHTMLForComparison(pre)).toBe(normalizeHTMLForComparison(post))
  })

  it('keeps real class differences visible', async () => {
    const { normalizeHTMLForComparison } = await import('../../../src/runtime/hydration/utils')
    const pre = '<div class="">'
    const post = '<div class="active">'

    expect(normalizeHTMLForComparison(pre)).not.toBe(normalizeHTMLForComparison(post))
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
