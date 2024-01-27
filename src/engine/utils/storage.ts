/**
 * Sealed Sins, 2023-2024.
 */
import { compressToBase64, decompressFromBase64 } from 'lz-string';

/**
 * Loads compressed value from the local storage.
 * @param key - Key to load.
 * @returns Loaded value (or null if there is none).
 */
export const loadCompressed = <T = unknown>(key: string) => {
	const base64 = localStorage.getItem(key);
	if (!base64) {
		return null;
	}
	const json = decompressFromBase64(base64);
	const data = JSON.parse(json);
	return data as T;
};

/**
 * Saves compressed value to the local storage.
 * @param key - Key to save.
 * @param value - Value to save.
 */
export const saveCompressed = <T = unknown>(key: string, value: T) => {
	const base64 = compressToBase64(JSON.stringify(value));
	localStorage.setItem(key, base64);
};
