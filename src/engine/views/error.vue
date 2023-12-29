<script setup lang="ts">
import { computed } from 'vue';
import { ParserError, ScriptError } from '../core';
import { useParser } from '../stores';

const parser = useParser();
const props = defineProps<{
	error: Error;
}>();

const name = computed(() => props.error.name);
const message = computed(() => props.error.message);
const stack = computed(() => props.error.stack);

const path = computed(() => {
	if (props.error instanceof ParserError) {
		const pos = props.error.pos;
		return pos && `(${pos.line}:${pos.col})`;
	}
	if (props.error instanceof ScriptError) {
		const ctx = parser.context;
		const pos = props.error.path && ctx?.trace(['script', ...props.error.path]);
		return pos && `(${pos.line}:${pos.col})`;
	}
});
</script>

<template>
	<div class="fatal">
		<div class="fatal__title">
			<font-awesome-icon class="fatal__icon" icon="fa-solid fa-warning" />
			<span>{{ name }}{{ path }}: {{ message }}</span>
		</div>
		<div class="fatal__stack">{{ stack }}</div>
	</div>
</template>

<style scoped lang="scss">
.fatal {
	display: block;
	border-radius: 0.25em;
	background: #aa333355;
	line-height: 1.35;
	color: #a33;

	overflow: hidden;
	font-size: 1.15em;
	margin: 1.25em;
	padding: 1.5em;

	&__title {
		font-size: 1.25em;
	}

	&__icon {
		margin-right: 0.75em;
	}

	&__stack {
		opacity: 0.35;
		overflow-wrap: break-word;
		white-space: pre-wrap;
		margin-top: 1em;
	}
}
</style>
