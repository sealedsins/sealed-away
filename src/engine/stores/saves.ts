/**
 * Sealed Sins, 2023-2024.
 */
import { defineStore } from 'pinia';
import { reactive, watchEffect } from 'vue';
import { loadCompressed, saveCompressed } from '../utils/storage';
import { useScene } from './scene';

/**
 * Save structure.
 */
export interface Save {
	date: number;
	data: string;
}

/**
 * Save Local Storage Domain (Path).
 * @internal
 */
export const SAVE_STORAGE_DOMAIN = 'saves';

/**
 * Savestate management store.
 */
export const useSaves = defineStore('saves', () => {
	const store = useScene();

	/**
	 * Initial Local Storage state.
	 */
	let initialState: Array<Save>;
	try {
		initialState = loadCompressed(SAVE_STORAGE_DOMAIN) ?? [];
	} catch (err) {
		initialState = [];
	}

	/**
	 * Save slots.
	 */
	const slots = reactive<Array<Save>>(initialState);

	/**
	 * Saves scene state to the given `slot`.
	 * @params slot - Slot to save.
	 */
	const save = (slot: number) => {
		if (store.scene) {
			slots[slot] = {
				date: Date.now(),
				data: store.scene.save(),
			};
		}
	};

	/**
	 * Loads scene state from the given `slot`.
	 * @params slot - Slot to load.
	 */
	const load = (slot: number) => {
		const state = slots[slot];
		if (store.scene && state) {
			store.scene.load(state.data);
			store.refresh();
		}
	};

	watchEffect(() => {
		saveCompressed(SAVE_STORAGE_DOMAIN, slots);
	});

	return {
		slots,
		save,
		load,
	};
});
