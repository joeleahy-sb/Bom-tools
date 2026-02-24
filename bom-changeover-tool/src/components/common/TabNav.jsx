import { T } from '../../theme';

/**
 * Top-level tab navigation bar.
 *
 * tabs: [{ id: string, label: string, badge?: number }]
 */
export function TabNav({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 2,
      background: T.card,
      borderRadius: 6,
      padding: 3,
      border: `1px solid ${T.border}`,
      marginBottom: 20,
    }}>
      {tabs.map(({ id, label, badge }) => {
        const active = id === activeTab;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: active ? T.cardAlt : 'transparent',
              border: 'none',
              borderRadius: 4,
              color: active ? T.text : T.textSoft,
              fontSize: 11,
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {label}
            {badge != null && badge > 0 && (
              <span style={{
                fontSize: 9,
                background: active ? T.accent + '22' : T.border,
                color: active ? T.accent : T.textSoft,
                padding: '1px 6px',
                borderRadius: 8,
                fontWeight: 600,
              }}>{badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
