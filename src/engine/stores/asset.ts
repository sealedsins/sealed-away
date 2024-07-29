/**
 * Sealed Sins, 2023-2024.
 */
import { ref, shallowRef } from 'vue';
import { defineStore, acceptHMRUpdate } from 'pinia';
import commonPathPrefix from 'common-path-prefix';
import { mapKeys } from 'lodash';
import { alter } from '../utils/object';

/**
 * Normalizes asset data.
 * @params data - Asset glob import result.
 * @returns Asset data without common path prefix.
 * @internal
 */
export const normalize = (data: Record<string, string>) => {
	const prefix = commonPathPrefix(Object.keys(data));
	return mapKeys(data, (_, key) => {
		return `/${key.slice(prefix.length)}`;
	});
};

/**
 * Normalized asset data.
 * @internal
 */
export const assets = normalize(
	import.meta.glob<true, string, string>('~assets/**/*', {
		eager: true,
		import: 'default',
		query: '?url',
	}),
);

/**
 * Asset management.
 */
export const useAssets = defineStore('asset', () => {
	/**
	 * Asset cache.
	 * @internal
	 */
	const cache = shallowRef(new Map<string, Blob>());

	/**
	 * Asset update listeners.
	 * @remarks Used for Vite HMR interactions.
	 * @internal
	 */
	const subs = ref<Array<() => void>>([]);

	/**
	 * Resolves full path to the given asset.
	 * Throws an error if such path does not exist.
	 * @param src - Source to resolve.
	 * @returns Resolved path.
	 */
	const resolve = (src: string) => {
		const safePath = src.startsWith('/') ? src : `/${src}`;
		const resolved = assets[safePath] as string;
		if (!resolved) {
			throw new Error(`Asset is not found: ${src}`);
		} else {
			return resolved;
		}
	};

	/**
	 * Loads `src` as a Blob.
	 * @remarks Implements basic caching strategy.
	 * @param src - Source to load.
	 * @returns Loaded blob.
	 */
	const load = async (src: string) => {
		const cached = cache.value.get(src);
		if (cached) {
			return cached;
		}
		const loaded = await new Promise<Blob>((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('GET', src);
			xhr.responseType = 'blob';
			xhr.onerror = () => reject();
			xhr.onloadend = () => resolve(xhr.response);
			xhr.send();
		});
		cache.value.set(src, loaded);
		return loaded;
	};

	/**
	 * Loads all know assets into the cache.
	 */
	const loadAll = async () => {
		const sources = Object.values(assets);
		await Promise.all(sources.map((src) => load(src)));
	};

	/**
	 * Reads `src` Blob as a Base64 string.
	 * @param src - Blob to read.
	 * @returns Base64 string.
	 */
	const readAsBase64 = (src: Blob) => {
		return new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(src);
			reader.onloadend = () => resolve(reader.result as string);
			reader.onerror = () => reject();
		});
	};

	/**
	 * Reads `src` Blob as a raw text.
	 * @param src - Blob to read.
	 * @returns Plain string.
	 */
	const readAsText = (src: Blob) => {
		return new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsText(src);
			reader.onloadend = () => resolve(reader.result as string);
			reader.onerror = () => reject();
		});
	};

	/**
	 * Subscribes to the asset updates.
	 * @param listener - Event listener.
	 * @returns Unsubscribe function.
	 */
	const subscribe = (listener: () => void) => {
		subs.value.push(listener);
		return () => {
			const index = subs.value.indexOf(listener);
			subs.value.splice(index, 1);
		};
	};

	/**
	 * Resets asset cache.
	 */
	const $reset = () => {
		cache.value.clear();
	};

	return {
		cache,
		subs,
		resolve,
		load,
		loadAll,
		readAsBase64,
		readAsText,
		subscribe,
		$reset,
	};
});

/**
 * Asset store HMR.
 */
if (import.meta.hot) {
	import.meta.hot.accept((upd) => {
		alter(assets, normalize(upd?.assets ?? {}));
		acceptHMRUpdate(useAssets, import.meta.hot)(upd);
		const store = useAssets();
		store.$reset();
		store.subs.forEach((listener) => {
			listener();
		});
	});
}
