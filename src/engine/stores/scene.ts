/**
 * Sealed Sins, 2023-2024.
 */
import { defineStore } from 'pinia';
import { ref, shallowRef, triggerRef } from 'vue';
import { Scene, ScriptListener } from '../core';
import { useParser } from './parser';

/**
 * Scene storage type.
 * @internal
 */
export type SceneStorage = Array<{
	data: string;
}>;

/**
 * Scene state storage key.
 * @internal
 */
export const STORAGE_KEY = 'saves';

/**
 * Reads scene local storage.
 * @returns Scene storage.
 * @internal
 */
export const readStorage = () => {
	const base64 = localStorage.getItem(STORAGE_KEY);
	if (!base64) {
		return [];
	}
	const data = JSON.parse(atob(base64));
	return data as SceneStorage;
};

/**
 * Writes scene local storage.
 * @params storage - Scene storage.
 * @internal
 */
export const writeStorage = (storage: SceneStorage) => {
	const base64 = btoa(JSON.stringify(storage));
	localStorage.setItem(STORAGE_KEY, base64);
};

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
	 * Scene storage.
	 */
	const storage = ref(readStorage());

	/**
	 * Refreshes scene state.
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
	 * Loads scene state from the given `slot`.
	 * Does nothing if scene is not initialized or slot is empty.
	 * @param slot - Slot to load.
	 */
	const load = (slot: number) => {
		const state = storage.value[slot];
		if (state && scene.value) {
			scene.value.load(state.data);
			refresh();
		}
	};

	/**
	 * Saves scene state to the given `slot`.
	 * Does nothing if scene is not initialized.
	 * @param slot - Slot to save.
	 */
	const save = (slot: number) => {
		if (scene.value) {
			storage.value[slot] = { data: scene.value.save() };
			writeStorage(storage.value);
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
		storage,
		init,
		next,
		pick,
		emit,
		save,
		load,
		subscribe,
		refresh,
		$reset,
	};
});
