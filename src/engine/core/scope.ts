/**
 * Sealed Sins, 2023-2024.
 */
import { pick } from 'lodash';

/**
 * Variable scope.
 */
export class Scope {
	constructor(private vars: Record<string, unknown> = {}) {
		return;
	}

	/**
	 * Dumps scope variables.
	 * @returns Scope variables.
	 */
	public dump() {
		return this.vars;
	}

	/**
	 * Gets scope variable.
	 * @param name - Variable name.
	 * @returns Variable value.
	 */
	public get<T = unknown>(name: string) {
		return this.vars[name] as T;
	}

	/**
	 * Sets scope variable.
	 * @param name - Variable name.
	 * @param value - Variable value.
	 */
	public set<T = unknown>(name: string, value: T) {
		this.vars[name] = value;
	}

	/**
	 * Renders `template` as a JS expression and returns its value.
	 * @param template - Expression to render.
	 * @returns Rendered expression.
	 */
	public renderExpression(template: string) {
		const render = new Function(...Object.keys(this.vars), `return (${template})`);
		const result = render.call(this.vars, ...Object.values(this.vars));
		return result as unknown;
	}

	/**
	 * Renders `template` as a string template and returns its value.
	 * @param template - Template to render.
	 * @returns Rendered string.
	 */
	public renderTemplate(template: string) {
		let output = template;
		for (const [match, exp] of template.matchAll(/{{(.+?)}}/gm)) {
			const value = this.renderExpression(exp!);
			output = output.replace(match, `${value}`);
		}
		return output;
	}

	/**
	 * Stringifies scope state and returns it.
	 * @returns Scope state (JSON).
	 */
	public save() {
		const state = pick(this, ['vars']);
		return JSON.stringify(state);
	}

	/**
	 * Parses given scope state and restores it.
	 * @param state - State to load (JSON).
	 * @returns Scope.
	 */
	public load(state: string) {
		const data = JSON.parse(state);
		Object.assign(this, data);
		return this;
	}
}
