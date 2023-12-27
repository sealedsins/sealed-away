/**
 * Sealed Sins, 2023.
 */
import { defineStore } from 'pinia';
import { shallowRef, triggerRef, watch } from 'vue';
import { Scene, SceneEvent } from '../core';
import { useParser } from './parser';
// import * as asset from '../utils/asset';

/**
 * Scene store.
 */
export const useScene = defineStore('scene', () => {
	const parser = useParser();

	/**
	 * Active scene.
	 */
	const scene = shallowRef<Scene>();

	/**
	 * Loads scene using parser store data.
	 */
	const init = () => {
		if (parser.data) {
			scene.value = new Scene(parser.data.script);
			scene.value.next({ type: 'next' });
		}
	};

	/**
	 * Emits new Scene event.
	 */
	const emit = (event: SceneEvent) => {
		scene.value?.next(event);
		refresh();
	};

	/**
	 * Refreshes Scene state.
	 */
	const refresh = () => {
		triggerRef(scene);
	};

	/**
	 * Resets Scene state.
	 */
	const $reset = () => {
		scene.value = undefined;
	};

	return {
		scene,
		init,
		emit,
		refresh,
		$reset,
	};
});
