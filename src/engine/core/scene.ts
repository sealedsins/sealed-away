/**
 * Sealed Sins, 2023-2024.
 */
import zod from 'zod';
import { merge, camelCase } from 'lodash';
import { DeepPartial } from 'utility-types';
import { Script, ScriptError } from './script';
import { StackFrame, StackSlice } from './stack';

/**
 * Scene state.
 */
// prettier-ignore
export type SceneState = (
	zod.infer<typeof SceneStateSchema>
);

/**
 * Scene menu.
 */
// prettier-ignore
export type SceneMenu = Array<{
	id: string;
	label: string;
	path: StackFrame['path'];
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
	 * @param update - Partial state.
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
	 * @param menu - New menu state.
	 */
	public setMenu(menu: SceneMenu | null) {
		this.setVar(SceneGlobal.MENU, menu);
	}

	/**
	 * Executes the next scene script step.
	 * This method is meant to be used internally.
	 * @internal
	 */
	public override step() {
		if (!this.getVar(SceneGlobal.YIELD)) {
			super.step();
		}
	}

	/**
	 * Executes the next scene frame.
	 * Does nothing if an active menu is present.
	 */
	public next() {
		const menu = this.getMenu();
		if (menu) {
			return;
		}
		this.setVar(SceneGlobal.YIELD, false);
		this.setState({ name: '', text: '' });
		while (!this.getVar(SceneGlobal.YIELD) && !this.isDone()) {
			this.step();
		}
	}

	/**
	 * Executes menu pick.
	 * Does nothing if no active menu is present.
	 * @param id - Menu item ID to pick.
	 */
	public pick(id: string) {
		const menu = this.getMenu();
		if (!menu) {
			return;
		}
		const item = menu.find((item) => item.id === id);
		if (!item) {
			throw new ScriptError(`Unknown menu ID: ${id}`);
		}
		this.setMenu(null);
		this.stack.push(item.path, item.code);
		this.next();
	}

	/**
	 * Evaluates `value` as a command and executes it.
	 * This also includes scene commands.
	 * @param value - Command to execute.
	 * @param slice - Optional stack slice (used to debug some commands).
	 * @internal
	 */
	protected override exec(value: unknown, slice?: StackSlice) {
		const { type, args } = this.unpack(value);
		switch (type) {
			case 'page': {
				const argSchema = SceneStateSchema.strict().deepPartial();
				const data = argSchema.parse(this.eval(args));
				const next = this.stack.peek()?.value;
				this.setVar(SceneGlobal.YIELD, !next || this.unpack(next).type !== 'menu');
				this.setState(data);
				break;
			}
			case 'menu': {
				const argSchema = zod.record(zod.string(), zod.array(zod.unknown()));
				const data = argSchema.parse(args);
				const path = slice ? [...slice.frame.path, slice.index] : [];
				const keys = Object.keys(data);
				this.setVar(SceneGlobal.YIELD, true);
				this.setMenu(
					keys.map((label) => ({
						id: camelCase(label),
						label,
						path: [...path, 'menu', label],
						code: data[label]!,
					})),
				);
				break;
			}
			case 'play': {
				const argSchema = zod.object({
					path: zod.string(),
					volume: zod.number().optional(),
				});
				const data = argSchema.parse(this.eval(args));
				this.emit({ type: 'play', data });
				break;
			}
			default: {
				super.exec(value);
				break;
			}
		}
	}
}
