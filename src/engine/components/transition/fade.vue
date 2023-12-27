<template>
	<Transition name="transition-fade">
		<slot></slot>
	</Transition>
</template>

<style scoped lang="scss">
.transition-fade-enter-active,
.transition-fade-leave-active {
	transition: opacity 0.25s ease-in-out;
}

.transition-fade-enter-from,
.transition-fade-leave-to {
	opacity: 0;
}
</style>
