import { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout.jsx';
import { api } from '../../api/client.js';

export default function AdminStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & form state
  const [showModal, setShowModal] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    coverImageUrl: '',
    tags: '',
    status: 'draft',
  });

  const loadStories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stories');
      setStories(res.data.data.stories || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const openCreateModal = () => {
    setEditingStory(null);
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      body: '',
      coverImageUrl: '',
      tags: '',
      status: 'draft',
    });
    setShowModal(true);
  };

  const openEditModal = (story) => {
    setEditingStory(story);
    setForm({
      title: story.title || '',
      slug: story.slug || '',
      excerpt: story.excerpt || '',
      body: story.body || '',
      coverImageUrl: story.coverImage?.url || '',
      tags: (story.tags || []).join(', '),
      status: story.status || 'draft',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError('Title and Body are required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMsg('');
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        body: form.body,
        coverImage: form.coverImageUrl ? { url: form.coverImageUrl, alt: form.title } : undefined,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        status: form.status,
      };

      if (editingStory) {
        await api.put(`/admin/stories/${editingStory._id}`, payload);
        setSuccessMsg(`Story "${form.title}" updated successfully.`);
      } else {
        await api.post('/admin/stories', payload);
        setSuccessMsg(`Story "${form.title}" created successfully.`);
      }
      setShowModal(false);
      loadStories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      await api.post(`/admin/stories/${id}/publish`);
      setSuccessMsg(`Story marked as ${currentStatus === 'published' ? 'draft' : 'published'}.`);
      loadStories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete the story "${title}"?`)) return;
    try {
      await api.delete(`/admin/stories/${id}`);
      setSuccessMsg(`Story "${title}" deleted.`);
      loadStories();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = stories.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-medium text-charcoal">Travel Stories CMS</h1>
            <p className="text-xs text-muted mt-1">
              Manage editorial blog articles, destination guides, and stories linked to packages.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-gold hover:brightness-105 text-charcoal rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 self-start sm:self-auto"
          >
            <span>+</span> Create New Story
          </button>
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

        {/* Filter bar */}
        <div className="bg-card p-4 rounded-2xl shadow-sm border border-sand flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {['', 'published', 'draft'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === st ? 'bg-[var(--btn-bg)] text-[var(--btn-fg)]' : 'bg-sand/60 text-charcoal hover:bg-sand'
                }`}
              >
                {st || 'All Stories'}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search title, slug, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-xs border border-sand rounded-xl outline-none focus:border-gold w-full sm:w-60 bg-cream"
          />
        </div>

        {/* Stories Table */}
        <div className="bg-card rounded-2xl shadow-sm border border-sand overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted">Loading travel stories…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted">No travel stories found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal divide-y divide-sand">
                <thead className="bg-sand/30 font-semibold text-muted uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Title / Slug</th>
                    <th className="p-4">Author</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Tags</th>
                    <th className="p-4">Published At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/50">
                  {filtered.map((s) => (
                    <tr key={s._id} className="hover:bg-cream/50 transition-colors">
                      <td className="p-4">
                        <strong className="block text-sm text-charcoal">{s.title}</strong>
                        <span className="font-mono text-[11px] text-muted">/{s.slug}</span>
                      </td>
                      <td className="p-4 text-muted">
                        {s.author?.name || 'Staff Admin'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            s.status === 'published' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {(s.tags || []).slice(0, 3).map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-sand/60 rounded-full text-[10px] text-muted">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-muted">
                        {s.publishedAt
                          ? new Date(s.publishedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleTogglePublish(s._id, s.status)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                            s.status === 'published'
                              ? 'border-sand text-muted hover:bg-sand/60'
                              : 'border-ok text-ok hover:bg-ok-soft'
                          }`}
                        >
                          {s.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-sand/60 hover:bg-sand text-charcoal"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s._id, s.title)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-bad hover:bg-bad-soft"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-sand p-6 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-sand pb-3">
                <h2 className="font-serif text-xl font-bold text-charcoal">
                  {editingStory ? 'Edit Story' : 'Create New Travel Story'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted hover:text-charcoal font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. A Dawn Canoe Through Kuttanad's Waterways"
                    className="w-full p-2.5 text-xs border border-sand rounded-xl outline-none focus:border-gold bg-cream"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">Custom Slug (optional)</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="auto-generated from title if blank"
                      className="w-full p-2.5 text-xs border border-sand rounded-xl outline-none focus:border-gold bg-cream"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full p-2.5 text-xs border border-sand rounded-xl outline-none bg-cream"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={form.coverImageUrl}
                    onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                    placeholder="e.g. /images/seed/kerala-houseboat.jpg or https://..."
                    className="w-full p-2.5 text-xs border border-sand rounded-xl outline-none focus:border-gold bg-cream"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Excerpt (short summary)</label>
                  <textarea
                    rows="2"
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    placeholder="A brief 1-2 sentence preview for search and cards..."
                    className="w-full p-2.5 text-xs border border-sand rounded-xl outline-none focus:border-gold bg-cream"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Story Body * (Markdown / paragraphs)</label>
                  <textarea
                    rows="8"
                    required
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder="Write the full travel story content here. Separate paragraphs with blank lines."
                    className="w-full p-2.5 text-xs border border-sand rounded-xl outline-none focus:border-gold bg-cream font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="e.g. backwaters, alleppey, guide, photography"
                    className="w-full p-2.5 text-xs border border-sand rounded-xl outline-none focus:border-gold bg-cream"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-sand">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-sand rounded-xl text-xs text-muted hover:text-charcoal"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-[var(--btn-bg)] text-[var(--btn-fg)] rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingStory ? 'Update Story' : 'Create Story'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

