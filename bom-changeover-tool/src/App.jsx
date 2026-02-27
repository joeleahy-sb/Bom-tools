import { useState, useEffect, useCallback, useMemo } from 'react';
import { T } from './theme';
import { readBOMFile, parseBOMSections } from './utils/bomParser';
import { diffBOMs } from './utils/bomDiff';
import { exportMappingCSV } from './utils/bomExport';
import { partKey } from './hooks/useValidation';
import { useFirestore } from './hooks/useFirestore';
import { useAuth }     from './hooks/useAuth';

import { LoginScreen }         from './components/LoginScreen';
import { Header }              from './components/common/Header';
import { TabNav }              from './components/common/TabNav';
import { UploadView }          from './components/UploadView';
import { MappingTab }          from './components/MappingTab';
import { ValidationTab }       from './components/ValidationTab';
import { ChangeoverChecklist } from './components/ChangeoverChecklist';
import { LabelsTab }           from './components/LabelsTab';
import { SourcingTab }         from './components/SourcingTab';

const EMPTY_META = { product: '', oldRev: '', newRev: '', date: '' };

export default function App() {
  const [oldRows,       setOldRows]       = useState([]);
  const [newRows,       setNewRows]       = useState([]);
  const [oldFileName,   setOldFileName]   = useState('');
  const [newFileName,   setNewFileName]   = useState('');
  const [metadata,      setMetadata]      = useState(EMPTY_META);
  const [hasResults,    setHasResults]    = useState(false);
  const [activeTab,     setActiveTab]     = useState('mapping');
  const [checks,        setChecks]        = useState({});
  const [flags,         setFlags]         = useState({});
  const [notes,         setNotes]         = useState({});
  const [missingParts,  setMissingParts]  = useState({});
  const [mappingEdits,  setMappingEdits]  = useState({});
  const [phaseChecks,       setPhaseChecks]       = useState({});
  const [showClearConfirm,  setShowClearConfirm]  = useState(false);

  const { user, login, logout, authError, loading: authLoading } = useAuth();
  const { subscribe, save, clear, loading, saving } = useFirestore();

  const diff = useMemo(
    () => (hasResults && oldRows.length && newRows.length ? diffBOMs(oldRows, newRows) : null),
    [oldRows, newRows, hasResults]
  );
  const newSections = useMemo(
    () => (newRows.length ? parseBOMSections(newRows) : []),
    [newRows]
  );

  // Real-time sync — only subscribes after auth has resolved so Firestore
  // has a valid token. Fires once on sign-in, then on every remote save.
  useEffect(() => {
    if (!user) return; // wait for auth before touching Firestore
    const unsub = subscribe((data) => {
      if (data.oldRows)                setOldRows(data.oldRows);
      if (data.newRows)                setNewRows(data.newRows);
      if (data.oldFileName)            setOldFileName(data.oldFileName);
      if (data.newFileName)            setNewFileName(data.newFileName);
      if (data.metadata)               setMetadata(data.metadata);
      if (data.mappingEdits)           setMappingEdits(data.mappingEdits);
      if (data.checks)                 setChecks(data.checks);
      if (data.flags)                  setFlags(data.flags);
      if (data.notes)                  setNotes(data.notes);
      if (data.missingParts)           setMissingParts(data.missingParts);
      if (data.phaseChecks)            setPhaseChecks(data.phaseChecks);
      if (data.hasResults !== undefined) setHasResults(data.hasResults);
    });
    return unsub;
  }, [user, subscribe]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistState = useCallback((patch = {}) => {
    save({
      oldRows, newRows, oldFileName, newFileName,
      metadata, mappingEdits, checks, flags, notes,
      missingParts, phaseChecks, hasResults,
      ...patch,
    });
  }, [oldRows, newRows, oldFileName, newFileName, metadata, mappingEdits, checks, flags, notes, missingParts, phaseChecks, hasResults, save]);
  const handleOldFile = useCallback(async (file) => {
    try {
      const rows = await readBOMFile(file);
      setOldRows(rows);
      setOldFileName(file.name);
      const rm = file.name.match(/Rev[_ ]([A-Z][._ ]d)/i);
      if (rm) setMetadata(m => ({ ...m, oldRev: rm[1] }));
    } catch {
      alert('Could not parse ' + file.name + '. Ensure it is a CSV/TSV with Part Number and Description columns.');
    }
  }, []);

  const handleNewFile = useCallback(async (file) => {
    try {
      const rows = await readBOMFile(file);
      setNewRows(rows);
      setNewFileName(file.name);
      const rm = file.name.match(/Rev[_ ]([A-Z][._ ]d)/i);
      if (rm) setMetadata(m => ({ ...m, newRev: rm[1] }));
    } catch {
      alert('Could not parse ' + file.name + '. Ensure it is a CSV/TSV with Part Number and Description columns.');
    }
  }, []);

  const handleRun = useCallback(() => {
    const d = diffBOMs(oldRows, newRows);
    const edits = {};
    [...d.changed.map(i => i.newFullPN), ...d.added.map(i => i.fullPN),
     ...d.removed.map(i => i.fullPN), ...d.qtyChanged.map(i => i.fullPN),
     ...d.moved.map(i => i.fullPN),
    ].forEach(k => { edits[k] = { fwd: '', bwd: '', just: '', alt: '', status: 'needs_review' }; });
    setMappingEdits(edits);
    setChecks({}); setFlags({}); setNotes({});
    setMissingParts({}); setPhaseChecks({});
    setHasResults(true);
    persistState({ mappingEdits: edits, checks: {}, flags: {}, notes: {},
      missingParts: {}, phaseChecks: {}, hasResults: true,
      oldRows, newRows, oldFileName, newFileName, metadata });
  }, [oldRows, newRows, oldFileName, newFileName, metadata, persistState]);

  const handleMappingUpdate = useCallback((key, field, value) => {
    setMappingEdits(prev => {
      const next = { ...prev, [key]: { ...prev[key], [field]: value } };
      persistState({ mappingEdits: next });
      return next;
    });
  }, [persistState]);

  const handleToggleCheck = useCallback((sectionName, idx) => {
    const key = partKey(sectionName, idx);
    setChecks(prev => { const next = { ...prev, [key]: !prev[key] }; persistState({ checks: next }); return next; });
  }, [persistState]);

  const handleToggleFlag = useCallback((sectionName, idx) => {
    const key = partKey(sectionName, idx);
    setFlags(prev => {
      const next = { ...prev, [key]: prev[key] === 'not_needed' ? null : 'not_needed' };
      persistState({ flags: next }); return next;
    });
  }, [persistState]);

  const handleSetNote = useCallback((sectionName, idx, val) => {
    const key = partKey(sectionName, idx);
    setNotes(prev => {
      const next = val ? { ...prev, [key]: val } : (() => { const n = { ...prev }; delete n[key]; return n; })();
      persistState({ notes: next }); return next;
    });
  }, [persistState]);

  const handleAddMissing = useCallback((sectionName, part) => {
    setMissingParts(prev => {
      const next = { ...prev, [sectionName]: [...(prev[sectionName] || []), { ...part, id: Date.now() }] };
      persistState({ missingParts: next }); return next;
    });
  }, [persistState]);

  const handleRemoveMissing = useCallback((sectionName, id) => {
    setMissingParts(prev => {
      const next = { ...prev, [sectionName]: (prev[sectionName] || []).filter(x => x.id !== id) };
      persistState({ missingParts: next }); return next;
    });
  }, [persistState]);

  const handlePhaseToggle = useCallback((itemId) => {
    setPhaseChecks(prev => { const next = { ...prev, [itemId]: !prev[itemId] }; persistState({ phaseChecks: next }); return next; });
  }, [persistState]);

  const handleClearProject = useCallback(async () => {
    setOldRows([]); setNewRows([]);
    setOldFileName(''); setNewFileName('');
    setMetadata(EMPTY_META);
    setMappingEdits({}); setChecks({}); setFlags({});
    setNotes({}); setMissingParts({}); setPhaseChecks({});
    setHasResults(false);
    setShowClearConfirm(false);
    await clear();
  }, [clear]);
  const tabs = diff ? [
    { id: 'mapping',    label: 'Part Mapping',         badge: diff.changed.length + diff.added.length + diff.removed.length },
    { id: 'validation', label: 'Build Validation',     badge: newSections.reduce((s, sec) => s + sec.parts.length, 0) },
    { id: 'checklist',  label: 'Changeover Checklist' },
    { id: 'labels',     label: 'Labels & Alternates' },
    { id: 'sourcing',   label: 'Sourcing Impact' },
  ] : [];

  if (authLoading) {
    return <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSoft, fontSize: 13 }}>Loading…</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={login} error={authError} />;
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh' }}>
      <Header saving={saving} metadata={metadata} oldFileName={oldFileName} newFileName={newFileName} user={user} onLogout={logout} />

      {showClearConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: '28px 32px', maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>Clear project?</div>
            <div style={{ fontSize: 12, color: T.textMid, marginBottom: 24, lineHeight: 1.6 }}>
              This will permanently delete all uploaded BOMs, mapping reviews, validation progress, and checklist state for all users. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{ background: 'none', border: '1px solid ' + T.border, borderRadius: 6, color: T.textMid, padding: '7px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
              >Cancel</button>
              <button
                onClick={handleClearProject}
                style={{ background: T.red, border: 'none', borderRadius: 6, color: '#fff', padding: '7px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >Yes, clear everything</button>
            </div>
          </div>
        </div>
      )}
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: T.textSoft, fontSize: 13 }}>Loading...</div>
        )}

        {!loading && !hasResults && (
          <UploadView
            oldFileName={oldFileName} newFileName={newFileName}
            oldRows={oldRows} newRows={newRows} metadata={metadata}
            onOldFile={handleOldFile} onNewFile={handleNewFile}
            onMetaChange={(k, v) => setMetadata(m => ({ ...m, [k]: v }))}
            onRun={handleRun}
            onResume={() => setHasResults(true)}
          />
        )}

        {!loading && hasResults && diff && (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <button
                    onClick={() => setHasResults(false)}
                    style={{ background: 'none', border: '1px solid ' + T.border, borderRadius: 5, color: T.textMid, padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}
                  >Back to Upload</button>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 5, color: T.red, padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}
                  >Clear Project</button>
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: T.text }}>
                  {metadata.product || 'BOM'}: {metadata.oldRev || '?'} to {metadata.newRev || '?'}
                </h1>
                {metadata.date && <div style={{ fontSize: 11, color: T.accent, marginTop: 2 }}>Target: {metadata.date}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
                {[
                  { label: 'Added',       n: diff.added.length,      color: T.green  },
                  { label: 'Removed',     n: diff.removed.length,    color: T.red    },
                  { label: 'Rev Changed', n: diff.changed.length,    color: T.orange },
                  { label: 'Qty Changed', n: diff.qtyChanged.length, color: T.blue   },
                  { label: 'Moved',       n: diff.moved.length,      color: T.purple },
                ].map(({ label, n, color }) => (
                  <div key={label} style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 6, padding: '8px 10px', borderTop: '3px solid ' + color, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color }}>{n}</div>
                    <div style={{ fontSize: 9, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button
                onClick={() => exportMappingCSV(diff, mappingEdits, metadata)}
                style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 6, color: T.text, padding: '7px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >Export Mapping CSV</button>
            </div>

            <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'mapping'    && <MappingTab diff={diff} mappingEdits={mappingEdits} onUpdate={handleMappingUpdate} />}
            {activeTab === 'validation' && (
              <ValidationTab
                sections={newSections} checks={checks} flags={flags} notes={notes} missingParts={missingParts}
                onToggleCheck={handleToggleCheck} onToggleFlag={handleToggleFlag} onSetNote={handleSetNote}
                onAddMissing={handleAddMissing} onRemoveMissing={handleRemoveMissing}
              />
            )}
            {activeTab === 'checklist' && <ChangeoverChecklist diff={diff} metadata={metadata} phaseChecks={phaseChecks} onToggle={handlePhaseToggle} />}
            {activeTab === 'labels'    && <LabelsTab diff={diff} mappingEdits={mappingEdits} />}
            {activeTab === 'sourcing'  && <SourcingTab diff={diff} />}
          </>
        )}
      </main>
    </div>
  );
}
