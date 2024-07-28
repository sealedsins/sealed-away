/**
 * Sealed Sins, 2023-2024.
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import FontAwesomeIcon from './icons';
import App from './app.vue';

export class VN {
	constructor(public readonly src: string) {
		return;
	}

	public render(domId: string) {
		const app = createApp(App, { src: this.src });
		app.component('font-awesome-icon', FontAwesomeIcon);
		app.use(createPinia());
		app.mount(`#${domId}`);
	}
}
