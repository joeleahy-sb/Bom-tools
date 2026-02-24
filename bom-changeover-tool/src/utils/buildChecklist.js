/**
 * buildChecklist.js
 *
 * Generates the structured changeover workflow checklist from a diff result.
 * Each "phase" has an owner, a colour, and a list of action items.
 *
 * To add or edit checklist phases/items, this is the only file you need
 * to change — no UI code needs to be touched.
 */

const COLORS = {
  init:   '#B4830E',
  comp:   '#C85A17',
  src:    '#0E8A5F',
  test:   '#6D28D9',
  mes:    '#1D6FD1',
  label:  '#C42B2B',
  comm:   '#BE185D',
  verify: '#0C8A7F',
};

/** Truncate an array and append a "+N more" entry if needed. */
function sl(arr, max = 6) {
  return arr.slice(0, max).concat(
    arr.length > max ? [`...+${arr.length - max} more`] : []
  );
}

let _uid = 0;
function uid() { return `cl_${++_uid}`; }

/**
 * Build the full checklist from a diff result and metadata object.
 *
 * @param {object} diff     - result of diffBOMs()
 * @param {object} metadata - { product, oldRev, newRev, date }
 * @returns Phase[]
 */
export function buildChecklist(diff, metadata) {
  _uid = 0; // reset so IDs are stable between re-renders with same inputs

  const { product = 'Assembly', oldRev = '?', newRev = '?', date = 'TBD' } = metadata;
  const rev    = `${oldRev} → ${newRev}`;
  const allNew = [...diff.added.map(i => i.fullPN), ...diff.changed.map(i => i.newFullPN)];
  const allOld = diff.removed.map(i => i.fullPN);
  const allRC  = diff.changed.map(i => `${i.oldFullPN} → ${i.newFullPN}`);

  return [
    {
      id: 'p1', num: 1, color: COLORS.init,
      title: 'Initiation & ECN',
      owner: 'Hardware + Process Eng',
      items: [
        { id: uid(), text: `Create ECN in Asana for ${product} ${rev}.` },
        { id: uid(), text: `Scope: ${diff.changed.length} rev, ${diff.added.length} added, ${diff.removed.length} removed, ${diff.qtyChanged.length} qty, ${diff.moved.length} moved.` },
        { id: uid(), text: 'Identify affected sub-assemblies and parents.' },
        { id: uid(), text: 'Create test plan, assign test build qty + date.' },
      ],
    },
    {
      id: 'p2', num: 2, color: COLORS.comp,
      title: 'Part Mapping Review',
      owner: 'Hardware → Production',
      items: [
        { id: uid(), text: 'Hardware delivers structured BOM + flat BOM w/ pictures.' },
        { id: uid(), text: 'Review Part Mapping — confirm rev changes:', parts: sl(allRC, 8) },
        ...(diff.added.length ? [{ id: uid(), text: 'Verify added parts genuinely new:', parts: diff.added.map(i => i.fullPN) }] : []),
        ...(diff.removed.length ? [{ id: uid(), text: 'Verify removed parts genuinely discontinued:', parts: allOld }] : []),
        { id: uid(), text: 'Fill in Fwd/Bwd Compat + Justification.' },
        { id: uid(), text: 'Specify alternates.' },
        { id: uid(), text: 'Hardware creates Visual Summary.' },
        { id: uid(), text: 'Joint review call.' },
        { id: uid(), text: 'Set all statuses to Confirmed.' },
      ],
    },
    {
      id: 'p3', num: 3, color: COLORS.src,
      title: 'Sourcing & Procurement',
      owner: 'Production → Sourcing',
      items: [
        { id: uid(), text: 'Notify Sourcing (see Sourcing tab).' },
        { id: uid(), text: 'Add new parts to Marvin w/ MPNs:', parts: sl(allNew) },
        { id: uid(), text: 'Create POs before parts arrive.' },
        ...(allOld.length ? [{ id: uid(), text: 'Cancel/reduce orders:', parts: allOld }] : []),
        { id: uid(), text: 'Quality checks (Charlie).' },
        { id: uid(), text: 'PCBs: Jaideep adds before BOM upload.' },
        { id: uid(), text: 'Old-rev disposition via MRB.' },
        { id: uid(), text: `Update plan (target: ${date}).` },
      ],
    },
    {
      id: 'p4', num: 4, color: COLORS.test,
      title: 'Test Build',
      owner: 'Process Eng + Assembly',
      items: [
        { id: uid(), text: 'Confirm test parts in shop.' },
        { id: uid(), text: `Test build ${product} ${newRev} — use Build Validation tab.` },
        { id: uid(), text: 'Document results, iterate until clean.' },
        { id: uid(), text: 'Hardware approves.' },
      ],
    },
    {
      id: 'p5', num: 5, color: COLORS.mes,
      title: 'Marvin & MES Setup',
      owner: 'Process Engineer',
      items: [
        { id: uid(), text: 'Add part locations for changed/new parts.' },
        { id: uid(), text: 'Upload final BOM to Marvin.' },
        { id: uid(), text: 'Enable MES on each sub-assy + parent.' },
        { id: uid(), text: 'Configure alternates:', parts: sl(diff.changed.map(i => `${i.newFullPN} ↔ ${i.oldFullPN}`)) },
        { id: uid(), text: `Cross-link revisions: ${oldRev} ↔ ${newRev}.` },
        { id: uid(), text: 'Compare old vs new MES.' },
        { id: uid(), text: 'Status: Pending → Production.' },
      ],
    },
    {
      id: 'p6', num: 6, color: COLORS.label,
      title: 'Labeling & Changeover',
      owner: 'Process Eng + Inventory',
      items: [
        { id: uid(), text: `Print labels for ${allNew.length + diff.qtyChanged.length} parts (Labels tab). ×2.` },
        { id: uid(), text: 'Print QR codes. Apply labels.' },
        { id: uid(), text: 'Segregate old-rev parts.' },
        { id: uid(), text: 'Confirm all new parts present.' },
      ],
    },
    {
      id: 'p7', num: 7, color: COLORS.comm,
      title: 'Communication & Rollout',
      owner: 'Process Engineer (DRI)',
      items: [
        { id: uid(), text: `Determine cutoff SNs for ${product}.` },
        { id: uid(), text: `Publish impl date: ${date}.` },
        { id: uid(), text: 'Notify all teams.' },
        { id: uid(), text: 'Post #bom-update-notice.' },
        { id: uid(), text: 'Present at all-hands.' },
        { id: uid(), text: `Update SKU rev to ${newRev}.` },
      ],
    },
    {
      id: 'p8', num: 8, color: COLORS.verify,
      title: 'Verification & Closeout',
      owner: 'Process Eng + Assembly Lead',
      items: [
        { id: uid(), text: 'First production build w/ full verification.' },
        { id: uid(), text: 'Walk stations — MES matches physical.' },
        { id: uid(), text: 'Weekly review 2–4 weeks.' },
        { id: uid(), text: 'ECN complete in Asana. ✅ Closed.' },
      ],
    },
  ];
}
