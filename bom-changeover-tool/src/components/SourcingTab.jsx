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

function Panel({ color, title, subtitle, children }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: 16, marginBottom: 12,
      borderLeft: `3px solid ${color}`,
    }}>
      <h3 style={{ fontSize: 12, fontWeight: 600, margin: '0 0 10px', color }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 10, color: T.textSoft, margin: '0 0 10px' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

export function SourcingTab({ diff }) {
  const toOrder = [
    ...diff.added.map(i => ({ pn: i.fullPN, desc: i.desc, qty: i.totalQty, type: 'New' })),
    ...diff.changed.map(i => ({ pn: i.newFullPN, desc: i.newDesc, qty: i.newTotalQty, type: 'Rev change' })),
  ];
  const toCancel = diff.removed.map(i => ({ pn: i.fullPN, desc: i.desc, qty: i.totalQty }));
  const qtyAdj   = diff.qtyChanged.map(i => ({ pn: i.fullPN, desc: i.desc, oldQty: i.oldTotalQty, newQty: i.newTotalQty }));

  if (!toOrder.length && !toCancel.length && !qtyAdj.length) {
    return <div style={{ color: T.textSoft, fontSize: 12, padding: 20 }}>No sourcing actions needed.</div>;
  }

  return (
    <div>
      {toOrder.length > 0 && (
        <Panel color={T.green} title={`📦 New POs Needed (${toOrder.length})`}>
          <SimpleTable
            headers={['P/N', 'Description', 'Qty', 'Type']}
            rows={toOrder.map(p => [
              { value: p.pn,   style: { fontWeight: 500, color: T.text } },
              { value: p.desc, style: { color: T.textMid, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
              { value: p.qty,  style: { color: T.textMid } },
              { value: p.type, style: { color: T.textSoft } },
            ])}
          />
        </Panel>
      )}

      {toCancel.length > 0 && (
        <Panel color={T.red} title={`🚫 Cancel / Reduce Orders (${toCancel.length})`}>
          <SimpleTable
            headers={['P/N', 'Description', 'Qty']}
            rows={toCancel.map(p => [
              { value: p.pn,   style: { fontWeight: 500, color: T.text } },
              { value: p.desc, style: { color: T.textMid } },
              { value: p.qty,  style: { color: T.textMid } },
            ])}
          />
        </Panel>
      )}

      {qtyAdj.length > 0 && (
        <Panel color={T.blue} title={`📊 Quantity Adjustments (${qtyAdj.length})`}>
          <SimpleTable
            headers={['P/N', 'Description', 'Old', 'New', 'Δ']}
            rows={qtyAdj.map(p => {
              const delta = p.newQty - p.oldQty;
              return [
                { value: p.pn,   style: { fontWeight: 500, color: T.text } },
                { value: p.desc, style: { color: T.textMid } },
                { value: p.oldQty, style: { color: T.textMid } },
                { value: p.newQty, style: { color: T.textMid } },
                { value: (delta > 0 ? '+' : '') + delta, style: { color: delta > 0 ? T.green : T.red, fontWeight: 600 } },
              ];
            })}
          />
        </Panel>
      )}
    </div>
  );
}
