<script setup lang="ts">
import { codeToHtml } from 'shiki/bundle/web';
definePageMeta({
    title: 'Hydration'
})

const { hydration } = useHostPerformancesData()

</script>

<template>
    <div grid gap-4 p-4>
        <HydrationIssue
            v-for="issue in hydration"
            :key="issue.instance.uid"
            :issue="issue"
            />
    </div>
</template>