/**
 * Sealed Sins, 2023-2024.
 */
import zod from 'zod';
import { PartialDeep } from 'type-fest';
import { mergeWith, uniqBy, camelCase } from 'lodash';
import { Script, ScriptNode, ScriptError, ScriptPath, ScriptSource } from './script';

/**
 * Scene State.
 */
// prettier-ignore
export type SceneState = (
	zod.infer<typeof SceneStateSchema>
);

/**
 * Scene Sprite.
 */
// prettier-ignore
export type SceneSprite = (
	zod.infer<typeof SceneSpriteSchema>
);

/**
 * Scene Menu.
 */
// prettier-ignore
export type SceneMenu = Array<{
	id: string;
	label: string;
	path: ScriptPath;
}>;

/**
 * Scene Global Variables.
 * @internal
 */
// prettier-ignore
export const enum SceneGlobal {
	STATE = 'state',
	EVENT = 'event',
	YIELD = 'yield',
	MENU  = 'menu',
}

/**
 * Scene Background Schema.
 */
export const SceneBackgroundSchema = zod
	.object({
		image: zod.string().nullable(),
		position: zod.string(),
		color: zod.string(),
	})
	.strict();

/**
 * Scene Sprite Schema.
 */
export const SceneSpriteSchema = zod
	.object({
		id: zod.string(),
		image: zod.string(),
		position: zod.string().optional(),
		style: zod.record(zod.string()).optional(),
	})
	.strict();

/**
 * Scene Sound Schema.
 */
export const SceneSoundSchema = zod
	.object({
		path: zod.string(),
		volume: zod.number().optional(),
		rate: zod.number().optional(),
		loop: zod.boolean().optional(),
	})
	.strict();

/**
 * Scene State Schema.
 */
export const SceneStateSchema = zod
	.object({
		name: zod.string(),
		text: zod.string(),
		background: SceneBackgroundSchema,
		sprites: zod.array(SceneSpriteSchema),
		loop: SceneSoundSchema.or(zod.null()),
	})
	.strict();

/**
 * Scene Interpreter.
 */
export class Scene extends Script {
	private initialState: SceneState = {
		name: '',
		text: '',
		sprites: [],
		loop: null,
		background: {
			image: null,
			position: 'center',
			color: '#333',
		},
	};

	constructor(source: ScriptSource) {
		super(source);
		this.setState(this.initialState);
		this.setVar(SceneGlobal.YIELD, true);
		this.setVar(SceneGlobal.EVENT, null);
		this.setVar(SceneGlobal.MENU, null);
	}

	/**
	 * Gets scene state.
	 * @returns Scene state.
	 */
	public getState() {
		const state = this.getVar<SceneState>(SceneGlobal.STATE);
		return state;
	}

	/**
	 * Sets scene state (partial).
	 * @param update - Partial state.
	 */
	// prettier-ignore
	public setState(update: PartialDeep<SceneState>) {
		const state = this.getVar<SceneState>(SceneGlobal.STATE);
		const valid = SceneStateSchema.deepPartial().parse(update);
		this.setVar(SceneGlobal.STATE, mergeWith(state, valid, (curr, next) => {
			if (Array.isArray(next) || Array.isArray(curr)) {
				return next;
			}
		}));
	}

	/**
	 * Gets scene menu.
	 * @returns Menu state.
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
		this.stack.push(this.node(item.path) as ScriptSource);
		this.next();
	}

	/**
	 * Evaluates `node` as a command and executes it.
	 * This also includes scene commands.
	 * @param value - Command to execute.
	 * @param slice - Optional stack slice (used to debug some commands).
	 * @internal
	 */
	protected override exec(node: ScriptNode) {
		const { type, args } = this.unpack(node);
		switch (type) {
			case 'page': {
				const argSchema = SceneStateSchema.strict().deepPartial();
				const data = this.validate(argSchema, this.eval(args));
				const next = this.stack.peek()?.value;
				this.setVar(SceneGlobal.YIELD, !next || this.unpack(next).type !== 'menu');
				this.setState(data as SceneState);
				break;
			}
			case 'menu': {
				const argSchema = zod.record(zod.string(), zod.array(zod.any()));
				const data = this.validate(argSchema, args);
				this.setVar(SceneGlobal.YIELD, true);
				this.setMenu(
					Object.entries(data).map(([label, code]) => ({
						id: camelCase(label),
						label,
						path: this.path(code)!,
					})),
				);
				break;
			}
			case 'play': {
				const argSchema = SceneSoundSchema;
				const data = this.validate(argSchema, this.eval(args));
				this.emit('play', data);
				if (data.loop) {
					this.setState({ loop: data });
				}
				break;
			}
			case 'stop': {
				const argSchema = zod.object({
					fade: zod.boolean().optional(),
				});
				const data = this.validate(argSchema, this.eval(args));
				this.setState({ loop: null });
				this.emit('stop', data);
				break;
			}
			case 'wait': {
				const argSchema = zod.object({
					seconds: zod.number(),
				});
				const data = this.validate(argSchema, this.eval(args));
				this.emit('wait', data);
				this.setVar(SceneGlobal.YIELD, true);
				break;
			}
			case 'show': {
				const argSchema = SceneSpriteSchema;
				const data = this.validate(argSchema, this.eval(args));
				const sprites = uniqBy([data, ...this.getState().sprites], 'id');
				this.setState({ sprites });
				break;
			}
			case 'hide': {
				const argSchema = zod.object({
					id: zod.string(),
				});
				const data = this.validate(argSchema, this.eval(args));
				const sprites = this.getState().sprites.filter((sprite) => sprite.id !== data.id);
				this.setState({ sprites });
				break;
			}
			default: {
				super.exec(node);
				break;
			}
		}
	}
}
