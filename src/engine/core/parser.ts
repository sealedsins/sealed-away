/**
 * Sealed Sins, 2023-2024.
 */
import zod, { ZodType } from 'zod';
import { fromZodIssue } from 'zod-validation-error';
import { parseDocument, isNode, Tags, LineCounter, Document } from 'yaml';
import { Script } from './script';

/**
 * Parser error.
 */
export class ParserError extends Error {
	public override name = 'ParserError';

	// prettier-ignore
	constructor(message: string, public pos?: { line: number, col: number }) {
		super(message);
	}
}

/**
 * Parser context.
 * Contains data necessary to parse and validate given document.
 */
export class ParserContext {
	// prettier-ignore
	constructor(private doc: Document, private lineCounter: LineCounter) {
		return;
	}

	/**
	 * Converts node path into its location in source code.
	 * @param path - Path to trace.
	 * @returns Code line and column.
	 */
	public trace(path: Array<string | number>) {
		const node = this.doc.getIn(path, true);
		if (isNode(node) && node.range) {
			return this.lineCounter.linePos(node.range[0]);
		} else {
			return undefined;
		}
	}

	/**
	 * Validates context using given schema and returns its data.
	 * @param schema - Target schema.
	 * @returns Parsed data.
	 */
	public parse<T extends ZodType>(schema: T) {
		if (this.doc.errors.length) {
			const err = this.doc.errors[0]!;
			const pos = this.lineCounter.linePos(err.pos[0]);
			const msg = (err.message.split('at line')[0] || err.message).trim();
			throw new ParserError(msg, pos);
		}
		const validation = schema.safeParse(this.doc.toJS());
		if (!validation.success) {
			const iss = validation.error.issues[0]!;
			const pos = this.trace(iss.path);
			const msg = fromZodIssue(iss, { prefix: null }).message;
			throw new ParserError(msg, pos);
		} else {
			return validation.data as zod.infer<T>;
		}
	}
}

/**
 * Parser (YAML).
 */
export class Parser {
	private customTags: Tags;

	/**
	 * Parse constructor.
	 * @param customTags - Custom tags for YAML parser.
	 */
	constructor(customTags: Tags = []) {
		this.customTags = [
			...customTags,
			{ tag: '!exp', resolve: Script.exp.bind(Script) },
			{ tag: '!fmt', resolve: Script.fmt.bind(Script) },
		];
	}

	/**
	 * Parses given `source`, transforming it into `ParserContext`.
	 * @param source - Source to parse.
	 * @retruns Parsed context.
	 */
	public parse(source: string) {
		const lineCounter = new LineCounter();
		const doc = parseDocument(source, { lineCounter, customTags: this.customTags });
		return new ParserContext(doc, lineCounter);
	}
}
