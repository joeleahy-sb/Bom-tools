/**
 * bomExport.js
 * CSV export utilities.
 */

function csvCell(val) {
  const s = String(val ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

/**
 * Export the Part Mapping table as a CSV file and trigger a download.
 */
export function exportMappingCSV(diff, mappingEdits, metadata) {
  const headers = [
    'Change Type', 'Old Full PN', 'New Full PN', 'Description',
    'Sub-Category', 'Total Qty Old', 'Total Qty New',
    'Fwd Compat?', 'Bwd Compat?', 'Justification', 'Alternates', 'Status',
  ];

  const makeRow = (type, oldPN, newPN, desc, cat, oq, nq, key) => {
    const e = mappingEdits[key] || {};
    return [type, oldPN, newPN, desc, cat, oq, nq,
      e.fwd || '', e.bwd || '', e.just || '', e.alt || '',
      e.status || 'needs_review',
    ].map(csvCell).join(',');
  };

  const rows = [headers.map(csvCell).join(',')];

  diff.added.forEach(i =>
    rows.push(makeRow('ADDED', '', i.fullPN, i.desc, i.subCategory, 0, i.totalQty, i.fullPN)));
  diff.changed.forEach(i =>
    rows.push(makeRow('REVISION_CHANGE', i.oldFullPN, i.newFullPN, i.newDesc, i.newSubCategory, i.oldTotalQty, i.newTotalQty, i.newFullPN)));
  diff.qtyChanged.forEach(i =>
    rows.push(makeRow('QTY_CHANGE', i.fullPN, i.fullPN, i.desc, i.subCategory, i.oldTotalQty, i.newTotalQty, i.fullPN)));
  diff.moved.forEach(i =>
    rows.push(makeRow('MOVED', i.fullPN, i.fullPN, i.desc, i.subCategory, i.totalQty, i.totalQty, i.fullPN)));
  diff.removed.forEach(i =>
    rows.push(makeRow('REMOVED', i.fullPN, '', i.desc, i.subCategory, i.totalQty, 0, i.fullPN)));

  const csv  = rows.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const prod = metadata.product || 'BOM';
  const from = metadata.oldRev  || 'old';
  const to   = metadata.newRev  || 'new';
  a.href     = url;
  a.download = `${prod}_${from}_to_${to}_PartMapping.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
