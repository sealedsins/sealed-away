/**
 * Sealed Sins, 2023-2024.
 */
import { isEqual } from 'lodash';
import { diffArrays } from 'diff';

/**
 * Difference array.
 */
export type Diff = Array<{
	indexSource: number | null;
	indexUpdate: number;
	value: unknown;
}>;

/**
 * Returns difference between two arrays.
 * @param source - Source array.
 * @param update - Updated array.
 * @returns Difference list.
 */
export const diff = (source: Array<unknown>, update: Array<unknown>) => {
	let changes = [] as Diff;
	let indexSource = 0;
	let indexUpdate = 0;
	for (const change of diffArrays(source, update, { comparator: isEqual })) {
		for (const value of change.value) {
			if (change.removed) {
				indexSource++;
			} else if (change.added) {
				changes.push({
					indexSource: null,
					indexUpdate: indexUpdate++,
					value,
				});
			} else {
				changes.push({
					indexSource: indexSource++,
					indexUpdate: indexUpdate++,
					value,
				});
			}
		}
	}
	return changes;
};
