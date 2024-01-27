/**
 * Sealed Sins, 2023-2024.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { loadCompressed, saveCompressed } from './storage';

describe('Storage', () => {
	afterEach(() => {
		localStorage.clear();
	});

	it('compresses data', () => {
		const data = 'Hello World!';
		saveCompressed('test', data);
		expect(localStorage.getItem('test')).not.toMatch(data);
		expect(loadCompressed('test')).toEqual(data);
	});

	it('handles empty data properly', () => {
		const data = loadCompressed('test');
		expect(data).toBeNull();
	});
});
