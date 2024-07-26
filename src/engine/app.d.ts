declare module '*.vue' {
	import { defineComponent } from 'vue';
	export default defineComponent;
}

declare module '*.jpg' {
	const path: string;
	export default path;
}

declare module '*.png' {
	const path: string;
	export default path;
}
