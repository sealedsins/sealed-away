/**
 * Sealed Sins, 2023.
 */
import zod from 'zod';
import { merge, camelCase } from 'lodash';
import { DeepPartial } from 'utility-types';
import { Script, ScriptError } from './script';

/**
 * Scene state.
 */
// prettier-ignore
export type SceneState = (
	zod.infer<typeof SceneStateSchema>
);

/**
 * Scene event.
 */
// prettier-ignore
export type SceneEvent = (
	| { type: 'next' } 
	| { type: 'menu'; id: string }
);

/**
 * Scene menu.
 */
// prettier-ignore
export type SceneMenu = Array<{
	id: string;
	label: string;
	code: Array<unknown>;
}>;

/**
 * Scene global variable names.
 */
// prettier-ignore
export const enum SceneGlobal {
	STATE = 'state',
	EVENT = 'event',
	YIELD = 'yield',
	MENU  = 'menu',
}

/**
 * Scene state schema.
 */
export const SceneStateSchema = zod.object({
	name: zod.string(),
	text: zod.string(),
	background: zod.object({
		image: zod.string().nullable(),
		position: zod.string(),
		color: zod.string(),
	}),
});

/**
 * Scene interpreter.
 */
export class Scene extends Script {
	private initialState: SceneState = {
		name: '',
		text: '',
		background: {
			image: null,
			position: 'center',
			color: '#333',
		},
	};

	constructor(source: Array<unknown>) {
		super(source);
		this.setState(this.initialState);
		this.setVar(SceneGlobal.YIELD, true);
		this.setVar(SceneGlobal.EVENT, null);
		this.setVar(SceneGlobal.MENU, null);
	}

	/**
	 * Gets scene state.
	 */
	public getState() {
		const state = this.getVar<SceneState>(SceneGlobal.STATE);
		return state;
	}

	/**
	 * Sets scene state (partial).
	 */
	public setState(update: DeepPartial<SceneState>) {
		const state = this.getVar<SceneState>(SceneGlobal.STATE);
		const valid = SceneStateSchema.deepPartial().parse(update);
		this.setVar('state', merge(state, valid));
	}

	/**
	 * Gets scene menu.
	 */
	public getMenu() {
		const menu = this.getVar<SceneMenu | null>(SceneGlobal.MENU);
		return menu;
	}

	/**
	 * Sets scene menu.
	 */
	public setMenu(menu: SceneMenu | null) {
		this.setVar(SceneGlobal.MENU, menu);
	}

	/**
	 * Processes given event and updates scene state accordingly.
	 */
	public next(event: SceneEvent) {
		const menu = this.getMenu();
		this.setVar(SceneGlobal.EVENT, event);
		this.setVar(SceneGlobal.YIELD, false);
		switch (event.type) {
			case 'next': {
				if (menu) {
					return;
				}
				this.setState({
					name: '',
					text: '',
				});
				while (!this.getVar(SceneGlobal.YIELD) && !this.isDone()) {
					this.step();
				}
				break;
			}
			case 'menu': {
				if (!menu) {
					return;
				}
				const item = menu.find((item) => item.id === event.id);
				if (!item) {
					throw new ScriptError(`Unknown menu item: ${event.id}`);
				}
				this.setMenu(null);
				this.pushStack(...item.code);
				this.next({ type: 'next' });
				break;
			}
			default: {
				throw new ScriptError(`Unexpected event: ${JSON.stringify(event)}`);
				break;
			}
		}
	}

	/**
	 * Executes the next scene script step.
	 * @internal
	 */
	public override step() {
		if (!this.getVar(SceneGlobal.YIELD)) {
			super.step();
		}
	}

	/**
	 * Evaluates `value` as a command and executes it.
	 * This also includes scene commands.
	 */
	protected override exec(value: unknown) {
		const { type, args } = this.unpack(value);
		switch (type) {
			case 'page': {
				const argSchema = SceneStateSchema.strict().deepPartial();
				const data = argSchema.parse(this.eval(args));
				const next = this.peekStack();
				this.setVar(SceneGlobal.YIELD, !next || this.unpack(next).type !== 'menu');
				this.setState(data);
				break;
			}
			case 'menu': {
				const argSchema = zod.record(zod.string(), zod.array(zod.unknown()));
				const data = argSchema.parse(args);
				const keys = Object.keys(data);
				this.setVar(SceneGlobal.YIELD, true);
				this.setMenu(keys.map((x) => ({ id: camelCase(x), label: x, code: data[x]! })));
				break;
			}
			case 'play': {
				const argSchema = zod.object({
					path: zod.string(),
					volume: zod.number().optional(),
				});
				const sound = argSchema.parse(this.eval(args));
				const audio = new Audio(sound.path);
				audio.volume = sound.volume ?? 1.0;
				audio.play();
				break;
			}
			default: {
				super.exec(value);
				break;
			}
		}
	}
}
