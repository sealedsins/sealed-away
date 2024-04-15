<script setup lang="ts">
import { Transition, TransitionGroup } from 'vue';
defineProps<{ group?: boolean }>();
</script>

<template>
	<component
		:is="group ? TransitionGroup : Transition"
		:name="group ? 'transition-fade-group' : 'transition-fade'"
		v-bind="$attrs"
	>
		<slot></slot>
	</component>
</template>

<style lang="scss">
.transition-fade,
.transition-fade-group {
	&-enter-active,
	&-leave-active {
		transition: opacity 0.25s ease-in-out;
	}

	&-enter-from,
	&-leave-to {
		opacity: 0;
	}
}

.transition-fade-group {
	&-leave-to {
		transition-delay: 0.325s;
	}
}
</style>
