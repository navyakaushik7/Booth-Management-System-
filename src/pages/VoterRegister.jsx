import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Upload, Download, Loader2 } from 'lucide-react';
import { getVoters, createVoter, updateVoter, deleteVoter, bulkImportVoters } from '../lib/api';
import { exportVotersToExcel, parseVoterExcelFile } from '../utils/excelUtils';
import { getSocket } from '../lib/socket';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import FilterPanel from '../components/FilterPanel';
import VoterTable from '../components/VoterTable';
import VoterModal from '../components/VoterModal';

export default function VoterRegister() {
  const { user } = useAuth();
  const { booths, schemes, wardId, refreshBooths, refreshSchemes } = useData();
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoter, setEditingVoter] = useState(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const fetchVoters = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (wardId) params.ward_id = wardId;
      const { data } = await getVoters(params);
      setVoters(data);
    } finally {
      setLoading(false);
    }
  }, [filters, wardId]);

  useEffect(() => { fetchVoters(); }, [fetchVoters]);

  // Real-time sync: refetch (cheap for demo scale) whenever this ward's data changes elsewhere
  useEffect(() => {
    const socket = getSocket();
    const handler = () => fetchVoters();
    socket.on('voter:created', handler);
    socket.on('voter:updated', handler);
    socket.on('voter:deleted', handler);
    socket.on('voters:bulk-imported', handler);
    return () => {
      socket.off('voter:created', handler);
      socket.off('voter:updated', handler);
      socket.off('voter:deleted', handler);
      socket.off('voters:bulk-imported', handler);
    };
  }, [fetchVoters]);

  const handleSave = async (formData) => {
    if (editingVoter) {
      await updateVoter(editingVoter.id, formData);
    } else {
      await createVoter({ ...formData, ward_id: wardId });
    }
    setModalOpen(false);
    setEditingVoter(null);
    fetchVoters();
  };

  const handleDelete = async (voter) => {
    if (!window.confirm(`Delete voter "${voter.name}" (${voter.voter_card_id})? This cannot be undone.`)) return;
    await deleteVoter(voter.id);
    fetchVoters();
  };

  const handleToggleVoted = async (voter) => {
    await updateVoter(voter.id, { has_voted: !voter.has_voted });
    fetchVoters();
  };

  const handleExport = () => {
    exportVotersToExcel(voters, `voter-register-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Only non-admins are hard-locked to one ward. Admins with "All wards"
    // selected can import a whole-constituency file — each row's own
    // "Ward / Locality" column decides which ward it lands in.
    if (!wardId && user?.role !== 'admin') {
      setImportResult({ error: 'Select a specific ward from the dropdown at the top before importing.' });
      e.target.value = '';
      return;
    }
    setImportBusy(true);
    setImportResult(null);
    try {
      const rows = await parseVoterExcelFile(file);
      const { data } = await bulkImportVoters(rows, wardId || undefined);
      setImportResult(data);
      await Promise.all([fetchVoters(), refreshBooths(), refreshSchemes()]);
    } catch (err) {
      setImportResult({ error: err.response?.data?.error || 'Failed to parse or import the file. Check it matches the expected format.' });
    } finally {
      setImportBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink dark:text-paper">Voter Register</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{voters.length} voter{voters.length !== 1 ? 's' : ''} matching current filters</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
          <button
            onClick={handleImportClick}
            disabled={importBusy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:bg-white/20 text-ink dark:text-paper text-xs font-semibold disabled:opacity-60"
          >
            {importBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import Excel
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:bg-white/20 text-ink dark:text-paper text-xs font-semibold"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={() => { setEditingVoter(null); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brass hover:bg-brass-light text-ink dark:text-paper text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Add Voter
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-xs ${importResult.error ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
          {importResult.error
            ? importResult.error
            : `Imported ${importResult.importedCount} voter(s). ${importResult.skippedCount ? `Skipped ${importResult.skippedCount} (duplicates or invalid rows).` : ''}`}
        </div>
      )}

      <FilterPanel filters={filters} onChange={setFilters} booths={booths} schemes={schemes} />

      <VoterTable
        voters={voters}
        loading={loading}
        onEdit={(v) => { setEditingVoter(v); setModalOpen(true); }}
        onDelete={handleDelete}
        onToggleVoted={handleToggleVoted}
      />

      <VoterModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingVoter(null); }}
        onSave={handleSave}
        voter={editingVoter}
        booths={booths}
        schemes={schemes}
      />
    </div>
  );
}
