/**
 * Sealed Sins, 2023-2024.
 */
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
		expect(scope.renderExpression('d.a')).toStrictEqual(100);
		expect(scope.renderExpression('d.b')).toStrictEqual(150);
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
});
