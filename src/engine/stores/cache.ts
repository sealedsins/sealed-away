/**
 * Sealed Sins, 2023.
 */
import { defineStore } from 'pinia';
import { shallowRef } from 'vue';
import * as asset from '../utils/asset';

/**
 * Cache store.
 * Contains caching mechanisms for novel assets.
 */
export const useCache = defineStore('cache', () => {
	/**
	 * Store cache state.
	 */
	const cache = shallowRef(new Map<string, Blob>());

	/**
	 * Loads `src` as a Blob.
	 * Uses stores cache.
	 */
	const load = async (src: string) => {
		const cached = cache.value.get(src);
		if (cached) {
			return cached;
		}
		const blob = await asset.load(src);
		cache.value.set(src, blob);
		return blob;
	};

	/**
	 * Loads all know assets into the cache.
	 */
	const loadAll = async () => {
		const sources = Object.values(asset.assets);
		await Promise.all(sources.map((src) => load(src)));
	};

	/**
	 * Resets store cache.
	 */
	const $reset = () => {
		cache.value = new Map();
	};

	return {
		...asset,
		cache,
		load,
		loadAll,
		$reset,
	};
});
