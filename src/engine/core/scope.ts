/**
 * Sealed Sins, 2023-2024.
 */
import { clear } from '../utils/object';

/**
 * Variable scope.
 */
export class Scope<T = unknown> {
	constructor(private vars: Record<string, T> = {}) {
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
	 * Clears scope variables.
	 */
	public clear() {
		clear(this.vars);
	}

	/**
	 * Gets scope variable.
	 * @param name - Variable name.
	 * @returns Variable value.
	 */
	public get<E extends T>(name: string) {
		return this.vars[name] as E;
	}

	/**
	 * Sets scope variable.
	 * @param name - Variable name.
	 * @param value - Variable value.
	 */
	public set<E extends T>(name: string, value: E) {
		this.vars[name] = value;
	}

	/**
	 * Renders `template` as a JS expression and returns its value.
	 * @param template - Expression to render.
	 * @returns Rendered expression.
	 */
	public renderExpression<T = unknown>(template: string) {
		const kwargs = { ...this.vars, vars: this.vars };
		const render = new Function(...Object.keys(kwargs), `return (${template})`);
		const result = render.call(this.vars, ...Object.values(kwargs));
		return result as T;
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
}
