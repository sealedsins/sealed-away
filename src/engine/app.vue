<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { shallowRef, onMounted, onErrorCaptured } from 'vue';
import { useTitle, useFavicon } from '@vueuse/core';
import TransitionFadeDelayed from './components/transition/fade-delayed.vue';
import { useAssets, useParser, useScene } from './stores';

import LoadingView from './views/loading.vue';
import TitleView from './views/title.vue';
import SceneView from './views/scene.vue';
import ErrorView from './views/error.vue';

const props = defineProps<{
	src: string;
}>();

const domTitle = useTitle();
const domIcon = useFavicon();

const asset = useAssets();
const { scene } = storeToRefs(useScene());
const parser = useParser();

const error = shallowRef<Error>();
const ready = shallowRef(false);

const isDevMode = import.meta.env.DEV;
const loadGame = async () => {
	if (isDevMode) {
		console.log('Development mode is detected, disabling asset preloading.');
		await parser.fetch(asset.resolve(props.src));
	} else {
		console.log('Loading game assets...');
		await asset.loadAll();
		await parser.fetch(asset.resolve(props.src));
	}
};

const loadMeta = async () => {
	const meta = parser.data?.config?.meta;
	if (!meta) {
		return;
	}
	domTitle.value = meta.title;
	domIcon.value = meta.icon;
};

onErrorCaptured((err) => {
	error.value = err;
	return false;
});

onMounted(async () => {
	try {
		await loadGame();
		await loadMeta();
	} catch (err) {
		error.value = err as Error;
	} finally {
		ready.value = true;
	}
});
</script>

<template>
	<TransitionFadeDelayed mode="out-in">
		<LoadingView v-if="!ready" />
		<ErrorView v-else-if="error" :error="error" />
		<SceneView v-else-if="scene" />
		<TitleView v-else />
	</TransitionFadeDelayed>
</template>

<style lang="scss">
@import './styles/global.scss';
</style>
