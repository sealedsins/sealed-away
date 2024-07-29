<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useParser, useAssets, useScene, useSaves } from '../stores';
import { onKeypress } from '../hooks';
import TitleButton from '../components/button.vue';
import TitleImage from '../components/image.vue';

const parser = useParser();
const asset = useAssets();
const scene = useScene();
const saves = useSaves();

/**
 * Computed: Title screen images.
 */
const images = computed(() => {
	return parser.data?.config?.title?.images ?? [];
});

/**
 * Computed: Title screen custom buttons.
 */
const buttons = computed(() => {
	return parser.data?.config?.title?.buttons ?? [];
});

/**
 * Computed: Scene save file precense.
 */
const hasSave = computed(() => {
	return saves.slots.length > 0;
});

/**
 * Event handler: Start button click.
 */
const handleStart = () => {
	scene.init();
};

/**
 * Event handler: Load button click.
 */
const handleLoad = () => {
	handleStart();
	saves.load(0);
};

/**
 * Event handler: Custom button lick.
 */
const handleButton = (button: (typeof buttons)['value'][number]) => {
	if (button.link) {
		window.open(button.link);
	}
};

/**
 * Event: Keyboard bindings.
 */
onKeypress((e) => {
	if (e.code === 'Space' || e.code === 'Enter') {
		handleLoad();
	}
});

/**
 * Lifecycle: Vite HMR subscription.
 */
onMounted(() => {
	const unsubcribe = asset.subscribe(async () => {
		await parser.fetchLast();
	});
	onUnmounted(() => {
		unsubcribe();
	});
});
</script>

<template>
	<div class="title">
		<div class="title__images">
			<TitleImage
				v-for="image in images"
				:src="image.src"
				:style="image.style"
				:class="[
					'title__image',
					{
						['title__image--hide-desktop']: image.media?.desktop === false,
						['title__image--hide-tablet']: image.media?.tablet === false,
						['title__image--hide-mobile']: image.media?.mobile === false,
					},
				]"
			/>
		</div>
		<div class="title__buttons">
			<TitleButton class="title__button" @click="handleStart"> Start </TitleButton>
			<TitleButton class="title__button" @click="handleLoad" :disabled="!hasSave">
				Load
			</TitleButton>
			<TitleButton
				v-for="button in buttons"
				class="title__button"
				@click="handleButton(button)"
			>
				{{ button.label }}
			</TitleButton>
		</div>
	</div>
</template>

<style scoped lang="scss">
@import '../styles/mixins.scss';
$interface-width: 1100px;

.title {
	display: flex;
	position: absolute;
	background: #000;

	flex-direction: column;
	justify-content: space-between;
	align-items: stretch;

	width: 100%;
	height: 100%;
	left: 0;
	top: 0;

	&__buttons {
		display: flex;

		flex-direction: row;
		align-items: center;
		justify-content: center;

		margin-top: auto;
		padding: 0 3.5em;
		width: 100%;

		@media (max-width: $breakpoint-mobile) {
			flex-direction: column;
			justify-content: flex-end;
			padding: 2em;
		}
	}

	&__button {
		font-size: 1.25em;
		margin: 3.5rem 1.5rem;
		width: 250px;

		@media (max-width: $breakpoint-mobile) {
			font-size: 1em;
			margin: 0.25em;
		}
	}

	&__images {
		display: block;
		position: absolute;
		width: 100%;
		height: 100%;
		left: 0;
		top: 0;
	}

	&__image {
		position: absolute;
		object-fit: contain;

		&--hide-mobile {
			@media (max-width: $breakpoint-mobile) {
				display: none;
			}
		}

		&--hide-tablet {
			@media (min-width: $breakpoint-mobile) and (max-width: $breakpoint-tablet) {
				display: none;
			}
		}

		&--hide-desktop {
			@media (min-width: $breakpoint-tablet) {
				display: none;
			}
		}
	}
}
</style>
