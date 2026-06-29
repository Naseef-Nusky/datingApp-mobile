/**
 * Maps UI "lookingFor" / profile seeking preference to API GET /api/profiles ?gender=...
 *
 * Profile stores the gender of people you want to meet: male | female | both.
 * SearchFilterModal uses shorthand labels (man, woman, man-man, …).
 *
 * @returns {'male'|'female'|'other'|'all'|undefined}
 *   - concrete gender → filter to that
 *   - 'all' → show every gender (pass gender=all to API)
 *   - undefined → omit param; server may apply saved preference
 */
export function lookingForToBrowseGenderParam(lookingFor) {
  if (lookingFor == null || lookingFor === '') return undefined;
  const v = String(lookingFor).trim().toLowerCase();
  if (v === 'both' || v === 'all') return 'all';
  if (v === 'male' || v === 'female' || v === 'other') return v;
  // SearchFilterModal: "Man looking for a Woman" → show women
  if (v === 'man') return 'female';
  if (v === 'woman') return 'male';
  if (v === 'man-man') return 'male';
  if (v === 'woman-woman') return 'female';
  if (v === 'man-both' || v === 'woman-both') return 'all';
  return undefined;
}

/**
 * @param {URLSearchParams} params
 * @param {string} [lookingFor]
 */
export function appendBrowseGenderQuery(params, lookingFor) {
  const g = lookingForToBrowseGenderParam(lookingFor);
  if (g === 'all') {
    params.append('gender', 'all');
  } else if (g) {
    params.append('gender', g);
  }
}
