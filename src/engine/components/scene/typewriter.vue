<script setup lang="ts">
import { isEmpty } from 'lodash';
import { ref, watchEffect } from 'vue';

const props = defineProps<{
	text: string;
}>();

const typing = ref(false);
const intervalId = ref<number>();
const textToShow = ref('');

/**
 * Starts typing animation.
 */
const startTyping = () => {
	typing.value = true;
	intervalId.value = window.setInterval(handleInterval, 15);
	textToShow.value = '';
};

/**
 * Stops typing animation.
 */
const skipTyping = () => {
	typing.value = false;
	clearInterval(intervalId.value);
	textToShow.value = props.text;
};

/**
 * Handles typing animation.
 * @internal
 */
const handleInterval = () => {
	if (textToShow.value !== props.text) {
		textToShow.value = textToShow.value + props.text[textToShow.value.length];
	} else {
		window.clearInterval(intervalId.value);
		typing.value = false;
	}
};

defineExpose({ startTyping, skipTyping, typing });
watchEffect(() => {
	if (!isEmpty(props.text)) {
		startTyping();
	} else {
		textToShow.value = '';
	}
});
</script>

<template>
	{{ textToShow }}
</template>
