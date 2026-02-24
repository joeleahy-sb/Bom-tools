import { useState, useRef } from 'react';
import { T } from '../../theme';

/**
 * Drag-and-drop / click-to-upload file zone.
 *
 * Props:
 *   label    - text shown when empty
 *   fileName - name of currently loaded file (or '')
 *   rowCount - number of parsed rows (shown when loaded)
 *   onFile   - called with the selected File object
 *   accent   - if true, uses accent colour when loaded
 */
export function DropZone({ label, fileName, rowCount, onFile, accent = false }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const loaded    = !!fileName;
  const mainColor = accent ? T.accent : T.green;

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
      }}
      style={{
        background: dragging ? 'rgba(180,131,14,.06)' : T.card,
        border: `1.5px dashed ${dragging ? T.accent : loaded ? mainColor : T.border}`,
        borderRadius: 8,
        padding: 28,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 130,
        transition: 'all .2s',
        userSelect: 'none',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,.tsv"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }}
      />

      {loaded ? (
        <>
          <div style={{ fontSize: 22, marginBottom: 4, color: mainColor }}>✓</div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: mainColor,
            maxWidth: 260, textAlign: 'center', lineHeight: 1.4, wordBreak: 'break-all',
          }}>{fileName}</div>
          <div style={{ fontSize: 10, color: T.textSoft, marginTop: 4 }}>{rowCount} rows · click to replace</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 22, marginBottom: 4, color: T.textFaint }}>↑</div>
          <div style={{ fontSize: 12, fontWeight: 500, color: T.textMid }}>{label}</div>
          <div style={{ fontSize: 10, color: T.textSoft, marginTop: 2 }}>Drop CSV or click to browse</div>
        </>
      )}
    </div>
  );
}
