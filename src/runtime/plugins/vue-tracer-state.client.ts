import { defineNuxtPlugin } from '#imports'
import * as tracerOverlay from "vite-plugin-vue-tracer/client/overlay"
import * as tracerRecord from "vite-plugin-vue-tracer/client/overlay"

export default defineNuxtPlugin(() => {
    return {
        provide: {
            tracerOverlay,
            tracerRecord
        }
    }
})