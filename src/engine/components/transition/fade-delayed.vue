<template>
	<Transition name="transition-fade-delayed">
		<slot></slot>
	</Transition>
</template>

<style scoped lang="scss">
.transition-fade-delayed-enter-active,
.transition-fade-delayed-leave-active {
	transition: opacity 0.75s ease-in-out;
}

.transition-fade-delayed-enter-from,
.transition-fade-delayed-leave-to {
	opacity: 0;
}

.transition-fade-delayed-enter-to {
	transition-delay: 0.5s;
}
</style>
