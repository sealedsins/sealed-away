<script setup lang="ts">
import { shallowRef, computed } from 'vue';
import markdownit from 'markdown-it';

defineSlots<{
	default: (props: { html: string }) => any;
}>();

const props = defineProps<{
	src: string;
}>();

/**
 * Reactive: Markdown renderer.
 */
const md = shallowRef(
	markdownit({
		html: false,
		typographer: true,
		linkify: true,
	}),
);

/**
 * Computed: Markdown result.
 */
const html = computed(() => {
	return md.value.renderInline(props.src);
});
</script>

<template>
	<slot :html="html"></slot>
</template>
