/**
 * Sealed Sins, 2023-2024.
 */
import { describe, it, expect } from 'vitest';
import { Scope } from './scope';

describe('Scope', () => {
	it('implements expression rendering', () => {
		const scope = new Scope({
			a: 100,
			b: 150,
			c: [100, 150],
			d: { a: 100, b: 150 },
		});
		expect(scope.renderExpression('a')).toBe(100);
		expect(scope.renderExpression('b')).toBe(150);
		expect(scope.renderExpression('c')).toStrictEqual([100, 150]);
		expect(scope.renderExpression('d')).toStrictEqual({ a: 100, b: 150 });
		expect(scope.renderExpression('d.a')).toEqual(100);
		expect(scope.renderExpression('d.b')).toEqual(150);
	});

	it('implements template rendering', () => {
		const scope = new Scope({
			a: 100,
			b: 150,
			c: [100, 150],
			d: { a: 100, b: 150 },
		});
		expect(scope.renderTemplate('{{ a }} {{ b }}')).toBe('100 150');
		expect(scope.renderTemplate('{{ c[0] }} {{ c[1] }}')).toBe('100 150');
		expect(scope.renderTemplate('{{ d.a }} {{ d.b }}')).toBe('100 150');
	});

	it('fails to render an invalid expression', () => {
		const scope = new Scope();
		expect(() => scope.renderExpression('nonExisting')).toThrow(ReferenceError);
		expect(() => scope.renderExpression('return')).toThrow(SyntaxError);
	});

	it('fails to render an invalid template', () => {
		const scope = new Scope();
		expect(() => scope.renderTemplate('{{ nonExisting }}')).toThrow(ReferenceError);
		expect(() => scope.renderExpression('{{ return }}')).toThrow(SyntaxError);
	});
});
