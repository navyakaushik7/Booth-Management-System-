import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function VoterModal({ isOpen, onClose, onSave, voter, booths, schemes }) {
  const [formData, setFormData] = useState({
    voter_card_id: '', name: '', age: '', gender: 'Male', phone: '', address: '', has_voted: false, booth_id: '', scheme_id: ''
  });

  useEffect(() => {
    if (voter) {
      setFormData({ ...voter, age: voter.age || '', booth_id: voter.booth_id || '', scheme_id: voter.scheme_id || '' });
    } else {
      setFormData({ voter_card_id: `VTR-${Math.floor(10000 + Math.random() * 90000)}`, name: '', age: '', gender: 'Male', phone: '', address: '', has_voted: false, booth_id: booths[0]?.id || '', scheme_id: schemes[0]?.id || '' });
    }
  }, [voter, isOpen, booths, schemes]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, age: parseInt(formData.age, 10), booth_id: formData.booth_id ? parseInt(formData.booth_id, 10) : null, scheme_id: formData.scheme_id ? parseInt(formData.scheme_id, 10) : null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-ink-light border border-black/10 dark:border-white/10 w-full max-w-lg rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
          <h2 className="text-lg font-bold text-ink dark:text-paper">{voter ? 'Edit Voter' : 'Add Voter'}</h2>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-paper"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Voter ID</label><input type="text" required disabled={!!voter} value={formData.voter_card_id} onChange={(e) => setFormData({ ...formData, voter_card_id: e.target.value })} className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper" /></div>
            <div><label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Name</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Age</label><input type="number" required value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper" /></div>
            <div><label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Gender</label><select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper"><option>Male</option><option>Female</option></select></div>
            <div><label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Status</label><select value={formData.has_voted ? 'true' : 'false'} onChange={(e) => setFormData({ ...formData, has_voted: e.target.value === 'true' })} className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper"><option value="false">Pending</option><option value="true">Voted</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Booth</label><select value={formData.booth_id} onChange={(e) => setFormData({ ...formData, booth_id: e.target.value })} className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper"><option value="">-- None --</option>{booths.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div><label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Scheme</label><select value={formData.scheme_id} onChange={(e) => setFormData({ ...formData, scheme_id: e.target.value })} className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-ink dark:text-paper"><option value="">-- None --</option>{schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-paper">Cancel</button>
            <button type="submit" className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brass hover:bg-brass-light text-ink dark:text-paper text-xs font-semibold"><Save className="w-4 h-4" /> Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
