/**
 * Sealed Sins, 2023-2024.
 */
import { onMounted, onUnmounted, handleError, getCurrentInstance } from 'vue';

/**
 * Creates a new global keyboard event listener.
 * @param listener - Event listener.
 */
export const onKeydown = (listener: (e: KeyboardEvent) => void) => {
	const instance = getCurrentInstance();
	const handlerWrapper = (e: KeyboardEvent) => {
		try {
			listener(e);
		} catch (err) {
			const errType = 0;
			handleError(err, instance, errType);
		}
	};

	onMounted(() => {
		window.addEventListener('keydown', handlerWrapper);
	});

	onUnmounted(() => {
		window.removeEventListener('keydown', handlerWrapper);
	});
};
