import { T } from '../theme';

function SimpleTable({ headers, rows }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
      <thead>
        <tr>
          {headers.map(h => (
            <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textSoft, fontWeight: 500, borderBottom: `1px solid ${T.border}`, fontSize: 9, textTransform: 'uppercase' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
            {cells.map((cell, j) => (
              <td key={j} style={{ padding: '5px 8px', ...(cell.style || {}) }}>
                {cell.value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Panel({ title, color, children }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: 16, marginBottom: 16,
      borderLeft: `3px solid ${color}`,
    }}>
      {children}
    </div>
  );
}

export function LabelsTab({ diff, mappingEdits }) {
  // Parts that need new labels
  const labelParts = [
    ...diff.added.map(i => ({ pn: i.fullPN, desc: i.desc, reason: 'New part' })),
    ...diff.changed.map(i => ({ pn: i.newFullPN, desc: i.newDesc, reason: `${i.oldRev} → ${i.newRev}` })),
    ...diff.qtyChanged.map(i => ({ pn: i.fullPN, desc: i.desc, reason: `Qty ${i.oldTotalQty} → ${i.newTotalQty}` })),
  ];

  // Suggested alternates: old rev of changed parts
  const alternates = diff.changed.map(c => ({
    primary:   c.newFullPN,
    alternate: c.oldFullPN,
    userAlt:   mappingEdits[c.newFullPN]?.alt || '',
    reason:    `Old ${c.oldRev} as alternate`,
  }));

  return (
    <div>
      {labelParts.length === 0
        ? <div style={{ color: T.textSoft, fontSize: 12, padding: 20 }}>No labels needed.</div>
        : (
          <Panel title="" color={T.red}>
            <h3 style={{ fontSize: 12, fontWeight: 600, margin: '0 0 4px', color: T.text }}>
              🏷️ Labels to Print ({labelParts.length})
            </h3>
            <p style={{ fontSize: 10, color: T.textSoft, margin: '0 0 12px' }}>Print twice — bin + backup.</p>
            <SimpleTable
              headers={['Part Number', 'Description', 'Reason']}
              rows={labelParts.map(x => [
                { value: x.pn,   style: { fontWeight: 500, color: T.text } },
                { value: x.desc, style: { color: T.textMid, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                { value: x.reason, style: { color: T.textSoft } },
              ])}
            />
          </Panel>
        )
      }

      {alternates.length > 0 && (
        <Panel title="" color={T.purple}>
          <h3 style={{ fontSize: 12, fontWeight: 600, margin: '0 0 4px', color: T.text }}>
            🔄 Suggested Alternates ({alternates.length})
          </h3>
          <p style={{ fontSize: 10, color: T.textSoft, margin: '0 0 12px' }}>Configure in Marvin MES.</p>
          <SimpleTable
            headers={['Primary P/N', 'Alternate P/N', 'User Alt', 'Reason']}
            rows={alternates.map(x => [
              { value: x.primary,   style: { fontWeight: 500, color: T.text } },
              { value: x.alternate, style: { color: T.textMid } },
              { value: x.userAlt || '—', style: { color: x.userAlt ? T.accent : T.textFaint } },
              { value: x.reason,    style: { color: T.textSoft, fontSize: 9 } },
            ])}
          />
        </Panel>
      )}
    </div>
  );
}
