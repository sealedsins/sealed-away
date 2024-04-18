/**
 * Sealed Sins, 2023-2024.
 */
import { isEqual, Comparator } from 'lodash';
import * as diff from 'diff';

/**
 * Array difference change.
 */
export type DiffChange<T> =
	| {
			value: T;
			indexSource: number;
			indexUpdate: number;
			added: false;
			removed: false;
	  }
	| {
			value: T;
			indexSource: null;
			indexUpdate: number;
			added: true;
			removed: false;
	  }
	| {
			value: T;
			indexSource: number;
			indexUpdate: null;
			added: false;
			removed: true;
	  };

/**
 * Array difference.
 */
export type DiffArray<T> = Array<DiffChange<T>>;

/**
 * Returns shallow difference between two arrays.
 * @param source - Source array.
 * @param update - Updated array.
 * @returns Array difference.
 */
export const diffArray = <T>(
	source: Array<T>,
	update: Array<T>,
	comparator: Comparator<T> = isEqual,
) => {
	let changes: DiffArray<T> = [];
	let indexSource = 0;
	let indexUpdate = 0;
	for (const change of diff.diffArrays(source, update, { comparator })) {
		for (const value of change.value) {
			if (change.removed) {
				changes.push({
					value,
					indexSource: indexSource++,
					indexUpdate: null,
					removed: true,
					added: false,
				});
			} else if (change.added) {
				changes.push({
					value,
					indexSource: null,
					indexUpdate: indexUpdate++,
					added: true,
					removed: false,
				});
			} else {
				changes.push({
					value,
					indexSource: indexSource++,
					indexUpdate: indexUpdate++,
					added: false,
					removed: false,
				});
			}
		}
	}
	return changes;
};
