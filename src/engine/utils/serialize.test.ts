/**
 * Sealed Sins, 2023-2024.
 */
import { describe, it, expect } from 'vitest';
import { Serializer, Serialize, SerializableEntity, Serializable } from './serialize';

describe('JsonSerializer', () => {
	class TestA implements SerializableEntity {
		constructor(public value: number) {
			return;
		}
		fromJSON(json: Serialize<this>) {
			return new TestA(json.value);
		}
		toJSON() {
			return { value: this.value };
		}
	}

	class TestB implements SerializableEntity {
		constructor(public value: number) {
			return;
		}
		fromJSON(json: Serialize<this>) {
			return new TestB(json.value);
		}
		toJSON() {
			return { value: this.value };
		}
	}

	class TestC implements SerializableEntity {
		constructor(
			public a: TestA,
			public b: TestB,
		) {
			return;
		}
		fromJSON(json: Serialize<this>) {
			return new TestC(new TestA(json.a), new TestB(json.b));
		}
		toJSON() {
			return { a: this.a.value, b: this.b.value };
		}
	}

	it('serializes primitives', () => {
		const serializer = new Serializer();
		expect(serializer.parse(serializer.stringify(100))).toEqual(100);
		expect(serializer.parse(serializer.stringify('150'))).toEqual('150');
		expect(serializer.parse(serializer.stringify(null))).toEqual(null);
		expect(serializer.parse(serializer.stringify(true))).toEqual(true);
	});

	it('serializes objects and arrays', () => {
		const data: Serializable = {
			a: 100,
			b: '150',
			c: null,
			d: true,
			e: [100, 150],
			f: { a: 100, b: 150 },
		};
		const serializer = new Serializer();
		const parsed = serializer.parse(serializer.stringify(data));
		expect(parsed).toHaveProperty('a', 100);
		expect(parsed).toHaveProperty('b', '150');
		expect(parsed).toHaveProperty('c', null);
		expect(parsed).toHaveProperty('d', true);
		expect(parsed).toHaveProperty('e', [100, 150]);
		expect(parsed).toHaveProperty('f', { a: 100, b: 150 });
	});

	it('serializes plain classes', () => {
		const data: Serializable = {
			a: new TestA(100),
			b: new TestB(150),
		};
		const serializer = new Serializer({ TestA, TestB });
		const parsed = serializer.parse(serializer.stringify(data)) as typeof data;
		expect(parsed.a).toBeInstanceOf(TestA);
		expect(parsed.a).toHaveProperty('value', 100);
		expect(parsed.b).toBeInstanceOf(TestB);
		expect(parsed.b).toHaveProperty('value', 150);
	});

	it('serializes nested classes', () => {
		const data = new TestC(new TestA(100), new TestB(150));
		const serializer = new Serializer({ TestA, TestB, TestC });
		const parsed = serializer.parse(serializer.stringify(data)) as typeof data;
		expect(parsed.a).toBeInstanceOf(TestA);
		expect(parsed.a).toHaveProperty('value', 100);
		expect(parsed.b).toBeInstanceOf(TestB);
		expect(parsed.b).toHaveProperty('value', 150);
	});

	it('fails to serialize an unknown class', () => {
		// @ts-ignore
		const data: Serializable = {
			date: new Date(),
		};
		const serializer = new Serializer();
		expect(() => serializer.stringify(data)).toThrowError(
			expect.objectContaining({
				name: 'ReferenceError',
				message: 'Unknown serializable entity: Date',
			}),
		);
	});
});
