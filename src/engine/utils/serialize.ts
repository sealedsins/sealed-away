/**
 * Sealed Sins, 2023-2024.
 */
import traverse from 'traverse';
import { find, findKey, isArray, isObject, isPlainObject } from 'lodash';
import { Class } from 'type-fest';

/**
 * JSON primitive.
 */
// prettier-ignore
export type JsonPrimitive = (
	string | number | boolean | null
);

/**
 * JSON array.
 */
// prettier-ignore
export type JsonArray = (
	Array<Json>
);

/**
 * JSON object.
 */
// prettier-ignore
export type JsonObject = (
	{ [key: string]: Json }
);

/**
 * JSON value.
 */
// prettier-ignore
export type Json = (
	JsonPrimitive | JsonArray | JsonObject
);

/**
 * Serializable object.
 */
// prettier-ignore
export type SerializableObject = (
	{ [key: string]: Serializable }
);

/**
 * JSON-compatible array.
 */
// prettier-ignore
export type SerializableArray = (
	Array<Serializable>
);

/**
 * JSON-compatible value.
 */
// prettier-ignore
export type Serializable = (
	JsonPrimitive | SerializableArray | SerializableObject | SerializableEntity
);

/**
 * JSON-compatible representation of a given value.
 * @typeParam T - Type to convert.
 */
// prettier-ignore
export type Serialize<T extends Serializable> = (
	T extends { toJSON: SerializableEntity['toJSON']  }
		? Serialize<ReturnType<T['toJSON']>> 
		: T extends SerializableArray
			? { [K: number]: Serialize<T[typeof K]> }
			: T extends SerializableObject
				? { [K in keyof T]: Serialize<T[K]> }
				: T
);

/**
 * JSON-compatible serializable entity.
 */
export interface SerializableEntity {
	/**
	 * Revives entity from a JSON format.
	 * @param json - JSON to revive.
	 * @returns Serializable value.
	 */
	fromJSON(this: void, json: Serialize<this>): Serializable;

	/**
	 * Converts entity to a JSON format.
	 * @returns JSON representation of entity.
	 */
	toJSON(): SerializableObject;
}

/**
 * JSON serializer.
 */
export class Serializer {
	private readonly classProperty = '__class';
	constructor(private classes: Record<string, Class<Serializable>> = {}) {
		return;
	}

	/**
	 * Converts the given `value` to a plain JSON.
	 * @remarks Throws an error for class instances that aren't known to the serializer.
	 * @param value - Value to stringify.
	 * @param space - Optional indentation.
	 * @returns JSON string.
	 */
	public stringify<T extends Serializable>(value: T, space?: number): string {
		const json = traverse(value).map((value: Serializable) => {
			if (!isObject(value) || isArray(value) || isPlainObject(value)) {
				return value;
			}
			const className = findKey(this.classes, (classPrototype) => {
				return value instanceof classPrototype;
			});
			if (!className) {
				const text = `Unknown serializable entity: ${value.constructor.name ?? value}`;
				throw new ReferenceError(text);
			}
			const entityJson = (value as SerializableEntity).toJSON();
			return { [this.classProperty]: className, ...entityJson };
		});
		return JSON.stringify(json, undefined, space);
	}

	/**
	 * Parses the given `value`, converting it into its original state.
	 * @remarks Throws an error for class instances that aren't known to the serializer.
	 * @param value - Value to parse.
	 * @returns Parsed value.
	 */
	public parse<T extends Serializable>(value: string): T {
		return traverse(JSON.parse(value)).map((value) => {
			if (!isPlainObject(value) || !value.hasOwnProperty(this.classProperty)) {
				return value;
			}
			const matchingClass = find(this.classes, (_, className) => {
				return value[this.classProperty] === className;
			});
			if (!matchingClass) {
				const text = `Unknown serializable entity: ${value.constructor.name ?? value}`;
				throw new ReferenceError(text);
			}
			const entityPrototype = matchingClass.prototype as object;
			const entity = Object.create(entityPrototype) as SerializableEntity;
			return entity.fromJSON.call(undefined, value);
		});
	}
}
