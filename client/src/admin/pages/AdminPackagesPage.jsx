import { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout.jsx';
import { api } from '../../api/client.js';

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [draftContent, setDraftContent] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [changeNote, setChangeNote] = useState('');
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);

  // History & Preview modals
  const [historyList, setHistoryList] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Escape closes the topmost open dialog
  useEffect(() => {
    const anyOpen = showCreateModal || historyList || previewData;
    if (!anyOpen) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (previewData) setPreviewData(null);
      else if (historyList) setHistoryList(null);
      else setShowCreateModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCreateModal, historyList, previewData]);
  const [newPkgForm, setNewPkgForm] = useState({
    code: '',
    slug: '',
    name: '',
    destination: 'Munnar',
    durationDays: 4,
    hotelCategory: '4-star',
  });

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/packages');
      setPackages(res.data.data.packages || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const openEditor = async (pkgId) => {
    setError(null);
    setSuccessMsg('');
    try {
      const res = await api.get(`/admin/packages/${pkgId}`);
      const data = res.data.data;
      setSelectedPkg(data.package);

      const active = data.draft || data.published;
      if (active) {
        setDraftContent(active.content || {});
        setSeasons(active.seasons || []);
        setRevision(data.draft ? data.draft.revision : 0);
        setChangeNote('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedPkg) return;
    setSaving(true);
    setError(null);
    setSuccessMsg('');
    try {
      const res = await api.put(`/admin/packages/${selectedPkg._id}/draft`, {
        content: draftContent,
        seasons,
        revision,
        changeNote: changeNote || 'Updated draft in CMS',
      });
      setSuccessMsg('Draft saved successfully! Ready to preview or publish.');
      setRevision(res.data.data.draft.revision);
      loadPackages();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedPkg) return;
    setSaving(true);
    setError(null);
    setSuccessMsg('');
    try {
      await api.post(`/admin/packages/${selectedPkg._id}/publish`, {
        changeNote: changeNote || 'Published via Package CMS',
      });
      setSuccessMsg('Package successfully published to the live public website!');
      loadPackages();
      openEditor(selectedPkg._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (pkgId) => {
    try {
      const res = await api.post(`/admin/packages/${pkgId}/duplicate`);
      setSuccessMsg(`Package duplicated as ${res.data.data.package.code}`);
      loadPackages();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenHistory = async (pkgId) => {
    try {
      const res = await api.get(`/admin/packages/${pkgId}`);
      setHistoryList({ pkgId, history: res.data.data.history || [] });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRestoreVersion = async (pkgId, versionId) => {
    if (!confirm('Restore this historical version as the active draft?')) return;
    try {
      await api.post(`/admin/packages/${pkgId}/restore/${versionId}`);
      setSuccessMsg('Historical version restored as the new draft!');
      setHistoryList(null);
      loadPackages();
      openEditor(pkgId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePreview = async (pkgId) => {
    try {
      const res = await api.get(`/admin/packages/${pkgId}/preview`);
      setPreviewData(res.data.data.package);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/packages', {
        code: newPkgForm.code.toUpperCase(),
        slug: newPkgForm.slug.toLowerCase(),
        content: {
          name: newPkgForm.name,
          destination: newPkgForm.destination,
          durationDays: Number(newPkgForm.durationDays),
          hotelCategory: newPkgForm.hotelCategory,
        },
      });
      setShowCreateModal(false);
      setSuccessMsg(`New package ${newPkgForm.code} created!`);
      loadPackages();
    } catch (err) {
      setError(err.message);
    }
  };

  // Itinerary helper
  const addItineraryDay = () => {
    const list = draftContent.itinerary || [];
    const nextDay = list.length + 1;
    setDraftContent({
      ...draftContent,
      itinerary: [...list, { day: nextDay, title: `Day ${nextDay} Activity`, description: '' }],
    });
  };

  const updateItineraryDay = (index, field, value) => {
    const list = [...(draftContent.itinerary || [])];
    list[index] = { ...list[index], [field]: value };
    setDraftContent({ ...draftContent, itinerary: list });
  };

  const removeItineraryDay = (index) => {
    const list = (draftContent.itinerary || []).filter((_, i) => i !== index);
    setDraftContent({ ...draftContent, itinerary: list.map((item, i) => ({ ...item, day: i + 1 })) });
  };

  // Season helper
  const addSeason = () => {
    setSeasons([
      ...seasons,
      {
        name: 'New Season',
        startDate: '2027-01-01',
        endDate: '2027-03-31',
        pricePerPerson: 25000,
        occupancyBasis: 'double',
        gstIncluded: false,
        currency: 'INR',
      },
    ]);
  };

  const updateSeason = (index, field, value) => {
    const list = [...seasons];
    list[index] = { ...list[index], [field]: value };
    setSeasons(list);
  };

  const removeSeason = (index) => {
    setSeasons(seasons.filter((_, i) => i !== index));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-medium text-charcoal">Package Management CMS</h1>
            <p className="text-xs text-muted mt-1">
              Version-controlled package catalog with seasonal pricing and immutable published snapshots.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--btn-bg)] text-[var(--btn-fg)] px-4 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-colors shadow-sm self-start sm:self-auto"
          >
            + Create New Package
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 bg-bad-soft border border-bad/30 rounded-xl text-xs text-bad flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-bad font-bold ml-4">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-ok-soft border border-ok/30 rounded-xl text-xs text-ok flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-ok font-bold ml-4">✕</button>
          </div>
        )}

        {/* Packages Table */}
        {!selectedPkg && (
          <div className="bg-card rounded-2xl shadow-sm border border-sand overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-cream border-b border-sand text-xs font-semibold text-charcoal/70 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Code / Slug</th>
                    <th className="py-3.5 px-4">Package Name</th>
                    <th className="py-3.5 px-4">Destination</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Starting Price</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/50">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-muted text-sm">
                        Loading package catalogue...
                      </td>
                    </tr>
                  ) : packages.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-muted text-sm">
                        No packages created yet.
                      </td>
                    </tr>
                  ) : (
                    packages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-cream/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold text-forest">{pkg.code}</span>
                          <span className="block text-[11px] text-muted">{pkg.slug}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-charcoal">
                          {pkg.name}
                          {pkg.isDemo && (
                            <span className="ml-2 inline-block px-1.5 py-0.2 bg-warn-soft text-warn rounded text-[10px]">
                              Demo
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-muted">{pkg.destination || '—'}</td>
                        <td className="py-3.5 px-4 text-muted">{pkg.durationDays ? `${pkg.durationDays} Days` : '—'}</td>
                        <td className="py-3.5 px-4 font-semibold text-forest">
                          {pkg.startingPrice ? `₹${pkg.startingPrice.toLocaleString('en-IN')}` : 'Price on Request'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex gap-1">
                            {pkg.isPublished && (
                              <span className="px-2 py-0.5 bg-ok-soft text-ok rounded-full text-xs font-medium">
                                v{pkg.publishedVersionNumber} Live
                              </span>
                            )}
                            {pkg.hasDraft && (
                              <span className="px-2 py-0.5 bg-warn-soft text-warn rounded-full text-xs font-medium">
                                v{pkg.draftVersionNumber} Draft
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => openEditor(pkg.id)}
                            className="text-xs bg-[var(--btn-bg)] text-[var(--btn-fg)] px-3 py-1.5 rounded-lg hover:brightness-110"
                          >
                            Edit CMS
                          </button>
                          <button
                            onClick={() => handlePreview(pkg.id)}
                            className="text-xs bg-sand/60 text-charcoal px-2.5 py-1.5 rounded-lg hover:bg-sand"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleOpenHistory(pkg.id)}
                            className="text-xs text-muted hover:text-charcoal px-2"
                          >
                            History
                          </button>
                          <button
                            onClick={() => handleDuplicate(pkg.id)}
                            className="text-xs text-olive hover:underline"
                          >
                            Duplicate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Package CMS Full Editor */}
        {selectedPkg && draftContent && (
          <div className="bg-card rounded-2xl shadow-sm border border-sand p-6 space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-sand">
              <div>
                <button
                  onClick={() => setSelectedPkg(null)}
                  className="text-xs text-muted hover:text-forest mb-1 block"
                >
                  ← Back to Catalogue
                </button>
                <h2 className="font-serif text-2xl font-medium text-charcoal">
                  Editing: {draftContent.name || 'Untitled Package'}
                </h2>
                <div className="flex items-center gap-3 text-xs text-muted mt-1">
                  <span>Code: <strong>{selectedPkg.code}</strong></span>
                  <span>·</span>
                  <span>Slug: <strong>{selectedPkg.slug}</strong></span>
                  <span>·</span>
                  <span>Draft Revision: <strong>{revision}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePreview(selectedPkg._id)}
                  className="px-4 py-2 border border-sand rounded-xl text-xs font-semibold text-charcoal hover:bg-cream"
                >
                  Preview Draft
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-4 py-2 bg-sand/60 hover:bg-sand text-charcoal rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={handlePublish}
                  disabled={saving}
                  className="px-5 py-2 bg-forest hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  Publish Package
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-charcoal uppercase tracking-wider">1. Core Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">Package Name</label>
                  <input
                    type="text"
                    value={draftContent.name || ''}
                    onChange={(e) => setDraftContent({ ...draftContent, name: e.target.value })}
                    className="field !py-2 !px-3 outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">Destination</label>
                  <input
                    type="text"
                    value={draftContent.destination || ''}
                    onChange={(e) => setDraftContent({ ...draftContent, destination: e.target.value })}
                    className="field !py-2 !px-3 outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">Hotel Category</label>
                  <select
                    value={draftContent.hotelCategory || '4-star'}
                    onChange={(e) => setDraftContent({ ...draftContent, hotelCategory: e.target.value })}
                    className="field !py-2 !px-3 outline-none focus:border-gold bg-card"
                  >
                    <option value="3-star">3 Star</option>
                    <option value="4-star">4 Star</option>
                    <option value="5-star">5 Star</option>
                    <option value="homestay">Homestay</option>
                    <option value="mixed">Mixed / Deluxe Houseboat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={draftContent.durationDays || 1}
                    onChange={(e) => setDraftContent({ ...draftContent, durationDays: Number(e.target.value), nights: Math.max(0, Number(e.target.value) - 1) })}
                    className="field !py-2 !px-3 outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">Nights</label>
                  <input
                    type="number"
                    value={draftContent.nights || 0}
                    onChange={(e) => setDraftContent({ ...draftContent, nights: Number(e.target.value) })}
                    className="field !py-2 !px-3 outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">Hero Image URL</label>
                  <input
                    type="text"
                    value={draftContent.heroImage?.url || ''}
                    onChange={(e) => setDraftContent({ ...draftContent, heroImage: { ...draftContent.heroImage, url: e.target.value } })}
                    className="field !py-2 !px-3 outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Summary (1-2 sentences)</label>
                <textarea
                  rows="2"
                  value={draftContent.summary || ''}
                  onChange={(e) => setDraftContent({ ...draftContent, summary: e.target.value })}
                  className="field !py-2 !px-3 outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Full Description</label>
                <textarea
                  rows="4"
                  value={draftContent.description || ''}
                  onChange={(e) => setDraftContent({ ...draftContent, description: e.target.value })}
                  className="field !py-2 !px-3 outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Seasonal Pricing Engine Table */}
            <div className="space-y-4 pt-4 border-t border-sand">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-charcoal uppercase tracking-wider">
                    2. Seasonal Pricing Engine
                  </h3>
                  <p className="text-xs text-muted">
                    Non-overlapping calendar dates. Prices stored in integer rupees. Twin-sharing adult basis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSeason}
                  className="px-3 py-1.5 bg-olive text-white rounded-lg text-xs font-medium hover:brightness-110"
                >
                  + Add Season
                </button>
              </div>

              {seasons.length === 0 ? (
                <div className="p-4 bg-cream border border-dashed border-sand rounded-xl text-center text-xs text-muted">
                  No seasons configured. Package will be listed as <strong>"Price on Request"</strong>.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-cream text-xs font-semibold text-charcoal/70">
                      <tr>
                        <th className="p-2.5">Season Name</th>
                        <th className="p-2.5">Start Date</th>
                        <th className="p-2.5">End Date</th>
                        <th className="p-2.5">Price / Person (₹)</th>
                        <th className="p-2.5">Occupancy</th>
                        <th className="p-2.5">GST Included</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand/40">
                      {seasons.map((s, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <input
                              type="text"
                              value={s.name || ''}
                              onChange={(e) => updateSeason(idx, 'name', e.target.value)}
                              placeholder="e.g. Peak Season"
                              className="px-2 py-1 text-xs border border-sand rounded w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={s.startDate ? s.startDate.split('T')[0] : ''}
                              onChange={(e) => updateSeason(idx, 'startDate', e.target.value)}
                              className="px-2 py-1 text-xs border border-sand rounded"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={s.endDate ? s.endDate.split('T')[0] : ''}
                              onChange={(e) => updateSeason(idx, 'endDate', e.target.value)}
                              className="px-2 py-1 text-xs border border-sand rounded"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={s.pricePerPerson ?? ''}
                              onChange={(e) => updateSeason(idx, 'pricePerPerson', Number(e.target.value))}
                              placeholder="32500"
                              className="px-2 py-1 text-xs border border-sand rounded w-28 font-mono font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={s.occupancyBasis || 'double'}
                              onChange={(e) => updateSeason(idx, 'occupancyBasis', e.target.value)}
                              className="px-2 py-1 text-xs border border-sand rounded bg-card"
                            >
                              <option value="single">Single</option>
                              <option value="double">Double (Twin-sharing)</option>
                              <option value="triple">Triple</option>
                              <option value="family">Family</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(s.gstIncluded)}
                              onChange={(e) => updateSeason(idx, 'gstIncluded', e.target.checked)}
                              className="w-4 h-4 text-forest"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeSeason(idx)}
                              className="text-xs text-bad hover:opacity-75"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Day-by-Day Itinerary */}
            <div className="space-y-4 pt-4 border-t border-sand">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-charcoal uppercase tracking-wider">
                    3. Day-by-Day Itinerary
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addItineraryDay}
                  className="px-3 py-1.5 bg-[var(--btn-bg)] text-[var(--btn-fg)] rounded-lg text-xs font-medium hover:brightness-110"
                >
                  + Add Day
                </button>
              </div>

              {(draftContent.itinerary || []).map((day, idx) => (
                <div key={idx} className="p-3 bg-cream border border-sand rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-forest">Day {day.day}</span>
                    <button
                      type="button"
                      onClick={() => removeItineraryDay(idx)}
                      className="text-xs text-bad hover:opacity-75"
                    >
                      Delete Day
                    </button>
                  </div>
                  <input
                    type="text"
                    value={day.title || ''}
                    onChange={(e) => updateItineraryDay(idx, 'title', e.target.value)}
                    placeholder="Day title (e.g. Arrive in Munnar, visit tea factory)"
                    className="w-full px-3 py-1.5 text-xs border border-sand rounded-lg"
                  />
                  <textarea
                    rows="2"
                    value={day.description || ''}
                    onChange={(e) => updateItineraryDay(idx, 'description', e.target.value)}
                    placeholder="Detailed day activity description..."
                    className="w-full px-3 py-1.5 text-xs border border-sand rounded-lg"
                  />
                </div>
              ))}
            </div>

            {/* Change Note */}
            <div className="pt-4 border-t border-sand">
              <label className="block text-xs font-medium text-charcoal mb-1">
                Version Change Note (Recorded in Audit Trail)
              </label>
              <input
                type="text"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="e.g. Updated peak season pricing and hotel itinerary"
                className="field !py-2 !px-3"
              />
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fade-in fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
            <div role="dialog" aria-modal="true" aria-label="Create new package" className="pop-in bg-card border border-sand shadow-[var(--shadow-lg)] rounded-[1.5rem] max-w-md w-full p-6 space-y-4">
              <h2 className="font-serif text-xl font-medium text-charcoal">Create New Package</h2>
              <form onSubmit={handleCreatePackage} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Package Code (PKG-XX-00)</label>
                  <input
                    type="text"
                    required
                    placeholder="PKG-KL-09"
                    value={newPkgForm.code}
                    onChange={(e) => setNewPkgForm({ ...newPkgForm, code: e.target.value })}
                    className="field !py-2 !px-3 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="wayanad-rainforest-escape"
                    value={newPkgForm.slug}
                    onChange={(e) => setNewPkgForm({ ...newPkgForm, slug: e.target.value })}
                    className="field !py-2 !px-3 lowercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Package Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Wayanad Rainforest & Treehouse Escape"
                    value={newPkgForm.name}
                    onChange={(e) => setNewPkgForm({ ...newPkgForm, name: e.target.value })}
                    className="field !py-2 !px-3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">Destination</label>
                    <input
                      type="text"
                      value={newPkgForm.destination}
                      onChange={(e) => setNewPkgForm({ ...newPkgForm, destination: e.target.value })}
                      className="field !py-2 !px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">Days</label>
                    <input
                      type="number"
                      value={newPkgForm.durationDays}
                      onChange={(e) => setNewPkgForm({ ...newPkgForm, durationDays: e.target.value })}
                      className="field !py-2 !px-3"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 border border-sand rounded-xl text-xs font-semibold text-charcoal"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[var(--btn-bg)] text-[var(--btn-fg)] rounded-xl text-xs font-semibold hover:brightness-110"
                  >
                    Create Package
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Modal */}
        {historyList && (
          <div className="fade-in fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setHistoryList(null)}>
            <div role="dialog" aria-modal="true" aria-label="Version history" className="pop-in bg-card border border-sand shadow-[var(--shadow-lg)] rounded-[1.5rem] max-w-xl w-full p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-lg font-medium text-charcoal">Version History</h3>
                <button onClick={() => setHistoryList(null)} className="text-muted hover:text-charcoal font-bold">✕</button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {historyList.history.map((v) => (
                  <div key={v._id} className="p-3 bg-cream border border-sand rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">Version {v.versionNumber}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${v.status === 'published' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'}`}>
                          {v.status}
                        </span>
                        {v.restoredFromVersionId && (
                          <span className="text-[10px] text-muted">(Restored)</span>
                        )}
                      </div>
                      <p className="text-xs text-charcoal/80 mt-1">{v.changeNote || 'No change note recorded'}</p>
                      <p className="text-[10px] text-muted mt-0.5">{new Date(v.createdAt).toLocaleString('en-IN')}</p>
                    </div>

                    <button
                      onClick={() => handleRestoreVersion(historyList.pkgId, v._id)}
                      className="px-3 py-1.5 bg-olive text-white rounded-lg text-xs font-medium hover:brightness-110 whitespace-nowrap ml-4"
                    >
                      Restore as New Draft
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewData && (
          <div className="fade-in fixed inset-0 bg-black/70 z-[70] flex items-start sm:items-center justify-center p-4 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && setPreviewData(null)}>
            <div role="dialog" aria-modal="true" aria-label="Draft preview" className="pop-in bg-card border border-sand shadow-[var(--shadow-lg)] rounded-[1.5rem] max-w-3xl w-full p-6 space-y-4 my-8">
              <div className="flex justify-between items-center pb-2 border-b border-sand">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-warn bg-warn-soft border border-warn/30 px-2 py-0.5 rounded-full">
                    CMS Draft Preview (Not Public)
                  </span>
                  <h3 className="font-serif text-2xl font-medium text-charcoal mt-1">{previewData.name}</h3>
                </div>
                <button onClick={() => setPreviewData(null)} className="text-muted hover:text-charcoal font-bold text-lg">✕</button>
              </div>

              <div className="text-xs text-muted flex gap-4">
                <span>📍 {previewData.destination}</span>
                <span>⏱ {previewData.durationDays} Days / {previewData.nights} Nights</span>
                <span>🏨 {previewData.hotelCategory}</span>
              </div>

              <p className="text-sm text-charcoal/80">{previewData.description || previewData.summary}</p>

              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider text-forest mb-2">Authoritative Pricing</h4>
                <div className="p-3 bg-[var(--btn-bg)] text-[var(--btn-fg)] rounded-xl inline-block">
                  <div className="text-[10px] text-white/70 uppercase">Starting From</div>
                  <div className="font-serif text-2xl font-bold">
                    {previewData.startingPrice ? `₹${previewData.startingPrice.toLocaleString('en-IN')}` : 'Price on Request'}
                  </div>
                  <div className="text-[10px] text-white/70">per person (twin-sharing basis)</div>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-charcoal mb-2">Itinerary</h4>
                <div className="space-y-2">
                  {(previewData.itinerary || []).map((day) => (
                    <div key={day.day} className="p-2.5 bg-cream border border-sand rounded-lg text-xs">
                      <strong>Day {day.day}: {day.title}</strong>
                      <p className="text-muted mt-0.5">{day.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-right pt-4 border-t">
                <button
                  onClick={() => setPreviewData(null)}
                  className="px-5 py-2 bg-[var(--btn-bg)] text-[var(--btn-fg)] rounded-xl text-xs font-semibold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

