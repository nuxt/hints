<script setup lang="ts">
import { codeToHtml } from 'shiki/bundle/web'
import type { ComponentInternalInstance } from 'vue';
const props = defineProps<{
    issue: { instance: ComponentInternalInstance, vnode: VNode, htmlPreHydration: string | undefined, htmlPostHydration: string | undefined }
}>()

const pre = await codeToHtml(props.issue.htmlPreHydration ?? '', {
    theme: 'github-dark',
    lang: 'html',
})
const post = await codeToHtml(props.issue.htmlPostHydration ?? '', {
    theme: 'github-dark',
    lang: 'html',

})
</script>
<template>
    <TracerCard :element="(issue.instance.vnode.el as HTMLElement)">
        <h2>
            Component: {{ issue.instance.type.name ?? issue.instance.type.__name }}<br />
            Filepath: {{ issue.instance.type.__file }}<br />
        </h2>
        <div class="grid mt-2 gap-2 grid-cols-2">
            <div>
                <h3>Pre Hydration</h3>
                <div v-html="pre" class="w-full overflow-scroll"></div>
            </div>
            <div>
                <h3>Post Hydration</h3>
                <div v-html="post" class="w-full overflow-scroll"></div>
            </div>
        </div>
    </TracerCard>
</template>
