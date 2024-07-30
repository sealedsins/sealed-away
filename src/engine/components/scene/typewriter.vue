<script setup lang="ts">
import { ref, watchEffect, onUnmounted } from 'vue';

const props = defineProps<{
	html: string;
}>();

/**
 * Reactive: Typewriter status.
 */
const typing = ref(false);

/**
 * Reactive: Typewriter handler interval ID.
 * @internal
 */
const handlerId = ref<number>();

/**
 * Reactive: Typewriter visible HTML.
 * @internal
 */
const htmlTyped = ref('');

/**
 * Starts typing animation.
 */
const startTyping = () => {
	window.clearInterval(handlerId.value);
	handlerId.value = window.setInterval(handleInterval, 15);
	htmlTyped.value = '';
	typing.value = true;
};

/**
 * Stops typing animation.
 */
const skipTyping = () => {
	window.clearInterval(handlerId.value);
	htmlTyped.value = props.html;
	typing.value = false;
};

/**
 * Types the next character.
 * @internal
 */
const typeNext = () => {
	if (htmlTyped.value.length < props.html.length) {
		htmlTyped.value = htmlTyped.value + props.html[htmlTyped.value.length];
	}
};

/**
 * Handles typing animation.
 * @internal
 */
const handleInterval = () => {
	const html = props.html;
	if (htmlTyped.value.length >= html.length) {
		skipTyping();
		return;
	}
	typeNext();
	if (htmlTyped.value.endsWith('<')) {
		while (!htmlTyped.value.endsWith('>') && htmlTyped.value.length < html.length) {
			typeNext();
		}
	}
	if (htmlTyped.value.endsWith('&')) {
		while (!htmlTyped.value.endsWith(';') && htmlTyped.value.length < html.length) {
			typeNext();
		}
	}
};

defineExpose({ startTyping, skipTyping, typing });
watchEffect(() => {
	if (props.html.length > 0) {
		startTyping();
	} else {
		skipTyping();
	}
});

onUnmounted(() => {
	clearInterval(handlerId.value);
});
</script>

<template>
	<span v-html="htmlTyped"></span>
</template>
