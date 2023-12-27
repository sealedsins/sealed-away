<template>
	<button class="button">
		<slot></slot>
	</button>
</template>

<style scoped lang="scss">
@import '../styles/mixins.scss';

.button {
	display: block;
	padding: 0.65em 1em;
	appearance: none;

	cursor: pointer;
	transition: transform 0.25s;
	text-align: center;
	font: inherit;

	color: $card-color;
	background-color: $card-background;
	-webkit-backdrop-filter: blur($card-blur);
	backdrop-filter: blur($card-blur);
	border-radius: $card-radius;
	border: none;

	padding: 0.75em;
	margin-bottom: 0.25em;

	&:focus {
		outline: none;
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	&:not(:disabled) {
		&:hover,
		&:focus,
		&:active {
			transform: scale(1.05);
		}
	}
}
</style>
