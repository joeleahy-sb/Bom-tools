/**
 * bomParser.js
 *
 * Parses BOM CSV files into a normalised row format, then groups rows
 * into named sections (sub-assemblies) for the Build Validation tab.
 *
 * ─── Normalised row shape ────────────────────────────────────────────
 * {
 *   itemNo:          string   // e.g. "1.5" or "3"
 *   pn:              string   // part number
 *   rev:             string   // revision letter/code
 *   desc:            string   // description
 *   qty:             number
 *   uom:             string   // unit of measure, default "EA"
 *   subCategory:     string   // optional category column
 *   procurementType: string   // optional procurement-type column
 *   fullPN:          string   // "pn-rev" (or just pn if no rev)
 * }
 *
 * ─── Section shape (for Build Validation) ───────────────────────────
 * {
 *   sectionName: string
 *   parts:       NormalisedRow[]
 * }
 *
 * ─── Grouping logic ─────────────────────────────────────────────────
 * 1. If column A contains leveled item numbers (e.g. 1.1, 1.2, 2.1 …)
 *    → group by the leading integer prefix.
 *    • The bare-integer row (item = "1") is used as the section name.
 *    • Prefixes with no decimal children (standalone integers like 11–24)
 *      are collected into a "Miscellaneous" section at the end.
 *
 * 2. Fallback: group by the Sub-Category / Sub-Assembly column value.
 */

// ── CSV primitives ────────────────────────────────────────────────────

/** Parse one CSV line, respecting quoted fields. */
function parseLine(line) {
  const vals = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { vals.push(cur); cur = ''; }
    else cur += ch;
  }
  vals.push(cur);
  return vals.map(s => s.trim());
}

/** Parse one tab-delimited line (SolidWorks .tsv export). */
function parseTabLine(line) {
  return line.split('\t').map(f => f.replace(/^"|"$/g, '').trim());
}

/**
 * Find the index of the first header that matches any candidate name.
 * Matching is case-insensitive, ignoring spaces / punctuation.
 */
