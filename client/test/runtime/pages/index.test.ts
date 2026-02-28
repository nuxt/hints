import { describe, it, expect, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '../../../app/pages/index.vue'
import type { FeaturesName } from '../../../../src/runtime/core/types'

mockNuxtImport('useEnabledHintsFeatures', () => vi.fn())

function geDefaultEnabledHintsFeatures(): Record<FeaturesName, boolean> {
    return {
        hydration: true,
        webVitals: true,
        thirdPartyScripts: true,
        lazyLoad: true,
    }
}

describe('Index Page', () => {
    it('should render all enabled features', async () => {
        vi.mocked(useEnabledHintsFeatures).mockReturnValue(geDefaultEnabledHintsFeatures())
        const wrapper = await mountSuspended(IndexPage, {
            shallow: true
         })
        expect(wrapper.findComponent({ name: 'FeatureCardsWebVitalsCard' }).exists()).toBe(true)
        expect(wrapper.findComponent({ name: 'FeatureCardsThirdPartyScriptsCard' }).exists()).toBe(true)
        expect(wrapper.findComponent({ name: 'FeatureCardsLazyLoadCard' }).exists()).toBe(true)
        expect(wrapper.findComponent({ name: 'FeatureCardsHydrationCard' }).exists()).toBe(true)
    })

    it.each(Object.keys(geDefaultEnabledHintsFeatures()) as FeaturesName[])(
        'should not render disabled feature card: %s',
        async (feature) => {
            const features = geDefaultEnabledHintsFeatures()
            features[feature] = false
            vi.mocked(useEnabledHintsFeatures).mockReturnValue(features)
            const wrapper = await mountSuspended(IndexPage, {
                shallow: true
            })
            const cardName = `FeatureCards${feature.charAt(0).toUpperCase() + feature.slice(1)}Card`
            expect(wrapper.findComponent({ name: cardName }).exists()).toBe(false)
        }
    )
})