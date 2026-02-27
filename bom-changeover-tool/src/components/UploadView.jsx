import { T } from '../theme';
import { DropZone } from './common/DropZone';

const META_FIELDS = [
  { key: 'product', label: 'Product',     placeholder: 'RO3 Thor Arm', required: true },
  { key: 'oldRev',  label: 'Old Rev',     placeholder: 'B.0',          required: true },
  { key: 'newRev',  label: 'New Rev',     placeholder: 'C.0',          required: true },
  { key: 'date',    label: 'Target Date', placeholder: '2026-03-15',   required: false },
];

export function UploadView({ oldFileName, newFileName, oldRows, newRows, metadata, onOldFile, onNewFile, onMetaChange, onRun, onResume }) {
  const filesReady       = oldRows.length > 0 && newRows.length > 0;
  const metaReady        = META_FIELDS.filter(f => f.required).every(f => metadata[f.key]?.trim());
  const ready            = filesReady && metaReady;
  const hasExistingData  = oldRows.length > 0 && newRows.length > 0;

  return (
    <div style={{ animation: 'fadeIn .3s' }}>

      {/* Active project warning */}
      {hasExistingData && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d',
          borderLeft: '4px solid #f59e0b', borderRadius: 8,
          padding: '14px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 3 }}>
              ⚠️ Active project in progress
            </div>
            <div style={{ fontSize: 11, color: '#78350f', lineHeight: 1.5 }}>
              <strong>{metadata.product || 'A project'}</strong>
              {metadata.oldRev && metadata.newRev ? ` (Rev ${metadata.oldRev} → ${metadata.newRev})` : ''} is currently loaded.
              Uploading new BOMs will replace all existing mapping, validation, and checklist data.
            </div>
          </div>
          <button
            onClick={onResume}
            style={{
              background: '#f59e0b', border: 'none', borderRadius: 6,
              color: '#fff', padding: '8px 16px', fontSize: 11,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >Return to Project →</button>
        </div>
      )}

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

      {filesReady && (
        <div style={{ animation: 'fadeIn .3s' }}>
          {/* Metadata */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.textSoft, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>
              BOM Metadata
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {META_FIELDS.map(({ key, label, placeholder, required }) => {
                const empty = required && !metadata[key]?.trim();
                return (
                  <div key={key}>
                    <label style={{ fontSize: 10, color: empty ? T.red : T.textMid, display: 'block', marginBottom: 3 }}>
                      {label}{required && <span style={{ color: T.red, marginLeft: 2 }}>*</span>}
                    </label>
                    <input
                      value={metadata[key] || ''}
                      onChange={e => onMetaChange(key, e.target.value)}
                      placeholder={placeholder}
                      style={{
                        width: '100%', padding: '7px 9px', background: T.cardAlt,
                        border: `1px solid ${empty ? T.red : T.border}`, borderRadius: 5,
                        color: T.text, fontSize: 11, fontFamily: 'inherit', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, padding: '10px 12px', background: T.cardAlt, borderRadius: 6, fontSize: 11, color: T.textMid }}>
              <strong style={{ color: T.accent }}>Detected: </strong>
              ITEM NO. | PART NUMBER | REV | DESCRIPTION | QTY ({oldRows.length} old, {newRows.length} new)
            </div>
          </div>

          <button
            onClick={onRun}
            disabled={!ready}
            style={{
              width: '100%', padding: 12,
              background: ready ? 'linear-gradient(135deg,#B4830E,#C85A17)' : T.border,
              color: ready ? '#fff' : T.textSoft, border: 'none', borderRadius: 7,
              cursor: ready ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              transition: 'background .2s',
            }}
          >
            Generate Part Mapping &amp; Changeover Tools →
          </button>
        </div>
      )}
    </div>
  );
}
