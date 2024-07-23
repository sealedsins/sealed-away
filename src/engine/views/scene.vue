<script setup lang="ts">
import { sha1 as hash } from 'object-hash';
import { ref, watch, computed, onMounted, nextTick } from 'vue';
import { onKeyStroke } from '@vueuse/core';
import { ScriptEvent } from '../core';
import { onKeydown, useAudio, AudioOptions } from '../hooks';
import { useScene, useSaves } from '../stores';

import TransitionFade from '../components/transition/fade.vue';
import SceneButton from '../components/button.vue';
import SceneImage from '../components/image.vue';
import SceneTypewriter from '../components/scene/typewriter.vue';
import ScenePause from '../components/scene/pause.vue';

const audio = useAudio();
const store = useScene();
const saves = useSaves();

/**
 * Scene looped typewriter.
 */
const typewriter = ref<typeof SceneTypewriter>();

/**
 * Scene pause state.
 */
const paused = ref(false);

/**
 * Scene `wait` state.
 */
const wait = ref(false);

/**
 * Scene state.
 */
const state = computed(() => {
	return store.scene?.getState();
});

/**
 * Scene menu.
 */
const menu = computed(() => {
	return store.scene?.getMenu();
});

/**
 * Fullscreen support indicator.
 */
const hasFullscreen = computed(() => {
	return !!document.documentElement.requestFullscreen;
});

/**
 * Scene save file precense indicator.
 */
const hasSaveFile = computed(() => {
	return saves.slots.length > 0;
});

/**
 * Event handler: Scene next step.
 */
const handleNext = () => {
	if (wait.value || paused.value) {
		return;
	}
	if (typewriter.value?.typing) {
		typewriter.value?.skipTyping();
	} else if (store.scene?.isDone()) {
		handleExit();
	} else {
		store.next();
	}
};

/**
 * Event handler: Scene menu pick.
 */
const handleMenu = (id: string) => {
	store.pick(id);
};

/**
 * Event handler: Save button (pause menu).
 */
const handleSave = () => {
	paused.value = false;
	saves.save(0);
};

/**
 * Event handler: Load button (pause menu).
 */
const handleLoad = () => {
	paused.value = false;
	saves.load(0);
	nextTick(() => {
		typewriter.value?.skipTyping();
	});
};

/**
 * Event handler: Exit button (pause menu).
 */
const handleExit = () => {
	store.$reset();
	audio.stop();
};

/**
 * Event handler: Toggle fullscreen button click.
 */
const handleFullscreen = () => {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen();
	} else if (document.exitFullscreen) {
		document.exitFullscreen();
	}
};

/**
 * Event handler: Scene `play` event.
 */
const handleAudioPlay = async (event: ScriptEvent) => {
	audio.play(event.data as AudioOptions);
};

/**
 * Event handler: Scene `stop` event.
 */
const handleAudioStop = async (event: ScriptEvent) => {
	const { fade } = event.data as { fade?: boolean };
	audio.stop(fade);
};

/**
 * Event handler: Scene `wait` event.
 */
const handleWait = async (event: ScriptEvent) => {
	const data = event.data as { seconds: number };
	const time = data.seconds * 1000;
	wait.value = true;
	setTimeout(() => {
		wait.value = false;
		handleNext();
	}, time);
};

watch(paused, () => {
	if (paused.value) {
		audio.pause();
	} else {
		audio.resume();
	}
});

onMounted(() => {
	nextTick(() => {
		typewriter.value?.skipTyping();
	});
	nextTick(() => {
		const loop = state.value?.loop;
		if (loop) {
			audio.play(loop);
		}
	});
	store.subscribe((event) => {
		switch (event.type) {
			case 'wait': {
				handleWait(event);
				break;
			}
			case 'play': {
				handleAudioPlay(event);
				break;
			}
			case 'stop': {
				handleAudioStop(event);
				break;
			}
		}
	});
});

onKeydown((e) => {
	if (e.repeat || paused.value) {
		return;
	}
	if (e.code === 'Space' || e.code === 'Enter') {
		handleNext();
		return;
	}
});
</script>

