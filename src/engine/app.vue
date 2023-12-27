<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { shallowRef, onMounted, onErrorCaptured } from 'vue';
import TransitionFadeDelayed from './components/transition/fade-delayed.vue';
import { useParser, useScene } from './stores';

import TitleView from './views/title.vue';
import SceneView from './views/scene.vue';
import FatalView from './views/fatal.vue';

const props = defineProps<{
	src: string;
}>();

const { scene } = storeToRefs(useScene());
const parser = useParser();

const error = shallowRef<Error>();

onErrorCaptured((err) => {
	error.value = err;
	return false;
});

onMounted(async () => {
	try {
		await parser.fetch(props.src);
	} catch (err) {
		error.value = err as Error;
	}
});
</script>

<template>
	<TransitionFadeDelayed appear mode="out-in" :style="{ transitionDuration: '.5s' }">
		<FatalView v-if="error" :error="error" />
		<SceneView v-else-if="scene" />
		<TitleView v-else />
	</TransitionFadeDelayed>
</template>

<style lang="scss">
@import './styles/global.scss';
</style>
