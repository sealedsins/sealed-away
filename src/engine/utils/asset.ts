/**
 * Sealed Sins, 2023.
 */
export const assets = import.meta.glob('/assets/**/*', { eager: true, as: 'url' });

/**
 * Resolves full path to the given asset.
 * Throws an error if such path does not exist.
 */
export const resolve = (src: string) => {
	const fullPath = `/assets/${src}`.replace(/\/{2,}/, '/');
	const resolved = assets[fullPath];
	if (!resolved) {
		throw new Error(`Asset is not found: ${src}`);
	} else {
		return resolved;
	}
};

/**
 * Loads `src` as a Blob.
 */
export const load = (src: string) =>
	new Promise<Blob>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', src);
		xhr.responseType = 'blob';
		xhr.onerror = () => reject();
		xhr.onloadend = () => resolve(xhr.response);
		xhr.send();
	});

/**
 * Reads `src` Blob as a Base64 string.
 */
export const readAsBase64 = (src: Blob) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(src);
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = () => reject();
	});

/**
 * Reads `src` Blob as a raw text.
 */
export const readAsText = (src: Blob) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsText(src);
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = () => reject();
	});
