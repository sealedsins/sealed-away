/**
 * Sealed Sins, 2023-2024.
 */
import { describe, it, expect } from 'vitest';
import { diffArray, DiffArray } from './diff';

describe('Diff', () => {
	it('finds difference between arrays', () => {
		const source = ['a', 'b', 'c'];
		const update = ['a', 'b1', 'b2', 'b3', 'c', 'd'];
		expect(diffArray(source, update)).toStrictEqual<DiffArray<string>>([
			{
				value: 'a',
				indexSource: 0,
				indexUpdate: 0,
				added: false,
				removed: false,
			},
			{
				value: 'b',
				indexSource: 1,
				indexUpdate: null,
				added: false,
				removed: true,
			},
			{
				value: 'b1',
				indexSource: null,
				indexUpdate: 1,
				added: true,
				removed: false,
			},
			{
				value: 'b2',
				indexSource: null,
				indexUpdate: 2,
				added: true,
				removed: false,
			},
			{
				value: 'b3',
				indexSource: null,
				indexUpdate: 3,
				added: true,
				removed: false,
			},
			{
				value: 'c',
				indexSource: 2,
				indexUpdate: 4,
				added: false,
				removed: false,
			},
			{
				value: 'd',
				indexSource: null,
				indexUpdate: 5,
				added: true,
				removed: false,
			},
		]);
	});
});
