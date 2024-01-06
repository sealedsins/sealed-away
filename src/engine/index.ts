/**
 * Sealed Sins, 2023-2024.
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { resolve } from './utils/asset';
import FontAwesomeIcon from './icons';
import App from './app.vue';

export class VN {
	private fullSrc: string;

	constructor(public readonly src: string) {
		this.fullSrc = resolve(src);
	}

	public render(domId: string) {
		const app = createApp(App, { src: this.fullSrc });
		app.component('font-awesome-icon', FontAwesomeIcon);
		app.use(createPinia());
		app.mount(`#${domId}`);
	}
}
