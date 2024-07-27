declare module '*.vue' {
	import { defineComponent } from 'vue';
	export default defineComponent;
}

declare module '*.yml' {
	const path: string;
	export default path;
}

declare module '*.jpg' {
	const path: string;
	export default path;
}

declare module '*.png' {
	const path: string;
	export default path;
}

declare module '*.mp3' {
	const path: string;
	export default path;
}
