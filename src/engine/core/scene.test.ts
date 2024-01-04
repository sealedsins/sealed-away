/**
 * Sealed Sins, 2023.
 */
import { Scene } from './scene';

describe('Scene', () => {
	it('implements `page` command', () => {
		const scene = new Scene([
			{
				set: {
					name: 'hello',
					value: 'Hello',
				},
			},
			{
				page: {
					name: 'Narrator',
					text: Scene.fmt('{{ hello }}!'),
					background: {
						image: 'hello',
					},
				},
			},
			{
				set: {
					name: 'world',
					value: 'World',
				},
			},
			{
				page: {
					name: 'Narrator',
					text: Scene.fmt('{{ world }}!'),
					background: {
						image: 'world',
					},
				},
			},
			{
				page: {
					unknownProperty: 'test',
				},
			},
		]);

		scene.next({ type: 'next' });
		expect(scene.getState()).toMatchObject({
			name: 'Narrator',
			text: 'Hello!',
			background: {
				image: 'hello',
			},
		});

		scene.next({ type: 'next' });
		expect(scene.getState()).toMatchObject({
			name: 'Narrator',
			text: 'World!',
			background: {
				image: 'world',
			},
		});

		expect(() => scene.next({ type: 'next' })).toThrowError(
			expect.objectContaining({
				name: 'ScriptError',
				message: "Arguments: Unrecognized key(s) in object: 'unknownProperty'",
				path: [4],
			}),
		);
	});

	it('implements `menu` command', () => {
		const scene = new Scene([
			{ label: 'start' },
			{
				page: {
					text: 'Pick One!',
				},
			},
			{
				menu: {
					'Label A': [{ set: { name: 'choice', value: 'A' } }],
					'Label B': [{ set: { name: 'choice', value: 'B' } }],
				},
			},
			{
				page: {
					text: Scene.fmt('Nice choice! You have picked {{ choice }}.'),
				},
			},
			{ jump: 'start' },
		]);

		scene.next({ type: 'next' });
		expect(scene.getState()).toMatchObject({ text: 'Pick One!' });
		expect(scene.getMenu()).toMatchObject([
			{ id: 'labelA', label: 'Label A' },
			{ id: 'labelB', label: 'Label B' },
		]);

		scene.next({ type: 'next' });
		expect(scene.getVar('choice')).toBeUndefined();
		expect(scene.getMenu()).toBeTruthy();

		scene.next({ type: 'menu', id: 'labelA' });
		expect(scene.getVar('choice')).toBe('A');
		expect(scene.getMenu()).toBeNull();
		expect(scene.getState()).toMatchObject({
			text: 'Nice choice! You have picked A.',
		});

		scene.next({ type: 'next' });
		expect(scene.getState()).toMatchObject({ text: 'Pick One!' });
		expect(scene.getMenu()).toBeTruthy();

		scene.next({ type: 'menu', id: 'labelB' });
		expect(scene.getVar('choice')).toBe('B');
		expect(scene.getMenu()).toBeNull();
		expect(scene.getState()).toMatchObject({
			text: 'Nice choice! You have picked B.',
		});
	});

	it('implements `play` command', () => {
		// prettier-ignore
		const scene = new Scene([
			{ label: 'start' }, 
			{ play: { path: 'test' }, 
		}]);

		const playMock = jest.fn();
		window.HTMLMediaElement.prototype.play = playMock;

		scene.next({ type: 'next' });
		scene.next({ type: 'next' });

		expect(scene.isDone()).toBe(true);
		expect(playMock).toBeCalled();
		playMock.mockRestore();
	});
});
