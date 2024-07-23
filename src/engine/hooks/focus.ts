/**
 * Sealed Sins, 2023-2024.
 */
import { onMounted, onUnmounted, ref } from 'vue';

/**
 * Window focus status.
 * @returns Window focus status (boolean).
 */
export const useFocus = () => {
	const focused = ref(true);

	const onFocus = () => {
		focused.value = true;
	};

	const onBlur = () => {
		focused.value = false;
	};

	onMounted(() => {
		window.addEventListener('focus', onFocus);
		window.addEventListener('blur', onBlur);
	});

	onUnmounted(() => {
		window.removeEventListener('focus', onFocus);
		window.removeEventListener('blur', onBlur);
	});

	return focused;
};
