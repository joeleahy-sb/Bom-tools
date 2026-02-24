/**
 * bomDiff.js
 *
 * Computes the structured diff between two sets of normalised BOM rows
 * (produced by bomParser.js).
 *
 * ─── Input ───────────────────────────────────────────────────────────
 * Both arguments are arrays of normalised row objects:
 *   { itemNo, pn, rev, desc, qty, uom, subCategory, procurementType, fullPN }
 *
 * ─── Output ──────────────────────────────────────────────────────────
 * {
 *   added:      PartSummary[]   parts in new BOM but not old
 *   removed:    PartSummary[]   parts in old BOM but not new
 *   changed:    ChangedPart[]   same base P/N, different revision
 *   qtyChanged: PartSummary[]   same full P/N, different total qty
 *   moved:      PartSummary[]   same full P/N, parent sub-assy changed
 *   unchanged:  PartSummary[]   no differences
 * }
 *
 * ─── Matching strategy ───────────────────────────────────────────────
 * Parts are matched by their fullPN ("pn-rev").
 * Rev changes are detected by finding pairs with the same base P/N but
 * different revision suffixes.
 * "Moved" parts are detected when a part's parent sub-assembly has itself
 * undergone a revision change.
 */

/** Extract the base P/N by stripping a trailing -REV suffix. */
function baseOf(fullPN) {
  const m = fullPN.match(/^(.+)-([A-Z](?:\.\d+)?)$/);
  return m ? m[1] : fullPN;
}

/** Extract the revision suffix from a full P/N. */
function revOf(fullPN) {
  const m = fullPN.match(/-([A-Z](?:\.\d+)?)$/);
  return m ? m[1] : '';
}

/**
 * Build a map of fullPN → aggregated part summary from an array of
 * normalised rows, using a pre-built itemNo→fullPN map to resolve parents.
 */
function buildPartMap(rows, itemToPn) {
  const map = {};
  rows.forEach(r => {
    const f = r.fullPN;
    if (!f) return;

    const dotIdx     = r.itemNo.lastIndexOf('.');
    const parentItem = dotIdx > -1 ? r.itemNo.substring(0, dotIdx) : '';
    const parentPn   = itemToPn[parentItem] || 'TOP';

    if (!map[f]) {
      map[f] = {
        fullPN:          f,
        base:            baseOf(f),
        rev:             revOf(f),
        desc:            r.desc,
        subCategory:     r.subCategory,
        procurementType: r.procurementType,
        totalQty:        0,
        locs:            [],
      };
    }
    map[f].totalQty += r.qty;
    map[f].locs.push({ itemNo: r.itemNo, parentPn, qty: r.qty });
  });
  return map;
}

/** Build itemNo → fullPN lookup for parent-resolution. */
function buildItemMap(rows) {
  const m = {};
  rows.forEach(r => { if (r.fullPN && r.itemNo) m[r.itemNo] = r.fullPN; });
  return m;
}

// ── Public API ────────────────────────────────────────────────────────

export function diffBOMs(oldRows, newRows) {
  const oldItemToPn = buildItemMap(oldRows);
  const newItemToPn = buildItemMap(newRows);
  const oldMap      = buildPartMap(oldRows, oldItemToPn);
  const newMap      = buildPartMap(newRows, newItemToPn);

  // Which fullPNs appear as a sub-assembly parent (i.e. have children)?
  const oldHC = new Set();
  const newHC = new Set();
  Object.values(oldMap).forEach(p => p.locs.forEach(l => { if (l.parentPn !== 'TOP') oldHC.add(l.parentPn); }));
  Object.values(newMap).forEach(p => p.locs.forEach(l => { if (l.parentPn !== 'TOP') newHC.add(l.parentPn); }));

  // Top-level assembly bases (used to exclude true top-level assemblies from "moved")
  const topBases = new Set();
  oldRows.forEach(r => { if (r.itemNo && !r.itemNo.includes('.')) topBases.add(baseOf(r.fullPN)); });

  const exact      = new Set();
  const added      = [];
  const removed    = [];
  const changed    = [];
  const qtyChanged = [];
  const moved      = [];
  const unchanged  = [];

  // Parts present in both (exact fullPN match)
  for (const f of Object.keys(newMap)) {
    if (oldMap[f]) exact.add(f);
  }

  const onlyOld = Object.keys(oldMap).filter(f => !exact.has(f)).sort();
  const onlyNew = Object.keys(newMap).filter(f => !exact.has(f)).sort();

  // Pair up rev changes: same base P/N, different revision
  const matchedOld = new Set();
  const matchedNew = new Set();

  for (const of2 of onlyOld) {
    if (matchedOld.has(of2)) continue;
    const ob = baseOf(of2);
    for (const nf of onlyNew) {
      if (matchedNew.has(nf)) continue;
      if (ob === baseOf(nf)) {
        changed.push({
          oldFullPN:    of2,
          newFullPN:    nf,
          basePart:     ob,
          oldRev:       revOf(of2),
          newRev:       revOf(nf),
          oldDesc:      oldMap[of2].desc,
          newDesc:      newMap[nf].desc,
          oldTotalQty:  oldMap[of2].totalQty,
          newTotalQty:  newMap[nf].totalQty,
          oldSubCategory: oldMap[of2].subCategory,
          newSubCategory: newMap[nf].subCategory,
          oldLocs:      oldMap[of2].locs,
          newLocs:      newMap[nf].locs,
          procurementType: newMap[nf].procurementType,
        });
        matchedOld.add(of2);
        matchedNew.add(nf);
        break;
      }
    }
  }

  // Sub-assemblies whose base P/N has a rev change (used to detect "moved")
  const changedSubBases = new Set();
  for (const c of changed) {
    const isParent = oldHC.has(c.oldFullPN) || newHC.has(c.newFullPN);
    if (isParent && !topBases.has(c.basePart)) changedSubBases.add(c.basePart);
  }

  // Classify exact matches as qtyChanged / moved / unchanged
  for (const f of exact) {
    const oi = oldMap[f];
    const ni = newMap[f];
    const hasMoved = oi.locs.some(l => changedSubBases.has(baseOf(l.parentPn)));

    if (hasMoved) {
      moved.push({ ...ni, oldLocs: oi.locs, newLocs: ni.locs, oldSubCategory: oi.subCategory });
    } else if (oi.totalQty !== ni.totalQty) {
      qtyChanged.push({ ...ni, oldTotalQty: oi.totalQty, newTotalQty: ni.totalQty, oldLocs: oi.locs, newLocs: ni.locs });
    } else {
      unchanged.push(ni);
    }
  }

  for (const f of onlyOld) { if (!matchedOld.has(f)) removed.push(oldMap[f]); }
  for (const f of onlyNew) { if (!matchedNew.has(f)) added.push(newMap[f]); }

  return { added, removed, changed, qtyChanged, moved, unchanged };
}
