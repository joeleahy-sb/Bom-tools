import { useState } from 'react';
import { T } from '../theme';

// ── Small shared primitives ───────────────────────────────────────────

function YNSelect({ value, onChange }) {
  return (
    <td style={{ padding: '4px 6px' }}>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '3px 4px', background: T.cardAlt, border: `1px solid ${T.border}`,
          borderRadius: 3, color: value === 'Y' ? T.green : value === 'N' ? T.red : T.textMid,
          fontSize: 9, fontFamily: 'inherit', fontWeight: 600, width: 36,
        }}
      >
        {['', 'Y', 'N', '?'].map(o => <option key={o} value={o}>{o || '—'}</option>)}
      </select>
    </td>
  );
}

function TextCell({ value, onChange, width = 100, placeholder = '...' }) {
  return (
    <td style={{ padding: '4px 6px' }}>
      <input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width, padding: '3px 5px', background: T.cardAlt,
          border: `1px solid ${T.border}`, borderRadius: 3,
          color: T.text, fontSize: 9, fontFamily: 'inherit',
        }}
      />
    </td>
  );
}

// ── Section component ─────────────────────────────────────────────────

const COL_HEADERS = [
  'Old P/N', 'New P/N', 'Description', 'Category',
  'Old Qty', 'New Qty', 'Old Locs', 'New Locs',
  'Fwd?', 'Bwd?', 'Justification', 'Alternates', 'Status',
];

