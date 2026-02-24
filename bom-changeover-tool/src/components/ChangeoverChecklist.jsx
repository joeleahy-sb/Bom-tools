import { useState } from 'react';
import { T } from '../theme';
import { buildChecklist } from '../utils/buildChecklist';

function Phase({ phase, checks, onToggle }) {
  const [open, setOpen] = useState(true);
  const done    = phase.items.filter(i => checks[i.id]).length;
  const allDone = done === phase.items.length;

  return (
    <div style={{
      marginBottom: 12, background: T.card,
      border: `1px solid ${T.border}`, borderRadius: 8,
      overflow: 'hidden', borderLeft: `3px solid ${phase.color}`,
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {allDone
            ? <span style={{ color: T.green, fontSize: 14 }}>✓</span>
            : <div style={{
                width: 18, height: 18, borderRadius: 3,
                border: `2px solid ${phase.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: phase.color,
              }}>{phase.num}</div>
          }
          <span style={{
            fontSize: 12, fontWeight: 600, color: T.text,
            opacity: allDone ? .45 : 1,
            textDecoration: allDone ? 'line-through' : 'none',
          }}>{phase.title}</span>
          <span style={{ fontSize: 9, color: T.textSoft }}>{done}/{phase.items.length}</span>
        </div>
        <span style={{ fontSize: 10, color: T.textFaint, transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .15s' }}>▾</span>
      </div>

      {open && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ fontSize: 9, color: T.textSoft, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Owner: {phase.owner}
          </div>
          {phase.items.map(item => (
            <div
              key={item.id}
              onClick={() => onToggle(item.id)}
              style={{
                display: 'flex', gap: 8, padding: '6px 0',
                cursor: 'pointer', borderBottom: `1px solid ${T.borderLight}`,
                opacity: checks[item.id] ? .4 : 1, transition: 'opacity .15s',
              }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: 2, flexShrink: 0, marginTop: 1,
                border: checks[item.id] ? 'none' : `1.5px solid ${T.border}`,
                background: checks[item.id] ? phase.color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, color: '#fff', fontWeight: 700,
              }}>{checks[item.id] && '✓'}</div>

              <div style={{ fontSize: 11, lineHeight: 1.5, color: T.text, textDecoration: checks[item.id] ? 'line-through' : 'none' }}>
                {item.text}
                {item.parts?.length > 0 && (
                  <div style={{ marginTop: 3 }}>
                    {item.parts.map((p, i) => (
                      <div key={i} style={{ fontSize: 9, color: T.textSoft, paddingLeft: 2 }}>→ {p}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChangeoverChecklist({ diff, metadata, phaseChecks, onToggle }) {
  const phases   = buildChecklist(diff, metadata);
  const allItems = phases.flatMap(p => p.items);
  const done     = allItems.filter(i => phaseChecks[i.id]).length;

  return (
    <div>
      {/* Overall progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: T.textMid }}>{done}/{allItems.length} steps complete</span>
        <div style={{ flex: 1, height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${allItems.length ? (done / allItems.length) * 100 : 0}%`,
            background: 'linear-gradient(90deg,#B4830E,#C85A17)',
            borderRadius: 2, transition: 'width .3s',
          }} />
        </div>
      </div>

      {phases.map(phase => (
        <Phase key={phase.id} phase={phase} checks={phaseChecks} onToggle={onToggle} />
      ))}
    </div>
  );
}
