<script setup lang="ts">
import SceneButton from '../button.vue';
const emit = defineEmits(['resume', 'save', 'load', 'exit']);
const props = defineProps<{
	disableLoad?: boolean;
}>();
</script>

<template>
	<!-- prettier-ignore -->
	<div class="pause">
		<SceneButton class="pause__button" @click="emit('resume')">
			Resume 
		</SceneButton>
		<SceneButton class="pause__button" @click="emit('save')">
			Save 
		</SceneButton>
		<SceneButton class="pause__button" @click="emit('load')" :disabled="disableLoad">
			Load 
		</SceneButton>
		<SceneButton class="pause__button" @click="emit('exit')">
			Exit
		</SceneButton>
	</div>
</template>

<style scoped lang="scss">
@import '../../styles/mixins.scss';
$interface-width: 475px;

.pause {
	display: flex;
	position: absolute;

	flex-direction: column;
	justify-content: center;
	align-items: center;

	background: #00000066;
	-webkit-backdrop-filter: blur(5px);
	backdrop-filter: blur(5px);
	padding: 1.5em;

	top: 0;
	left: 0;
	height: 100%;
	width: 100%;

	&__button {
		max-width: $interface-width;
		margin-bottom: 0.5em;
		width: 100%;
	}
}
</style>
