<script setup lang="ts">
import { computed } from 'vue';
import TitleButton from '../components/button.vue';
import { useScene, useParser } from '../stores';
import { onKeydown } from '../utils/input';

const parser = useParser();
const scene = useScene();

const images = computed(() => {
	return parser.data?.config?.title?.images ?? [];
});

const buttons = computed(() => {
	return parser.data?.config?.title?.buttons ?? [];
});

const handleStart = () => {
	scene.init();
};

const handleLoad = () => {
	// TODO save/load feature
};

const handleButton = (button: (typeof buttons)['value'][number]) => {
	if (button.link) {
		window.open(button.link);
	}
};

onKeydown((e) => {
	if (!e.repeat && (e.code === 'Space' || e.code === 'Enter')) {
		handleStart();
	}
});
</script>

<template>
	<div class="menu">
		<div class="menu__images">
			<img
				v-for="image in images"
				:src="image.src"
				:style="image.style"
				:class="[
					'menu__image',
					{
						['menu__image--hide-desktop']: image.media?.desktop === false,
						['menu__image--hide-tablet']: image.media?.tablet === false,
						['menu__image--hide-mobile']: image.media?.mobile === false,
					},
				]"
			/>
		</div>
		<div class="menu__buttons">
			<TitleButton class="menu__button" @click="handleStart"> Start </TitleButton>
			<TitleButton class="menu__button" @click="handleLoad" disabled> Load </TitleButton>
			<TitleButton
				v-for="button in buttons"
				class="menu__button"
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

.menu {
	display: flex;
	position: absolute;
	background: #333;

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
