import { T } from '../../theme';

export function Header({ saving, metadata, oldFileName, newFileName }) {
  return (
    <header style={{
      borderBottom: `1px solid ${T.border}`,
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      background: T.headerBg,
      backdropFilter: 'blur(12px)',
      zIndex: 100,
    }}>
      {/* Logo + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 5,
          background: 'linear-gradient(135deg,#B4830E,#C85A17)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: '#fff',
        }}>Δ</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>BOM Changeover Tool</div>
          <div style={{ fontSize: 9, color: T.textSoft, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Part Mapping · Build Validation · Changeover Checklist
          </div>
        </div>
      </div>

      {/* Right side: file names + save indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 10 }}>
        {oldFileName && (
          <span style={{ color: T.textSoft }} title={oldFileName}>
            Old: <span style={{ color: T.textMid, fontWeight: 600 }}>{oldFileName}</span>
          </span>
        )}
        {newFileName && (
          <span style={{ color: T.textSoft }} title={newFileName}>
            New: <span style={{ color: T.accent, fontWeight: 600 }}>{newFileName}</span>
          </span>
        )}
        {saving && (
          <span style={{ color: T.textFaint, fontSize: 9, fontStyle: 'italic' }}>saving…</span>
        )}
      </div>
    </header>
  );
}
