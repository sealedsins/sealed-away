/**
 * Sealed Sins, 2023-2024.
 */
import zod from 'zod';
import { ref, shallowRef, computed } from 'vue';
import { defineStore, acceptHMRUpdate } from 'pinia';
import { Parser, ParserContext } from '../core';
import { useAssets } from './asset';

/**
 * Game config schema.
 */
// prettier-ignore
export const ConfigSchema = zod.object({
	meta: zod.object({
		title: zod.string(),
		icon: zod.string(),
	}),
	title: zod.object({
		buttons: zod.array(
			zod.object({
				label: zod.string(),
				link: zod.string(),
			}),
		),
		images: zod.array(
			zod.object({
				src: zod.string(),
				style: zod.record(
					zod.string(), 
					zod.union([zod.string(), zod.number()])
				),
				media: zod.object({
					desktop: zod.boolean(),
					tablet: zod.boolean(),
					mobile: zod.boolean(),
				}),
			}),
		),
	}),
}).deepPartial();

/**
 * Parser store schema.
 */
export const ParserSchema = zod.object({
	config: ConfigSchema.optional(),
	script: zod.array(zod.unknown()),
});

/**
 * Parser store.
 * Contains YAML fetching and parsing logic.
 */
export const useParser = defineStore('parser', () => {
	const asset = useAssets();
	const customTags = [{ tag: '!inc', resolve: asset.resolve }];

	/**
	 * Parser.
	 */
	const parser = shallowRef(new Parser(customTags));

	/**
	 * Parser context.
	 */
	const context = shallowRef<ParserContext>();

	/**
	 * Parser context source.
	 */
	const source = ref<string>();

	/**
	 * Parser context data.
	 */
	const data = computed(() => {
		return context.value?.parse(ParserSchema);
	});

	/**
	 * Parses given `data` and stores the result inside the parser context.
	 * @param data - Data to parse.
	 */
	const parse = (data: string) => {
		context.value = parser.value.parse(data);
		context.value.parse(ParserSchema);
	};

	/**
	 * Fetches the given `src`, parses it, and stores the result within the store context.
	 * @param src - Path to load and parse.
	 */
	const fetch = async (src: string) => {
		const blob = await asset.load(src);
		const data = await asset.readAsText(blob);
		source.value = src;
		parse(data);
	};

	/**
	 * Fetches the last known source, parses it, and stores the result within the store context.
	 * Does nothing if the store was not fetched before.
	 */
	const fetchLast = async () => {
		if (source.value) {
			await fetch(source.value);
		}
	};

	/**
	 * Resets parser state.
	 */
	const $reset = () => {
		context.value = undefined;
	};

	return {
		parser,
		context,
		source,
		data,
		parse,
		fetch,
		fetchLast,
		$reset,
	};
});

/**
 * Parser store HMR.
 */
if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useParser, import.meta.hot));
}
