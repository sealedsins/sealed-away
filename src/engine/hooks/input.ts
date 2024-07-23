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
	const strappedListener = (e: KeyboardEvent) => {
		try {
			listener(e);
		} catch (err) {
			const errType = 0;
			handleError(err, instance, errType);
		}
	};

	onMounted(() => {
		window.addEventListener('keydown', strappedListener);
	});

	onUnmounted(() => {
		window.removeEventListener('keydown', strappedListener);
	});
};