<template>
	<div v-if="state" class="scene" :style="{ backgroundColor: state.background.color }">
		<SceneImage
			class="background"
			:src="state.background.image ?? undefined"
			:style="{
				transition: 'opacity 0.5s ease-in-out, object-position 2.5s ease-in-out',
				objectPosition: state.background.position,
			}"
		/>
		<TransitionFade>
			<ScenePause
				v-show="paused"
				:disableLoad="!hasSaveFile"
				@resume="paused = false"
				@save="handleSave()"
				@load="handleLoad()"
				@exit="handleExit()"
			/>
		</TransitionFade>
		<TransitionFade>
			<div v-show="!paused" class="interface" @click.self="handleNext()">
				<div class="sprites">
					<TransitionFade group>
						<SceneImage
							v-for="sprite in state.sprites"
							class="sprites__item"
							:key="hash(sprite)"
							:src="sprite.image"
							:style="{
								marginLeft: sprite.position === 'right' && '50%',
								marginRight: sprite.position === 'left' && '50%',
							}"
						/>
					</TransitionFade>
				</div>
				<div class="interface__buttons">
					<scene-button :focus="false" @click="paused = true">
						<font-awesome-icon icon="fa-solid fa-pause" />
					</scene-button>
					<scene-button v-if="hasFullscreen" :focus="false" @click="handleFullscreen()">
						<font-awesome-icon icon="fa-solid fa-expand" />
					</scene-button>
				</div>
				<TransitionFade>
					<div v-if="menu" class="menu">
						<scene-button
							v-for="item in menu"
							class="menu__item"
							@click="handleMenu(item.id)"
						>
							{{ item.label }}
						</scene-button>
					</div>
				</TransitionFade>
				<div v-if="!wait" class="text" @click="handleNext()">
					<div v-if="state.name" class="text__name">
						{{ state.name }}
					</div>
					<div class="text__body">
						<SceneTypewriter ref="typewriter" :text="state.text" />
					</div>
				</div>
			</div>
		</TransitionFade>
	</div>
</template>

<style scoped lang="scss">
@import '../styles/mixins.scss';
$interface-width: 1100px;

.scene {
	position: absolute;
	background: #222;
	overflow: hidden;

	width: 100%;
	height: 100%;
	left: 0;
	top: 0;

	line-height: 1.35;
	font-size: 18.5px;

	@media (max-width: $breakpoint-tablet) {
		font-size: 18px;
	}

	@media (max-width: $breakpoint-mobile) {
		font-size: 14.5px;
	}
}

.background {
	position: absolute;
	object-fit: cover;

	width: 100%;
	height: 100%;
	left: 0;
	top: 0;
}

.interface {
	display: flex;
	position: relative;

	flex-direction: column;
	justify-content: space-between;
	align-items: flex-start;

	max-width: $interface-width;
	height: 100%;
	width: 100%;

	padding: 1.75em;
	margin: 0 auto;

	@media (max-width: $breakpoint-mobile) {
		padding: 1em;
	}

	&__buttons {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		margin-bottom: -1em;
		width: 100%;

		> * {
			min-width: 3em;
			transition: opacity 0.25s;
			opacity: 0.25;

			&:hover {
				opacity: 1;
			}
		}
	}
}

.text {
	position: relative;
	cursor: pointer;

	color: $card-color;
	background-color: $card-background;
	-webkit-backdrop-filter: blur($card-blur);
	backdrop-filter: blur($card-blur);
	border-radius: $card-radius;

	padding: 0.75em;
	width: 100%;

	&__name {
		margin-bottom: 0.25em;
		font-weight: 600;
	}

	&__body {
		font: inherit;
		white-space: pre-wrap;
		text-overflow: ellipsis;
		overflow-x: hidden;
		overflow-y: auto;

		min-height: 2.75em;
		// max-height: 7.75em;
		height: 100%;

		@media (max-width: $interface-width) {
			text-align: justify;
			white-space: normal;
		}
	}
}

.menu {
	display: flex;
	position: relative;
	flex-direction: column;
	align-items: center;
	overflow-x: hidden;
	overflow-y: wrap;
	margin: auto 0;
	width: 100%;

	&__item {
		max-width: $interface-width * 0.5;
		margin-bottom: 0.5em;
		width: 100%;
	}
}

.sprites {
	display: flex;
	position: absolute;
	justify-content: center;
	align-items: flex-end;
	width: 100%;
	height: 100%;
	left: 0;
	top: 0;

	@media (max-width: $breakpoint-mobile) {
		width: 130vw;
		margin-left: -15vw;
	}

	&__item {
		display: block;
		position: absolute;
		object-fit: contain;
		object-position: center bottom;
		min-width: $breakpoint-tablet * 0.5;
		width: 30%;
		height: 90%;
	}
}
</style>