function findCol(rawHeaders, candidates) {
  const norm = h => h.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalised = rawHeaders.map(norm);
  for (const c of candidates) {
    const idx = normalised.indexOf(norm(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Parse raw CSV (or TSV) text into an array of normalised row objects.
 * Returns [] if the file cannot be understood.
 */
export function parseCSVText(text) {
  // Strip BOM character if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Auto-detect delimiter
  const tabCount   = (lines[0].match(/\t/g)  || []).length;
  const commaCount = (lines[0].match(/,/g)   || []).length;
  const isTab = tabCount > commaCount;
  const split = isTab ? parseTabLine : parseLine;

  const rawHeaders = split(lines[0]);

  // ── Column detection ──────────────────────────────────────────────
  let itemCol = findCol(rawHeaders, [
    'item', 'item no', 'item number', 'item #', 'itemno',
    'no', 'no.', 'line', 'line no', 'line number',
    'seq', 'sequence', 'pos', 'position', '#',
  ]);

  // Fallback: if col 0 looks like leveled item numbers (e.g. 1.5, 2.3)
  if (itemCol === -1 && lines.length > 1) {
    const samples = lines.slice(1, 6).map(l => (split(l)[0] || '').trim());
    if (samples.some(s => /^\d+\.\d/.test(s))) itemCol = 0;
  }

  const pnCol       = findCol(rawHeaders, ['part number', 'partnumber', 'part no', 'partno', 'pn', 'part num']);
  const revCol      = findCol(rawHeaders, ['rev', 'revision', 'rev level', 'revision level']);
  const descCol     = findCol(rawHeaders, ['description', 'desc', 'name', 'part name', 'part description']);
  const qtyCol      = findCol(rawHeaders, ['qty', 'quantity', 'amount', 'count']);
  const uomCol      = findCol(rawHeaders, ['uom', 'unit', 'units', 'unit of measure']);
  const subCatCol   = findCol(rawHeaders, ['sub-category', 'subcategory', 'sub category', 'category', 'cat', 'type', 'sub-assembly', 'subassembly', 'sub assembly', 'assembly', 'group', 'section']);
  const procTypeCol = findCol(rawHeaders, ['procurement type', 'procurementtype', 'procurement', 'proc type', 'source']);

  if (pnCol === -1 && descCol === -1) return [];

  const get = (vals, col) => (col !== -1 ? (vals[col] || '').trim() : '');

  return lines.slice(1).map(line => {
    const vals = split(line);
    const pn   = get(vals, pnCol);
    const rev  = get(vals, revCol);
    const desc = get(vals, descCol);
    if (!pn && !desc) return null;

    const qtyRaw = get(vals, qtyCol);
    const qty    = parseFloat(qtyRaw) || 0;

    return {
      itemNo:          get(vals, itemCol),
      pn,
      rev,
      desc,
      qty,
      uom:             get(vals, uomCol) || 'EA',
      subCategory:     get(vals, subCatCol),
      procurementType: get(vals, procTypeCol),
      fullPN:          pn && rev ? `${pn}-${rev}` : pn,
    };
  }).filter(Boolean);
}

/**
 * Read a File object and return a Promise that resolves to normalised rows.
 * Tries UTF-8 first, falls back to UTF-16 (common for SolidWorks exports).
 */
export function readBOMFile(file) {
  const tryEncoding = (encoding) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const rows = parseCSVText(e.target.result);
        rows.length > 0 ? resolve(rows) : reject(new Error('no_rows'));
      };
      reader.onerror = () => reject(new Error('read_error'));
      reader.readAsText(file, encoding);
    });

  return tryEncoding('UTF-8').catch(() => tryEncoding('UTF-16'));
}

/**
 * Group normalised rows into named sections for the Build Validation tab.
 *
 * See module docblock for grouping logic.
 */
export function parseBOMSections(rows) {
  const hasLeveled = rows.some(r => /^\d+\.\d/.test(r.itemNo));

  if (hasLeveled) {
    const sectionMap   = {};   // prefix → rows[]
    const sectionOrder = [];   // insertion order of prefixes
    const sectionNames = {};   // prefix → display name (from bare-int row)
    const miscRows     = [];

    rows.forEach(r => {
      const n = r.itemNo.trim();
      const m = n.match(/^(\d+)/);
      if (!m) {
        if (r.pn || r.desc) miscRows.push(r);
        return;
      }
      const prefix = m[1];
      if (!sectionMap[prefix]) { sectionMap[prefix] = []; sectionOrder.push(prefix); }

      // Bare integer rows (e.g. "1" or "1.0") act as the section header
      if (!sectionNames[prefix] && r.desc && (/^\d+$/.test(n) || /^\d+\.0+$/.test(n))) {
        sectionNames[prefix] = r.desc;
      }
      sectionMap[prefix].push(r);
    });

    const sections = [];
    sectionOrder.forEach(prefix => {
      const all      = sectionMap[prefix];
      const children = all.filter(r => !/^\d+$/.test(r.itemNo) && !/^\d+\.0+$/.test(r.itemNo));

      // Prefixes with no decimal children are standalone items → Miscellaneous
      if (children.length === 0) {
        all.forEach(r => { if (r.pn || r.desc) miscRows.push(r); });
        return;
      }

      sections.push({
        sectionName: sectionNames[prefix] || `Assembly ${prefix}`,
        parts: children,
      });
    });

    if (miscRows.length > 0) {
      sections.push({ sectionName: 'Miscellaneous', parts: miscRows });
    }
    return sections;
  }

  // ── Fallback: group by subCategory column ────────────────────────
  const sectionMap   = {};
  const sectionOrder = [];
  rows.forEach(r => {
    const sec = r.subCategory || 'Main Assembly';
    if (!sectionMap[sec]) { sectionMap[sec] = []; sectionOrder.push(sec); }
    sectionMap[sec].push(r);
  });
  return sectionOrder.map(name => ({ sectionName: name, parts: sectionMap[name] }));
}
