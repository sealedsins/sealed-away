/**
 * Sealed Sins, 2023.
 */
import { onMounted, onUnmounted, handleError, getCurrentInstance } from 'vue';

/**
 * Creates a new global keyboard event listener.
 */
export const onKeydown = (handler: (e: KeyboardEvent) => void) => {
	const instance = getCurrentInstance();
	const handlerWrapper = (e: KeyboardEvent) => {
		try {
			handler(e);
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
