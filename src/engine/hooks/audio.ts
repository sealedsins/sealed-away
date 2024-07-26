/**
 * Sealed Sins, 2023-2024.
 */
import { Howl } from 'howler';
import { ref, watch } from 'vue';
import { useWindowFocus } from '@vueuse/core';
import { useCache } from '../stores';

/**
 * Fade duration in miliseconds.
 * @internal
 */
const AUDIO_FADE = 350;

/**
 * Audio parameters.
 */
export interface AudioOptions {
	path: string;
	volume?: number;
	loop?: boolean;
}

/**
 * Audio player.
 */
export const useAudio = () => {
	const focus = useWindowFocus();
	const cache = useCache();

	/**
	 * Loop storage.
	 */
	const loop = ref<Howl>();

	/**
	 * Loop original volume.
	 */
	const loopVolume = ref(1);

	/**
	 * Plays audio with a given parameters.
	 * @param opts - Audio parameters.
	 * @returns Audio object.
	 */
	const play = async (opts: AudioOptions) => {
		const sound = await cache.readAsBase64(await cache.load(opts.path));
		const audio = new Howl({
			src: [sound],
			volume: opts.volume,
			loop: opts.loop,
		});
		audio.play();
		if (opts.loop) {
			stop();
			loopVolume.value = audio.volume();
			loop.value = audio;
		}
	};

	/**
	 * Pauses looped audio.
	 * @param fade - Use fade effect (optional, true by default).
	 */
	const pause = (fade: boolean = true) => {
		if (loop.value) {
			loop.value.fade(loopVolume.value, 0, fade ? AUDIO_FADE : 0);
			loop.value.once('fade', () => loop.value?.pause());
		}
	};

	/**
	 * Resumes looped audio.
	 * @param fade - Use fade effect (optional, true by default).
	 */
	const resume = (fade: boolean = true) => {
		if (loop.value && !loop.value.playing()) {
			loop.value.play();
			loop.value.fade(0, loopVolume.value, fade ? AUDIO_FADE : 0);
		}
	};

	/**
	 * Stops looped audio.
	 * @param fade - Use fade effect (optional, true by default).
	 */
	const stop = (fade: boolean = true) => {
		pause(fade);
		loop.value = undefined;
	};

	/**
	 * Pause loop audio on window blur and resume afterwards.
	 */
	watch(focus, () => {
		if (!focus.value) {
			pause();
		} else {
			resume();
		}
	});

	return {
		play,
		pause,
		resume,
		stop,
	};
};
