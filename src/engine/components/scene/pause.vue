<script setup lang="ts">
import SceneButton from '../button.vue';
const emit = defineEmits(['resume', 'save', 'load', 'exit']);
defineProps<{
	disableLoad?: boolean;
}>();
</script>

<template>
	<!-- prettier-ignore -->
	<div class="pause">
		<SceneButton class="pause__button" @click="emit('resume')">
			Resume 
		</SceneButton>
		<div class="pause__row">
			<SceneButton class="pause__button" @click="emit('save')">
				Save 
			</SceneButton>
			<SceneButton class="pause__button" @click="emit('load')" :disabled="disableLoad">
				Load 
			</SceneButton>
		</div>
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
	-webkit-backdrop-filter: blur(8.5px);
	backdrop-filter: blur(8.5px);
	padding: 1.5em;

	top: 0;
	left: 0;
	height: 100%;
	width: 100%;
	gap: 0.5em;

	&__title {
		color: #fff;
		margin-bottom: 0.25em;
		font-weight: 100;
		font-size: 2em;
	}

	&__row {
		display: flex;
		max-width: $interface-width;
		justify-content: stretch;
		flex-direction: row;
		width: 100%;
		gap: 0.75em;
	}

	&__button {
		max-width: $interface-width;
		width: 100%;
	}
}
</style>
