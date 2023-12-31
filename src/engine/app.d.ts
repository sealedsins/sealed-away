declare module '*.vue' {
	import { defineComponent } from 'vue';
	export default defineComponent;
}

// declare module '*.vue' {
// 	import type { DefineComponent } from 'vue';
// 	const component: DefineComponent<object, object, any>;
// 	export default component;
// }

declare module '*.jpg' {
	const path: string;
	export default path;
}

declare module '*.png' {
	const path: string;
	export default path;
}
