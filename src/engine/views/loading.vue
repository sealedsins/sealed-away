<template>
	<div class="loading">
		<div class="loading__title">Loading…</div>
		<font-awesome-icon class="loading__icon" icon="fa-solid fa-spinner" />
	</div>
</template>

<style scoped lang="scss">
@keyframes spin {
	100% {
		-webkit-transform: rotate(360deg);
		transform: rotate(360deg);
	}
}
.loading {
	position: absolute;
	display: flex;

	flex-direction: column;
	justify-content: center;
	align-items: center;

	font-size: 1.25em;
	font-weight: 100;
	letter-spacing: 0.075em;
	color: #fff;

	width: 100%;
	height: 100%;
	left: 0;
	top: 0;

	&__title {
		margin-bottom: 0.65em;
	}

	&__icon {
		opacity: 0.75;
		-webkit-animation: spin 1s linear infinite;
		animation: spin 1s linear infinite;
	}
}
</style>
