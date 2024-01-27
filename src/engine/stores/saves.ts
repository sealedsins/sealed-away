/**
 * Sealed Sins, 2023-2024.
 */
import { defineStore } from 'pinia';
import { reactive, watchEffect } from 'vue';
import { loadCompressed, saveCompressed } from '../utils/storage';
import { useScene } from './scene';

/**
 * Save state.
 */
export interface Save {
	date: number;
	data: string;
}

/**
 * Save state Local Storage domain.
 * @internal
 */
export const STORAGE_DOMAIN = 'saves';

/**
 * Save state management store.
 */
export const useSaves = defineStore('saves', () => {
	const store = useScene();

	/**
	 * Initial Local Storage state.
	 */
	let initialState: Array<Save>;
	try {
		initialState = loadCompressed(STORAGE_DOMAIN) ?? [];
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
		saveCompressed(STORAGE_DOMAIN, slots);
	});

	return {
		slots,
		save,
		load,
	};
});
