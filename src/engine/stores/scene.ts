/**
 * Sealed Sins, 2023-2024.
 */
import { computed, shallowRef, triggerRef } from 'vue';
import { defineStore, acceptHMRUpdate } from 'pinia';
import { Scene, ScriptSource, ScriptListener } from '../core';
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
	 * Active scene state.
	 */
	const state = computed(() => {
		return scene.value?.getState();
	});

	/**
	 * Active scene visible menu.
	 */
	const menu = computed(() => {
		return scene.value?.getMenu();
	});

	/**
	 * Active scene execution status.
	 */
	const done = computed(() => {
		return scene.value?.isDone() ?? true;
	});

	/**
	 * Loads scene using parser store data.
	 */
	const init = () => {
		if (parser.data) {
			scene.value = new Scene(parser.data.script as ScriptSource);
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
	 * Jumps to the given `label`.
	 */
	const jump = (label: string) => {
		scene.value?.jump(label);
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
	 * Forces scene refresh.
	 */
	const refresh = () => {
		triggerRef(scene);
	};

	/**
	 * Forces scene reload from the source.
	 */
	const reload = async () => {
		if (parser.data && scene.value) {
			await parser.fetchLast();
			scene.value.patch(parser.data.script as ScriptSource);
			refresh();
		}
	};

	/**
	 * Resets scene state.
	 */
	const $reset = () => {
		scene.value = undefined;
	};

	return {
		scene,
		state,
		menu,
		done,
		init,
		next,
		jump,
		pick,
		emit,
		subscribe,
		refresh,
		reload,
		$reset,
	};
});

/**
 * Scene store HMR.
 */
if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useScene, import.meta.hot));
}
