import { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout.jsx';
import { api } from '../../api/client.js';

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Selected enquiry details
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [enquiryDetail, setEnquiryDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Draft reply & Note states
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  // Edit AI extraction state
  const [editingExtraction, setEditingExtraction] = useState(false);
  const [extractedForm, setExtractedForm] = useState({
    adults: 2,
    children: 0,
    destination: '',
    nightsMin: 5,
    nightsMax: 6,
    budgetInr: '',
  });

  const loadEnquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (searchQuery) params.set('q', searchQuery);
      if (assigneeFilter) params.set('assignedTo', assigneeFilter);

      const res = await api.get(`/admin/enquiries?${params.toString()}`);
      const list = res.data.data.enquiries || [];
      setEnquiries(list);
      if (list.length > 0 && !selectedEnquiryId) {
        setSelectedEnquiryId(list[0].id);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data.users || []);
    } catch {
      // non-blocking
    }
  };

  const loadEnquiryDetail = async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await api.get(`/admin/enquiries/${id}`);
      const data = res.data.data.enquiry;
      setEnquiryDetail(data);

      // Pre-fill reply text from AI draft if available
      setReplyText(data.ai?.replyDraft || '');

      // Pre-fill extraction form
      const ext = data.extracted?.staffCorrected || data.extracted?.ai || {};
      setExtractedForm({
        adults: ext.adults || 2,
        children: ext.children || 0,
        destination: ext.destination || data.destination || '',
        nightsMin: ext.nightsMin || 4,
        nightsMax: ext.nightsMax || 6,
        budgetInr: ext.budgetInr || data.budget?.amount || '',
      });
      setEditingExtraction(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadEnquiries();
  }, [statusFilter, searchQuery, assigneeFilter]);

  useEffect(() => {
    if (selectedEnquiryId) {
      loadEnquiryDetail(selectedEnquiryId);
    }
  }, [selectedEnquiryId]);

  // Consultant Actions
  const handleStatusChange = async (newStatus) => {
    if (!selectedEnquiryId) return;
    try {
      await api.patch(`/admin/enquiries/${selectedEnquiryId}/status`, { status: newStatus });
      setSuccessMsg(`Status updated to ${newStatus}`);
      loadEnquiries();
      loadEnquiryDetail(selectedEnquiryId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignChange = async (userId) => {
    if (!selectedEnquiryId) return;
    try {
      await api.patch(`/admin/enquiries/${selectedEnquiryId}/assign`, { assignedTo: userId || null });
      setSuccessMsg('Consultant assigned successfully');
      loadEnquiries();
      loadEnquiryDetail(selectedEnquiryId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveExtraction = async () => {
    if (!selectedEnquiryId) return;
    try {
      await api.patch(`/admin/enquiries/${selectedEnquiryId}/extracted`, {
        extracted: {
          ...extractedForm,
          adults: Number(extractedForm.adults),
          children: Number(extractedForm.children),
          nightsMin: Number(extractedForm.nightsMin),
          nightsMax: Number(extractedForm.nightsMax),
          budgetInr: extractedForm.budgetInr ? Number(extractedForm.budgetInr) : null,
        },
      });
      setSuccessMsg('AI extraction corrected and saved!');
      setEditingExtraction(false);
      loadEnquiryDetail(selectedEnquiryId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedEnquiryId) return;
    setActionInProgress(true);
    try {
      await api.post(`/admin/enquiries/${selectedEnquiryId}/notes`, { body: noteText });
      setNoteText('');
      setSuccessMsg('Internal note recorded.');
      loadEnquiryDetail(selectedEnquiryId);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleApproveReply = async () => {
    if (!replyText.trim() || !selectedEnquiryId) return;
    if (!confirm('Approve and send this reply to the traveller?')) return;
    setActionInProgress(true);
    try {
      await api.post(`/admin/enquiries/${selectedEnquiryId}/reply`, { body: replyText });
      setSuccessMsg('Reply approved and dispatched! Enquiry marked as contacted.');
      loadEnquiries();
      loadEnquiryDetail(selectedEnquiryId);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-medium text-charcoal">Enquiry Inbox &amp; AI Assistant</h1>
            <p className="text-xs text-muted mt-1">
              Centralized traveller enquiries, AI-assisted extraction, package matching, and human-in-the-loop approvals.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-ok-soft0 inline-block animate-pulse"></span>
            <span className="text-muted">Target SLA: 90% answered within 1 hour</span>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3 bg-bad-soft border border-bad/30 rounded-xl text-xs text-bad flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold ml-4">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-ok-soft border border-ok/30 rounded-xl text-xs text-ok flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="font-bold ml-4">✕</button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-card p-4 rounded-2xl shadow-sm border border-sand flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {['', 'new', 'contacted', 'quoted', 'won', 'lost'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === st ? 'bg-[var(--btn-bg)] text-[var(--btn-fg)]' : 'bg-sand/60 text-charcoal hover:bg-sand'
                }`}
              >
                {st || 'All Enquiries'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search reference, customer, destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs border border-sand rounded-xl outline-none focus:border-gold w-full sm:w-60 bg-cream"
            />
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-sand rounded-xl bg-cream outline-none"
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Split Screen Inbox Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Enquiries List (5 cols) */}
          <div className="lg:col-span-5 bg-card rounded-2xl shadow-sm border border-sand divide-y divide-sand/50 max-h-[800px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted text-xs">Loading enquiries...</div>
            ) : enquiries.length === 0 ? (
              <div className="p-8 text-center text-muted text-xs">No matching enquiries found.</div>
            ) : (
              enquiries.map((enq) => {
                const isSelected = enq.id === selectedEnquiryId;
                return (
                  <div
                    key={enq.id}
                    onClick={() => setSelectedEnquiryId(enq.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-gold/10 border-l-4 border-l-gold' : 'hover:bg-cream'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-forest">{enq.reference}</span>
                      <div className="flex gap-1.5 items-center">
                        {enq.isOverdue && (
                          <span className="bg-bad-soft text-bad text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                            Overdue (&gt;1h)
                          </span>
                        )}
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          enq.status === 'new' ? 'bg-info-soft text-info' :
                          enq.status === 'contacted' ? 'bg-warn-soft text-warn' :
                          enq.status === 'quoted' ? 'bg-violet-soft text-violet' :
                          enq.status === 'won' ? 'bg-ok-soft text-ok' : 'bg-sand text-charcoal'
                        }`}>
                          {enq.status}
                        </span>
                      </div>
                    </div>

                    <p className="font-semibold text-sm text-charcoal">{enq.customer?.name}</p>
                    <p className="text-xs text-muted">
                      {enq.destination || 'Kerala'} · {enq.adults} adults {enq.children ? `, ${enq.children} kid` : ''}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-muted mt-2 pt-2 border-t border-sand">
                      <span>👤 {enq.assignedTo ? enq.assignedTo.name : 'Unassigned'}</span>
                      <span>{new Date(enq.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detail, AI Extraction & Approval (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {loadingDetail ? (
              <div className="bg-card rounded-2xl shadow-sm border border-sand p-12 text-center text-xs text-muted">
                Loading enquiry details...
              </div>
            ) : !enquiryDetail ? (
              <div className="bg-card rounded-2xl shadow-sm border border-sand p-12 text-center text-xs text-muted">
                Select an enquiry from the left list to review AI recommendations and approve responses.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Contact Card & Meta */}
                <div className="bg-card rounded-2xl shadow-sm border border-sand p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-sand">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-serif text-2xl font-bold text-forest">{enquiryDetail.customer?.name}</h2>
                        {enquiryDetail.whatsappConsent ? (
                          <span className="text-[10px] bg-ok-soft text-ok px-2 py-0.5 rounded-full font-medium">
                            ✓ WhatsApp Consent Given
                          </span>
                        ) : (
                          <span className="text-[10px] bg-sand/60 text-muted px-2 py-0.5 rounded-full font-medium">
                            No WhatsApp Consent
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted mt-1 space-x-3">
                        <span>✉ {enquiryDetail.customer?.email}</span>
                        <span>📞 {enquiryDetail.customer?.phone}</span>
                      </div>
                    </div>

                    {/* Status & Assignee controls */}
                    <div className="flex gap-2 items-center">
                      <select
                        value={enquiryDetail.assignedTo?._id || ''}
                        onChange={(e) => handleAssignChange(e.target.value)}
                        className="px-2.5 py-1.5 text-xs border border-sand rounded-xl bg-cream font-medium"
                      >
                        <option value="">Assign Consultant...</option>
                        {users.map((u) => (
                          <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                      </select>

                      <select
                        value={enquiryDetail.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="px-2.5 py-1.5 text-xs border border-sand rounded-xl font-bold bg-cream uppercase"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="quoted">Quoted</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                  </div>

                  {/* Original Traveller Message */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                      Original Traveller Message (Immutable)
                    </h3>
                    <div className="p-3 bg-cream rounded-xl text-xs text-charcoal/90 leading-relaxed font-sans border border-sand">
                      "{enquiryDetail.message}"
                    </div>
                  </div>
                </div>

                {/* AI Assistant Extraction & Review */}
                <div className="bg-card rounded-2xl shadow-sm border border-sand p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-sand">
                    <div className="flex items-center gap-2">
                      <span className="text-base">✨</span>
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-forest">
                        AI-Assisted Requirements Extraction
                      </h3>
                      {enquiryDetail.extracted?.reviewedBy && (
                        <span className="text-[10px] bg-ok-soft text-ok px-2 py-0.5 rounded-full border border-ok/30">
                          Reviewed by Consultant
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingExtraction(!editingExtraction)}
                      className="text-xs text-olive hover:underline font-medium"
                    >
                      {editingExtraction ? 'Cancel' : 'Edit Extraction'}
                    </button>
                  </div>

                  {!editingExtraction ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 bg-cream rounded-xl">
                        <span className="text-[10px] text-muted block uppercase">Destination</span>
                        <strong className="text-charcoal">{enquiryDetail.extracted?.staffCorrected?.destination || enquiryDetail.extracted?.ai?.destination || 'Kerala'}</strong>
                      </div>
                      <div className="p-2.5 bg-cream rounded-xl">
                        <span className="text-[10px] text-muted block uppercase">Party Size</span>
                        <strong className="text-charcoal">
                          {(enquiryDetail.extracted?.staffCorrected?.adults ?? enquiryDetail.extracted?.ai?.adults) || enquiryDetail.adults} Adults
                          {enquiryDetail.extracted?.ai?.children ? `, ${enquiryDetail.extracted.ai.children} Kids` : ''}
                        </strong>
                      </div>
                      <div className="p-2.5 bg-cream rounded-xl">
                        <span className="text-[10px] text-muted block uppercase">Duration</span>
                        <strong className="text-charcoal">
                          {enquiryDetail.extracted?.ai?.nightsMin || 5}–{enquiryDetail.extracted?.ai?.nightsMax || 6} Nights
                        </strong>
                      </div>
                      <div className="p-2.5 bg-cream rounded-xl">
                        <span className="text-[10px] text-muted block uppercase">Total Budget</span>
                        <strong className="text-forest">
                          {enquiryDetail.extracted?.ai?.budgetInr ? `₹${enquiryDetail.extracted.ai.budgetInr.toLocaleString('en-IN')}` : 'Not Specified'}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-muted uppercase">Destination</label>
                          <input
                            type="text"
                            value={extractedForm.destination}
                            onChange={(e) => setExtractedForm({ ...extractedForm, destination: e.target.value })}
                            className="w-full px-2 py-1 text-xs border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-muted uppercase">Adults</label>
                          <input
                            type="number"
                            value={extractedForm.adults}
                            onChange={(e) => setExtractedForm({ ...extractedForm, adults: e.target.value })}
                            className="w-full px-2 py-1 text-xs border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-muted uppercase">Children</label>
                          <input
                            type="number"
                            value={extractedForm.children}
                            onChange={(e) => setExtractedForm({ ...extractedForm, children: e.target.value })}
                            className="w-full px-2 py-1 text-xs border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-muted uppercase">Nights (Min)</label>
                          <input
                            type="number"
                            value={extractedForm.nightsMin}
                            onChange={(e) => setExtractedForm({ ...extractedForm, nightsMin: e.target.value })}
                            className="w-full px-2 py-1 text-xs border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-muted uppercase">Nights (Max)</label>
                          <input
                            type="number"
                            value={extractedForm.nightsMax}
                            onChange={(e) => setExtractedForm({ ...extractedForm, nightsMax: e.target.value })}
                            className="w-full px-2 py-1 text-xs border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-muted uppercase">Budget (INR)</label>
                          <input
                            type="number"
                            value={extractedForm.budgetInr}
                            onChange={(e) => setExtractedForm({ ...extractedForm, budgetInr: e.target.value })}
                            className="w-full px-2 py-1 text-xs border rounded"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveExtraction}
                        className="px-3 py-1.5 bg-[var(--btn-bg)] text-[var(--btn-fg)] text-xs rounded-lg font-semibold"
                      >
                        Save Staff Correction
                      </button>
                    </div>
                  )}

                  {/* Must-Haves */}
                  {enquiryDetail.extracted?.ai?.mustHaves?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap pt-2">
                      <span className="text-[11px] text-muted">Extracted Preferences:</span>
                      {enquiryDetail.extracted.ai.mustHaves.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-olive/15 text-forest text-[11px] rounded-full font-medium">
                          ✦ {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Recommended Packages */}
                <div className="bg-card rounded-2xl shadow-sm border border-sand p-6 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-sand">
                    <span className="text-base">🎯</span>
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-forest">
                      AI Suggested Published Packages (Ranked Fit)
                    </h3>
                  </div>

                  {enquiryDetail.aiRecommendationsDetailed?.length ? (
                    <div className="space-y-2.5">
                      {enquiryDetail.aiRecommendationsDetailed.map((rec, idx) => (
                        <div key={idx} className="p-3 bg-cream border border-sand rounded-xl flex items-start justify-between gap-4">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-olive">{rec.code}</span>
                            <h4 className="font-semibold text-xs text-charcoal">{rec.name}</h4>
                            <p className="text-[11px] text-muted mt-1 leading-normal">{rec.reason}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-[10px] text-muted block uppercase">Starting from</span>
                            <span className="font-semibold text-xs text-forest">
                              {rec.startingPrice ? `₹${rec.startingPrice.toLocaleString('en-IN')}` : 'On Request'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted">No package recommendations computed yet.</p>
                  )}
                </div>

                {/* Draft Reply Editor & Human Approval */}
                <div className="bg-card rounded-2xl shadow-sm border border-sand p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-sand">
                    <div className="flex items-center gap-2">
                      <span className="text-base">✉</span>
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-forest">
                        Human-in-the-Loop Reply Draft &amp; Approval
                      </h3>
                    </div>
                    <span className="text-[10px] text-muted">Editable by consultant before sending</span>
                  </div>

                  <textarea
                    rows="9"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-3 text-xs border border-sand rounded-xl outline-none focus:border-gold font-sans leading-relaxed bg-cream/50"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-muted">
                      Delivery mode: <strong>Mocked Service (Development / Safe Test)</strong>
                    </span>
                    <button
                      type="button"
                      disabled={actionInProgress || !replyText.trim()}
                      onClick={handleApproveReply}
                      className="px-6 py-2.5 bg-forest hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50"
                    >
                      {actionInProgress ? 'Processing...' : 'Approve & Send Reply →'}
                    </button>
                  </div>
                </div>

                {/* Internal Notes & History */}
                <div className="bg-card rounded-2xl shadow-sm border border-sand p-6 space-y-4">
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-charcoal">
                    Internal Consultant Notes
                  </h3>

                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      rows="2"
                      placeholder="Add an internal note about this traveller (e.g. called phone, prefers early morning safari)..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full p-2.5 text-xs border border-sand rounded-xl outline-none focus:border-gold"
                    />
                    <button
                      type="submit"
                      disabled={actionInProgress || !noteText.trim()}
                      className="px-4 py-1.5 bg-sand/60 hover:bg-sand text-charcoal rounded-lg text-xs font-semibold"
                    >
                      Record Note
                    </button>
                  </form>

                  <div className="space-y-2 pt-2">
                    {(enquiryDetail.notes || []).map((n, i) => (
                      <div key={i} className="p-2.5 bg-cream border border-sand rounded-lg text-xs">
                        <div className="flex justify-between text-[10px] text-muted mb-1">
                          <strong>{n.authorId?.name || 'Staff Consultant'}</strong>
                          <span>{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-charcoal/90">{n.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

