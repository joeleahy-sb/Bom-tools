import { T } from '../theme';
import { DropZone } from './common/DropZone';

const META_FIELDS = [
  { key: 'product', label: 'Product',     placeholder: 'RO3 Thor Arm' },
  { key: 'oldRev',  label: 'Old Rev',     placeholder: 'B.0' },
  { key: 'newRev',  label: 'New Rev',     placeholder: 'C.0' },
  { key: 'date',    label: 'Target Date', placeholder: '2026-03-15' },
];

export function UploadView({ oldFileName, newFileName, oldRows, newRows, metadata, onOldFile, onNewFile, onMetaChange, onRun }) {
  const ready = oldRows.length > 0 && newRows.length > 0;

  return (
    <div style={{ animation: 'fadeIn .3s' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px', color: T.text }}>
        Upload SolidWorks BOMs
      </h1>
      <p style={{ color: T.textMid, fontSize: 12, margin: '0 0 28px', lineHeight: 1.6 }}>
        Upload the current and new revision CSVs to generate the Part Mapping File,
        Build Validation checklist, and Changeover workflow.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <DropZone
          label="Current BOM (Old Rev)"
          fileName={oldFileName}
          rowCount={oldRows.length}
          onFile={onOldFile}
        />
        <DropZone
          label="New BOM (New Rev)"
          fileName={newFileName}
          rowCount={newRows.length}
          onFile={onNewFile}
          accent
        />
      </div>

      {ready && (
        <div style={{ animation: 'fadeIn .3s' }}>
          {/* Metadata */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.textSoft, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>
              BOM Metadata
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {META_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 10, color: T.textMid, display: 'block', marginBottom: 3 }}>{label}</label>
                  <input
                    value={metadata[key] || ''}
                    onChange={e => onMetaChange(key, e.target.value)}
                    placeholder={placeholder}
                    style={{
                      width: '100%', padding: '7px 9px', background: T.cardAlt,
                      border: `1px solid ${T.border}`, borderRadius: 5,
                      color: T.text, fontSize: 11, fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '10px 12px', background: T.cardAlt, borderRadius: 6, fontSize: 11, color: T.textMid }}>
              <strong style={{ color: T.accent }}>Detected: </strong>
              ITEM NO. | PART NUMBER | REV | DESCRIPTION | QTY ({oldRows.length} old, {newRows.length} new)
            </div>
          </div>

          <button
            onClick={onRun}
            style={{
              width: '100%', padding: 12,
              background: 'linear-gradient(135deg,#B4830E,#C85A17)',
              color: '#fff', border: 'none', borderRadius: 7,
              cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            }}
          >
            Generate Part Mapping &amp; Changeover Tools →
          </button>
        </div>
      )}
    </div>
  );
}
