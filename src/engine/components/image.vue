<script setup lang="ts">
import TransitionFade from './transition/fade.vue';
import { ref, watchEffect } from 'vue';
import { useCache } from '../stores';

const props = defineProps<{
	src?: string;
}>();

const cache = useCache();
const srcData = ref<string>();

const loadImage = async () => {
	if (!props.src) {
		srcData.value = undefined;
		return;
	}
	try {
		const dataToLoad = props.src;
		const dataLoaded = await cache.load(dataToLoad);
		const dataBase64 = await cache.readAsBase64(dataLoaded);

		// Wait until image is decoded.
		const decodedImg = new Image();
		decodedImg.src = dataBase64;
		await decodedImg.decode();

		// Check the source.
		// This is done to avoid race condition when images are changed too fast.
		if (props.src === dataToLoad) {
			srcData.value = decodedImg.src;
		}
	} catch (err) {
		console.error(`Error loading image: ${props.src}`);
	}
};

watchEffect(() => {
	loadImage();
});
</script>

<template>
	<TransitionFade mode="in-out">
		<img v-if="srcData" :key="srcData" :src="srcData" />
	</TransitionFade>
</template>
