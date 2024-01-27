/**
 * Sealed Sins, 2023-2024.
 */
import { defineStore } from 'pinia';
import { shallowRef, triggerRef } from 'vue';
import { Scene, ScriptListener } from '../core';
import { useParser } from './parser';

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
	 * Forces scene state to refresh.
	 */
	const refresh = () => {
		triggerRef(scene);
	};

	/**
	 * Loads scene using parser store data.
	 */
	const init = () => {
		if (parser.data) {
			scene.value = new Scene(parser.data.script);
			scene.value.next();
		}
	};

	/**
	 * Executes the next scene frame.
	 */
	const next = () => {
		scene.value?.next();
		refresh();
	};

	/**
	 * Executes menu pick.
	 * @param id - Menu item ID to pick.
	 */
	const pick = (id: string) => {
		scene.value?.pick(id);
		refresh();
	};

	/**
	 * Emits scene event.
	 * @param event - Event to dispatch.
	 */
	const emit = (...args: Parameters<Scene['emit']>) => {
		scene.value?.emit(...args);
		refresh();
	};

	/**
	 * Subscribes to the scene events.
	 * @param listener - Event listener.
	 * @returns Unsubscribe function.
	 */
	const subscribe = (listener: ScriptListener) => {
		const unsubscribe = scene.value?.subscribe(listener);
		return unsubscribe ?? (() => {});
	};

	/**
	 * Resets scene state.
	 */
	const $reset = () => {
		scene.value = undefined;
	};

	return {
		scene,
		init,
		next,
		pick,
		emit,
		subscribe,
		refresh,
		$reset,
	};
});
