<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import * as asset from '../../utils/asset';

const props = defineProps<{
	src?: string;
}>();

const loading = ref(false);
const srcData = ref<string>();

// prettier-ignore
const emptyImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const loadBackground = async () => {
	if (!props.src) {
		srcData.value = `url("${emptyImage}")`;
		return;
	}
	try {
		loading.value = true;

		const dataToLoad = props.src;
		const dataLoaded = await asset.load(dataToLoad);
		const dataBase64 = await asset.readAsBase64(dataLoaded);

		// Wait until image is decoded.
		const decodedImg = new Image();
		decodedImg.src = dataBase64;
		await decodedImg.decode();

		// Set background if the source is still the same.
		// This is done to avoid race condition when backgrounds are changed too fast.
		if (props.src === dataToLoad) {
			srcData.value = `url(${decodedImg.src})`;
		}
	} catch (err) {
		console.error(`Error loading background: ${props.src}`);
	} finally {
		loading.value = false;
	}
};

watchEffect(() => {
	loadBackground();
});
</script>

<template>
	<div ref="wrapper" class="background" :style="{ backgroundImage: srcData }"></div>
</template>

<style scoped lang="scss">
$transition-duration: 0.5s;
$transition-timing: ease-in-out;

.background {
	position: absolute;

	background-image: none;
	background-position: center;
	background-size: cover;

	height: 100%;
	width: 100%;
	left: 0;
	top: 0;

	transition:
		opacity $transition-duration $transition-timing,
		background-position ($transition-duration * 5) $transition-timing,
		background-image $transition-duration $transition-timing;
}
</style>
