/**
 * Sealed Sins, 2023-2024.
 */

/**
 * Removes all elements from the `obj`.
 * @params obj - Object to wipe.
 * @returns Object.
 */
export const clear = <T extends object>(obj: T) => {
	Object.keys(obj).forEach((key) => delete obj[key as keyof T]);
	return obj;
};

/**
 * Replaces `obj` elements with `upd` contents.
 * @params obj - Object to update.
 * @params obj - Object replacement.
 * @returns Object.
 */
export const alter = <T extends Record<string, unknown>>(obj: T, upd: T) => {
	Object.assign(clear(obj), upd);
	return obj;
};
