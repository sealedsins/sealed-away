/**
 * Sealed Sins, 2023-2024.
 */
import { describe, it, expect } from 'vitest';
import * as object from './object';

describe('Object', () => {
	it('implements `clear` method', () => {
		const obj = { a: 100, b: 150 };
		object.clear(obj);
		expect(obj).toEqual({});
	});

	it('implements `alter` method', () => {
		const obj = { a: 100, b: 150 };
		object.alter<any>(obj, { c: null });
		expect(obj).toEqual({ c: null });
	});
});
