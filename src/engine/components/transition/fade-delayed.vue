<script setup lang="ts">
import { Transition, TransitionGroup } from 'vue';
defineProps<{ group?: boolean }>();
</script>

<template>
	<component
		:is="group ? TransitionGroup : Transition"
		:name="group ? 'transition-fade-delayed-group' : 'transition-fade-delayed'"
		v-bind="$attrs"
	>
		<slot></slot>
	</component>
</template>

<style lang="scss">
.transition-fade-delayed,
.transition-fade-delayed-group {
	&-enter-active,
	&-leave-active {
		transition: opacity 0.5s ease-in-out;
	}

	&-enter-from,
	&-leave-to {
		opacity: 0;
	}

	&-enter-to {
		transition-delay: 0.5s;
	}
}

.transition-fade-delayed-group {
	&-leave-to {
		transition-delay: 0.325s;
	}
}
</style>
