<script setup lang="ts">
import TransitionFade from './transition/fade.vue';
import { ref, watchEffect } from 'vue';
import { useAssets } from '../stores';

const props = defineProps<{
	src?: string;
}>();

const asset = useAssets();
const srcData = ref<string>();

const loadImage = async () => {
	if (!props.src) {
		srcData.value = undefined;
		return;
	}
	try {
		const dataToLoad = props.src;
		const dataLoaded = await asset.load(dataToLoad);
		const dataBase64 = await asset.readAsBase64(dataLoaded);

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
	<TransitionFade :mode="src ? 'in-out' : 'out-in'">
		<img v-show="srcData" :key="srcData" :src="srcData" />
	</TransitionFade>
</template>
