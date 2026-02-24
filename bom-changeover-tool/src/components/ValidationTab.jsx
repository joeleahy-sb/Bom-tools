import { useState } from 'react';
import { T } from '../theme';
import { partKey, getValidationStats } from '../hooks/useValidation';

// ── Sub-assembly tab strip ────────────────────────────────────────────

function SectionTabs({ sections, activeIdx, stats, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
      {sections.map((sec, i) => {
        const s       = stats.perSection[sec.sectionName] || {};
        const done    = s.total > 0 && s.checked === s.total;
        const issues  = s.flagged > 0 || s.missingCount > 0;
        const active  = i === activeIdx;

        return (
          <button
            key={sec.sectionName}
            onClick={() => onSelect(i)}
            style={{
              padding: '7px 14px',
              background: active ? '#1e293b' : T.card,
              color: active ? '#fff' : T.textMid,
              border: `1px solid ${active ? '#1e293b' : T.border}`,
              borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
              fontSize: 11, fontWeight: active ? 600 : 400,
              fontFamily: 'inherit', transition: 'all .15s',
              flexShrink: 0,
            }}
          >
            {done && !issues ? '✅ ' : issues ? '🔶 ' : ''}
            {sec.sectionName.split('(')[0].trim()}
            <span style={{ marginLeft: 6, fontSize: 9, opacity: .7 }}>
              {s.checked || 0}/{s.total || 0}
              {s.missingCount > 0 ? ` +${s.missingCount}` : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Individual part row ───────────────────────────────────────────────

function PartRow({ part, index, sectionName, checks, flags, notes, onToggleCheck, onToggleFlag, onSetNote }) {
  const [showNote, setShowNote] = useState(false);
  const key     = partKey(sectionName, index);
  const checked = !!checks[key];
  const flagged = flags[key] === 'not_needed';
  const note    = notes[key] || '';

  const bg = flagged ? '#fefce8' : checked ? '#f0fdf4' : T.card;

  return (
    <div style={{ background: bg, borderBottom: `1px solid ${T.borderLight}`, transition: 'background .15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>

        {/* Checkbox */}
        <div
          onClick={() => onToggleCheck(sectionName, index)}
          style={{
            width: 22, height: 22, borderRadius: 4, flexShrink: 0,
            border: checked ? 'none' : `2px solid ${T.border}`,
            background: checked ? '#22c55e' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700,
            transition: 'all .15s',
          }}
        >{checked ? '✓' : ''}</div>

        {/* Part info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: T.text,
            textDecoration: checked ? 'line-through' : 'none',
            opacity: checked ? 0.5 : 1,
          }}>{part.desc}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
            {part.itemNo && <span style={{ fontSize: 10, color: T.textSoft, fontFamily: 'monospace' }}>{part.itemNo}</span>}
            <span style={{ fontSize: 10, fontWeight: 600, color: T.textMid }}>{part.pn}</span>
            {part.rev && <span style={{ fontSize: 10, color: T.textSoft }}>Rev {part.rev}</span>}
          </div>
        </div>

        {/* Qty */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{part.qty}</div>
          <div style={{ fontSize: 9, color: T.textSoft }}>{part.uom || 'EA'}</div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => onToggleFlag(sectionName, index)}
            style={{
              padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
              border: `1px solid ${flagged ? '#ca8a04' : T.border}`,
              background: flagged ? '#fefce8' : T.card,
              color: flagged ? '#92400e' : T.textSoft,
              fontSize: 10, fontFamily: 'inherit',
            }}
          >⚠️ Not Needed</button>
          <button
            onClick={() => setShowNote(n => !n)}
            style={{
              padding: '4px 8px', borderRadius: 5, cursor: 'pointer',
              border: `1px solid ${note ? T.accent : T.border}`,
              background: note ? T.accent + '11' : T.card,
              color: note ? T.accent : T.textSoft,
              fontSize: 12, fontFamily: 'inherit',
            }}
          >📝</button>
        </div>
      </div>

      {/* Note area */}
      {(showNote || note) && (
        <div style={{ padding: '0 16px 10px 52px' }}>
          <input
            type="text"
            placeholder="Add a note..."
            defaultValue={note}
            onBlur={e => onSetNote(sectionName, index, e.target.value)}
            style={{
              width: '100%', padding: '6px 10px',
              border: `1px solid ${T.border}`, borderRadius: 5,
              background: T.cardAlt, color: T.text,
              fontSize: 11, fontFamily: 'inherit',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Missing parts panel ───────────────────────────────────────────────

function MissingPartsPanel({ sectionName, missingParts, onAdd, onRemove }) {
  const [open,    setOpen]    = useState(false);
  const [pn,      setPn]      = useState('');
  const [desc,    setDesc]    = useState('');
  const [qty,     setQty]     = useState('');
  const [noteVal, setNoteVal] = useState('');

  const items = missingParts[sectionName] || [];

  const submit = () => {
    if (!desc) return;
    onAdd(sectionName, { pn, desc, qty, note: noteVal });
    setPn(''); setDesc(''); setQty(''); setNoteVal(''); setOpen(false);
  };

  return (
    <div style={{ padding: '16px', borderTop: `1px solid ${T.borderLight}` }}>
      {items.map(mp => (
        <div key={mp.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', background: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: 6, marginBottom: 8,
        }}>
          <span style={{ fontSize: 16 }}>❌</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#991b1b' }}>{mp.desc}</div>
            <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#b91c1c', marginTop: 2 }}>
              {mp.pn  && <span>{mp.pn}</span>}
              {mp.qty && <span>Qty: {mp.qty}</span>}
              {mp.note && <span style={{ fontStyle: 'italic', color: '#7f1d1d' }}>{mp.note}</span>}
            </div>
          </div>
          <button
            onClick={() => onRemove(sectionName, mp.id)}
            style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626', cursor: 'pointer', padding: '2px 8px', fontSize: 10, fontFamily: 'inherit' }}
          >Remove</button>
        </div>
      ))}

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '8px 12px',
          background: open ? '#fef2f2' : '#fff5f5',
          border: '1px dashed #fca5a5', borderRadius: 6,
          color: open ? T.textMid : '#dc2626', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
        }}
      >{open ? '− Cancel' : '+ Add Missing Part (needed but not on BOM)'}</button>

      {open && (
        <div style={{ marginTop: 10, padding: 12, background: T.cardAlt, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 8 }}>
            Add a part needed during build that is not listed on the BOM:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 80px 1fr', gap: 8, marginBottom: 8 }}>
            {[
              { val: pn,      set: setPn,      ph: 'Part Number (if known)' },
              { val: desc,    set: setDesc,    ph: 'Description *' },
              { val: qty,     set: setQty,     ph: 'Qty' },
              { val: noteVal, set: setNoteVal, ph: 'Note (optional)' },
            ].map(({ val, set, ph }) => (
              <input key={ph} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                style={{ padding: '6px 9px', border: `1px solid ${T.border}`, borderRadius: 5, background: T.card, color: T.text, fontSize: 11, fontFamily: 'inherit' }}
              />
            ))}
          </div>
          <button
            onClick={submit}
            style={{
              padding: '7px 16px', background: '#dc2626', color: '#fff',
              border: 'none', borderRadius: 5, cursor: 'pointer',
              fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
            }}
          >Add Missing Part</button>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────

export function ValidationTab({ sections, checks, flags, notes, missingParts, onToggleCheck, onToggleFlag, onSetNote, onAddMissing, onRemoveMissing }) {
  const [activeIdx,    setActiveIdx]    = useState(0);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [showSummary,  setShowSummary]  = useState(false);

  if (!sections.length) {
    return <div style={{ textAlign: 'center', padding: 60, color: T.textSoft }}>No BOM sections loaded.</div>;
  }

  const stats      = getValidationStats(sections, checks, flags, missingParts);
  const curSection = sections[Math.min(activeIdx, sections.length - 1)];
  const parts      = curSection.parts;
  const cs         = stats.perSection[curSection.sectionName] || {};
  const pct        = cs.total ? Math.round(cs.checked / cs.total * 100) : 0;

  // Build summary lists for the summary panel
  const flaggedItems = [];
  const allMissing   = [];
  sections.forEach(sec => {
    sec.parts.forEach((p, i) => {
      if (flags[partKey(sec.sectionName, i)] === 'not_needed') {
        flaggedItems.push({ ...p, section: sec.sectionName, note: notes[partKey(sec.sectionName, i)] || '' });
      }
    });
    (missingParts[sec.sectionName] || []).forEach(mp => allMissing.push({ ...mp, section: sec.sectionName }));
  });

  return (
    <div>
      {/* Overall stats bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, padding: '4px 10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 20, color: '#166534' }}>
            ✅ {stats.checked}/{stats.total} verified
          </span>
          {stats.flagged > 0 && (
            <span style={{ fontSize: 11, padding: '4px 10px', background: '#fefce8', border: '1px solid #fde047', borderRadius: 20, color: '#92400e' }}>
              ⚠️ {stats.flagged} not needed
            </span>
          )}
          {stats.totalMissing > 0 && (
            <span style={{ fontSize: 11, padding: '4px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 20, color: '#991b1b' }}>
              ❌ {stats.totalMissing} missing from BOM
            </span>
          )}
        </div>
        <button
          onClick={() => setShowSummary(s => !s)}
          style={{ fontSize: 11, padding: '4px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 5, cursor: 'pointer', color: T.textMid, fontFamily: 'inherit' }}
        >{showSummary ? 'Hide' : 'Show'} Summary</button>
      </div>

      {/* Summary panel */}
      {showSummary && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
          {flaggedItems.length === 0 && allMissing.length === 0 && (
            <div style={{ color: T.textSoft, fontSize: 12, fontStyle: 'italic' }}>No flagged or missing items yet. Mark parts as "Not Needed" or add missing parts below.</div>
          )}
          {flaggedItems.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>⚠️ Not Needed ({flaggedItems.length})</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginBottom: 12 }}>
                <thead><tr style={{ background: '#fefce8' }}>
                  {['P/N', 'Description', 'Sub-Assembly', 'Note'].map(h => (
                    <th key={h} style={{ padding: '4px 8px', textAlign: 'left', color: T.textSoft, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{flaggedItems.map((it, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <td style={{ padding: '4px 8px', fontWeight: 600 }}>{it.pn}</td>
                    <td style={{ padding: '4px 8px', color: T.textMid }}>{it.desc}</td>
                    <td style={{ padding: '4px 8px', color: T.textSoft, fontSize: 9 }}>{it.section.split('(')[0].trim()}</td>
                    <td style={{ padding: '4px 8px', color: T.textSoft, fontStyle: it.note ? 'normal' : 'italic' }}>{it.note || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </>
          )}
          {allMissing.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>❌ Missing from BOM ({allMissing.length})</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead><tr style={{ background: '#fef2f2' }}>
                  {['P/N', 'Description', 'Qty', 'Sub-Assembly', 'Note'].map(h => (
                    <th key={h} style={{ padding: '4px 8px', textAlign: 'left', color: T.textSoft, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{allMissing.map((it, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <td style={{ padding: '4px 8px', fontWeight: 600 }}>{it.pn || '—'}</td>
                    <td style={{ padding: '4px 8px', color: T.textMid }}>{it.desc}</td>
                    <td style={{ padding: '4px 8px', color: T.textMid }}>{it.qty || '—'}</td>
                    <td style={{ padding: '4px 8px', color: T.textSoft, fontSize: 9 }}>{it.section.split('(')[0].trim()}</td>
                    <td style={{ padding: '4px 8px', color: T.textSoft, fontStyle: it.note ? 'normal' : 'italic' }}>{it.note || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* Sub-assembly tabs */}
      <SectionTabs sections={sections} activeIdx={activeIdx} stats={stats} onSelect={setActiveIdx} />

      {/* Section progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: 0 }}>{curSection.sectionName}</h2>
        <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: cs.checked === cs.total && cs.total > 0 ? '#22c55e' : T.accent,
            borderRadius: 3, transition: 'width .3s',
          }} />
        </div>
        <span style={{ fontSize: 11, color: T.textSoft }}>{pct}%</span>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by part number, description, or item number..."
          style={{
            width: '100%', padding: '8px 10px 8px 32px', boxSizing: 'border-box',
            border: `1px solid ${T.border}`, borderRadius: 6,
            background: T.card, color: T.text, fontSize: 12, fontFamily: 'inherit',
          }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: T.textSoft, fontSize: 14,
          }}>✕</button>
        )}
      </div>

      {/* Parts list */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
        {parts.map((part, idx) => {
          const q = searchQuery.toLowerCase();
          if (q) {
            const hay = `${part.pn} ${part.desc} ${part.itemNo}`.toLowerCase();
            if (!hay.includes(q)) return null;
          }
          return (
            <PartRow
              key={idx}
              part={part}
              index={idx}
              sectionName={curSection.sectionName}
              checks={checks}
              flags={flags}
              notes={notes}
              onToggleCheck={onToggleCheck}
              onToggleFlag={onToggleFlag}
              onSetNote={onSetNote}
            />
          );
        })}
      </div>

      {/* Missing parts */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <MissingPartsPanel
          sectionName={curSection.sectionName}
          missingParts={missingParts}
          onAdd={onAddMissing}
          onRemove={onRemoveMissing}
        />
      </div>
    </div>
  );
}