function MappingSection({ title, color, items, edits, onUpdate }) {
  const [open, setOpen] = useState(true);
  const confirmed = items.filter(i => edits[i.key]?.status === 'confirmed').length;

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 8, marginBottom: 12, overflow: 'hidden',
      borderLeft: `3px solid ${color}`,
    }}>
      {/* Header row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{title}</span>
          <span style={{ fontSize: 9, background: color + '18', color, padding: '1px 7px', borderRadius: 8, fontWeight: 600 }}>
            {items.length}
          </span>
          {confirmed > 0 && (
            <span style={{ fontSize: 9, color: T.green }}>({confirmed} ✓)</span>
          )}
        </div>
        <span style={{ fontSize: 10, color: T.textFaint, transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .15s' }}>▾</span>
      </div>

      {/* Table */}
      {open && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, minWidth: 960 }}>
            <thead>
              <tr style={{ background: T.cardAlt }}>
                {COL_HEADERS.map(h => (
                  <th key={h} style={{
                    padding: '6px 8px', textAlign: 'left', color: T.textSoft, fontWeight: 500,
                    borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
                    fontSize: 9, textTransform: 'uppercase', letterSpacing: '.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const e  = edits[item.key] || {};
                const sc = e.status === 'confirmed' ? T.green : e.status === 'rejected' ? T.red : T.accent;
                return (
                  <tr key={idx} style={{
                    borderBottom: `1px solid ${T.borderLight}`,
                    background: e.status === 'confirmed' ? 'rgba(14,138,95,.04)' : 'transparent',
                  }}>
                    <td style={{ padding: '6px 8px', fontWeight: 500, color: item.oldPN ? T.text : T.textFaint, whiteSpace: 'nowrap' }}>{item.oldPN || '—'}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 500, color: item.newPN ? T.text : T.textFaint, whiteSpace: 'nowrap' }}>{item.newPN || '—'}</td>
                    <td style={{ padding: '6px 8px', color: T.textMid, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.desc}>{item.desc}</td>
                    <td style={{ padding: '6px 8px', color: T.textSoft, whiteSpace: 'nowrap' }}>{item.cat}</td>
                    <td style={{ padding: '6px 8px', color: T.textMid, textAlign: 'center' }}>{item.oldQty}</td>
                    <td style={{ padding: '6px 8px', color: T.textMid, textAlign: 'center' }}>{item.newQty}</td>
                    <td style={{ padding: '6px 8px', color: T.textSoft, fontSize: 9, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.oldLocs}>{item.oldLocs || '—'}</td>
                    <td style={{ padding: '6px 8px', color: T.textSoft, fontSize: 9, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.newLocs}>{item.newLocs || '—'}</td>
                    <YNSelect value={e.fwd} onChange={v => onUpdate(item.key, 'fwd', v)} />
                    <YNSelect value={e.bwd} onChange={v => onUpdate(item.key, 'bwd', v)} />
                    <TextCell value={e.just} onChange={v => onUpdate(item.key, 'just', v)} width={100} placeholder="Justification..." />
                    <TextCell value={e.alt}  onChange={v => onUpdate(item.key, 'alt',  v)} width={80}  placeholder="Alt P/N..." />
                    <td style={{ padding: '4px 6px' }}>
                      <select
                        value={e.status || 'needs_review'}
                        onChange={ev => onUpdate(item.key, 'status', ev.target.value)}
                        style={{
                          padding: '3px 4px', background: T.cardAlt,
                          border: `1px solid ${sc}44`, borderRadius: 3,
                          color: sc, fontSize: 9, fontFamily: 'inherit', fontWeight: 600,
                        }}
                      >
                        <option value="needs_review">Review</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────

export function MappingTab({ diff, mappingEdits, onUpdate }) {
  const locStr = locs => locs.map(l => l.itemNo).join(', ');

  const sections = [
    {
      title: 'REVISION CHANGES', color: T.orange,
      items: diff.changed.map(i => ({
        key: i.newFullPN, oldPN: i.oldFullPN, newPN: i.newFullPN,
        desc: i.newDesc, cat: i.newSubCategory,
        oldQty: i.oldTotalQty, newQty: i.newTotalQty,
        oldLocs: locStr(i.oldLocs), newLocs: locStr(i.newLocs),
      })),
    },
    {
      title: 'ADDED PARTS', color: T.green,
      items: diff.added.map(i => ({
        key: i.fullPN, oldPN: '', newPN: i.fullPN,
        desc: i.desc, cat: i.subCategory,
        oldQty: 0, newQty: i.totalQty,
        oldLocs: '', newLocs: locStr(i.locs),
      })),
    },
    {
      title: 'REMOVED PARTS', color: T.red,
      items: diff.removed.map(i => ({
        key: i.fullPN, oldPN: i.fullPN, newPN: '',
        desc: i.desc, cat: i.subCategory,
        oldQty: i.totalQty, newQty: 0,
        oldLocs: locStr(i.locs), newLocs: '',
      })),
    },
    {
      title: 'QUANTITY CHANGES', color: T.blue,
      items: diff.qtyChanged.map(i => ({
        key: i.fullPN, oldPN: i.fullPN, newPN: i.fullPN,
        desc: i.desc, cat: i.subCategory,
        oldQty: i.oldTotalQty, newQty: i.newTotalQty,
        oldLocs: locStr(i.oldLocs), newLocs: locStr(i.newLocs),
      })),
    },
    {
      title: 'MOVED (Parent Sub-Assy Changed)', color: T.purple,
      items: diff.moved.map(i => ({
        key: i.fullPN, oldPN: i.fullPN, newPN: i.fullPN,
        desc: i.desc, cat: i.subCategory,
        oldQty: i.totalQty, newQty: i.totalQty,
        oldLocs: i.oldLocs.map(l => `${l.itemNo}→${l.parentPn}`).join('; '),
        newLocs: i.locs.map(l => `${l.itemNo}→${l.parentPn}`).join('; '),
      })),
    },
  ].filter(s => s.items.length > 0);

  return (
    <div>
      <p style={{ fontSize: 11, color: T.textMid, margin: '0 0 16px', lineHeight: 1.5 }}>
        Review each change. Fill in compatibility, justification, and alternates.
        Set status to <strong>Confirmed</strong> when reviewed.
      </p>
      <div style={{ padding: '8px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 20, fontSize: 10, color: T.textMid }}>
        <strong>Note: </strong>Rev Changed includes sub-assemblies. Moved = parent sub-assy rev-changed.
      </div>
      {sections.map(s => (
        <MappingSection key={s.title} {...s} edits={mappingEdits} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
