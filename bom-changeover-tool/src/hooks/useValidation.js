/**
 * useValidation.js
 *
 * Manages per-part check / flag / note state for the Build Validation tab.
 * Also manages "missing parts" — parts added by the assembler that aren't
 * on the BOM.
 *
 * Key format:  "<sectionName>__<partIndex>"
 */

import { useCallback } from 'react';

export function partKey(sectionName, partIndex) {
  return `${sectionName}__${partIndex}`;
}

/**
 * Compute summary stats from current check/flag/missingParts state.
 *
 * @param {object[]} sections     - from parseBOMSections()
 * @param {object}   checks       - { [key]: boolean }
 * @param {object}   flags        - { [key]: 'not_needed' | null }
 * @param {object}   missingParts - { [sectionName]: MissingPart[] }
 * @returns { total, checked, flagged, totalMissing, perSection }
 */
export function getValidationStats(sections, checks, flags, missingParts) {
  let total = 0, checked = 0, flagged = 0, totalMissing = 0;
  const perSection = {};

  sections.forEach(sec => {
    let sTotal = 0, sChecked = 0, sFlagged = 0;
    sec.parts.forEach((_, i) => {
      const key = partKey(sec.sectionName, i);
      sTotal++;
      if (checks[key])                    { sChecked++;  checked++; }
      if (flags[key] === 'not_needed')    { sFlagged++;  flagged++; }
    });
    total += sTotal;
    const sMissing = (missingParts[sec.sectionName] || []).length;
    totalMissing += sMissing;
    perSection[sec.sectionName] = {
      total:        sTotal,
      checked:      sChecked,
      flagged:      sFlagged,
      missingCount: sMissing,
    };
  });

  return { total, checked, flagged, totalMissing, perSection };
}
