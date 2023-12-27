/**
 * Sealed Sins, 2023.
 */
import zod from 'zod';
import { defineStore } from 'pinia';
import { shallowRef, computed } from 'vue';
import { Parser, ParserContext } from '../core';
import * as asset from '../utils/asset';

/**
 * Game config schema.
 */
// prettier-ignore
export const ConfigSchema = zod.object({
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
}).deepPartial().strict();

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
	 * Parser context data.
	 */
	const data = computed(() => {
		return context.value?.parse(ParserSchema);
	});

	/**
	 * Parses given `data` and stores the result inside the parser context.
	 */
	const parse = (data: string) => {
		context.value = parser.value.parse(data);
		context.value.parse(ParserSchema);
	};

	/**
	 * Fetches given `src`, then parses it and stores the result inside the parser context.
	 */
	const fetch = async (url: string) => {
		const blob = await asset.load(url);
		const data = await asset.readAsText(blob);
		parse(data);
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
		data,
		parse,
		fetch,
		$reset,
	};
});
