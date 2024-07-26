/**
 * Sealed Sins, 2023-2024.
 */
import { onMounted, onUnmounted, handleError, getCurrentInstance } from 'vue';

/**
 * Keyboard event listener hook.
 * @param listener - Event listener.
 */
export const onKeydown = (listener: (e: KeyboardEvent) => void) => {
	const instance = getCurrentInstance();
	const strapped = (e: KeyboardEvent) => {
		try {
			listener(e);
		} catch (err) {
			const errType = 0;
			handleError(err, instance, errType);
		}
	};

	onMounted(() => {
		window.addEventListener('keydown', strapped);
	});

	onUnmounted(() => {
		window.removeEventListener('keydown', strapped);
	});
};

/**
 * Keyboard press event listener (non-repeating).
 * @param listener - Event listener.
 */
export const onKeypress = (listener: (e: KeyboardEvent) => void) => {
	return onKeydown((e) => {
		if (!e.repeat) {
			listener(e);
		}
	});
};
