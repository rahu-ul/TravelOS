import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminLayout from '../AdminLayout.jsx';
import { api } from '../../api/client.js';
import { ErrorState, EmptyState, Skeleton } from '../../components/ui/States.jsx';
import { ArrowRightIcon } from '../../components/ui/Icons.jsx';

const STATUS_META = {
  new: { label: 'New', color: 'var(--info)', chip: 'bg-info-soft text-info' },
  contacted: { label: 'Contacted', color: 'var(--warn)', chip: 'bg-warn-soft text-warn' },
  quoted: { label: 'Quoted', color: 'var(--violet)', chip: 'bg-violet-soft text-violet' },
  won: { label: 'Won', color: 'var(--ok)', chip: 'bg-ok-soft text-ok' },
  lost: { label: 'Lost', color: 'var(--text-muted)', chip: 'bg-sand text-muted' },
};
const DAYS = 14;

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins || 1}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

function Kpi({ label, value, note, tone = 'text-charcoal', loading }) {
  return (
    <div className="themed rounded-[1.25rem] border border-sand bg-card p-5 shadow-[var(--shadow-sm)]">
      <p className="text-xs font-medium text-muted">{label}</p>
      {loading ? <Skeleton className="mt-3 h-9 w-20" /> : <p className={`mt-2 font-serif text-4xl font-medium leading-none ${tone}`}>{value}</p>}
      <p className="mt-2 text-xs text-muted">{note}</p>
    </div>
  );
}

function TrendChart({ series }) {
  const W = 640, H = 220, P = { l: 34, r: 12, t: 14, b: 28 };
  const max = Math.max(1, ...series.map((s) => s.count));
  const top = Math.max(2, Math.ceil(max / 2) * 2);
  const x = (i) => P.l + (i * (W - P.l - P.r)) / (series.length - 1);
  const y = (v) => P.t + (1 - v / top) * (H - P.t - P.b);
  const line = series.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s.count).toFixed(1)}`).join(' ');
  const area = `${line} L${x(series.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`;
  const ticks = [0, top / 2, top];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Enquiries received per day over the last ${DAYS} days`}>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="3 4" />
          <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{t}</text>
        </g>
      ))}
      <path d={area} fill="url(#trendFill)" className="fade-in" />
      <path d={line} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" pathLength="1000" style={{ '--len': 1000 }} className="chart-draw" />
      {series.map((s, i) => (
        <g key={s.key}>
          {s.count > 0 && <circle cx={x(i)} cy={y(s.count)} r="4" fill="var(--card)" stroke="var(--gold)" strokeWidth="2"><title>{`${s.label}: ${s.count}`}</title></circle>}
          {(i % 3 === 0 || i === series.length - 1) && (
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{s.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

function Donut({ counts, total }) {
  const R = 54, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0 -rotate-90" role="img" aria-label="Enquiries by status">
      <circle cx="70" cy="70" r={R} fill="none" stroke="var(--line)" strokeWidth="16" />
      {Object.keys(STATUS_META).map((k) => {
        const n = counts[k] || 0;
        if (!n || !total) return null;
        const len = (n / total) * C;
        const el = (
          <circle key={k} cx="70" cy="70" r={R} fill="none" stroke={STATUS_META[k].color} strokeWidth="16"
            strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-acc} className="fade-in">
            <title>{`${STATUS_META[k].label}: ${n}`}</title>
          </circle>
        );
        acc += len;
        return el;
      })}
    </svg>
  );
}

export default function AdminDashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const firstName = (user?.name || 'Admin').split(' ')[0];
  const [packages, setPackages] = useState(null);
  const [enquiries, setEnquiries] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    const [p, e] = await Promise.allSettled([api.get('/admin/packages'), api.get('/admin/enquiries')]);
    const errs = [];
    if (p.status === 'fulfilled') setPackages(p.value.data.data.packages || []);
    else errs.push(`Packages: ${p.reason.message}`);
    if (e.status === 'fulfilled') setEnquiries(e.value.data.data.enquiries || []);
    else errs.push(`Enquiries: ${e.reason.message}`);
    setErrors(errs);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const pk = packages || [];
    const en = enquiries || [];
    const counts = en.reduce((a, q) => ({ ...a, [q.status]: (a[q.status] || 0) + 1 }), {});
    const today = new Date();
    const series = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (DAYS - 1 - i));
      return { key: dayKey(d), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), count: 0 };
    });
    en.forEach((q) => {
      const s = series.find((x) => x.key === dayKey(new Date(q.createdAt)));
      if (s) s.count += 1;
    });
    return {
      totalPackages: pk.length,
      published: pk.filter((x) => x.isPublished).length,
      drafts: pk.filter((x) => x.hasDraft).length,
      totalEnq: en.length,
      counts,
      inProgress: (counts.contacted || 0) + (counts.quoted || 0),
      overdue: en.filter((q) => q.isOverdue).length,
      series,
      recent: [...en].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
      attention: en.filter((q) => q.isOverdue),
    };
  }, [packages, enquiries]);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <AdminLayout>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-charcoal">{greeting}, {firstName}</h1>
          <p className="mt-1 text-sm text-muted">Here&rsquo;s what&rsquo;s happening across your packages and enquiries.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/packages" className="btn btn-outline !bg-card !py-2.5">Manage packages</Link>
          <Link to="/admin/enquiries" className="btn btn-primary !py-2.5">Open inbox <ArrowRightIcon size={16} /></Link>
        </div>
      </div>

      {errors.length > 0 && <div className="mb-6 space-y-2">{errors.map((m) => <ErrorState key={m} message={m} onRetry={load} />)}</div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi loading={loading && !packages} label="Total packages" value={stats.totalPackages} note={`${stats.published} live on the website`} />
        <Kpi loading={loading && !packages} label="Published" value={stats.published} tone="text-ok" note="Visible to travellers" />
        <Kpi loading={loading && !packages} label="Drafts" value={stats.drafts} tone="text-warn" note="Awaiting publish" />
        <Kpi loading={loading && !enquiries} label="Total enquiries" value={stats.totalEnq} note={`${stats.counts.new || 0} new · ${stats.inProgress} in progress`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section className="themed rounded-[1.4rem] border border-sand bg-card p-6 shadow-[var(--shadow-sm)]" aria-labelledby="trend-h">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="trend-h" className="font-serif text-xl font-medium text-charcoal">Enquiry trend</h2>
            <span className="chip bg-sand text-muted">Last {DAYS} days</span>
          </div>
          {loading && !enquiries ? <Skeleton className="h-52 w-full" /> : stats.totalEnq === 0 ? (
            <EmptyState title="No enquiries yet" message="New enquiries from the website will appear here." />
          ) : <TrendChart series={stats.series} />}
        </section>

        <section className="themed rounded-[1.4rem] border border-sand bg-card p-6 shadow-[var(--shadow-sm)]" aria-labelledby="status-h">
          <h2 id="status-h" className="mb-4 font-serif text-xl font-medium text-charcoal">Enquiry status</h2>
          {loading && !enquiries ? <Skeleton className="h-40 w-full" /> : (
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative">
                <Donut counts={stats.counts} total={stats.totalEnq} />
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div><p className="font-serif text-3xl font-medium text-charcoal">{stats.totalEnq}</p><p className="text-[11px] text-muted">Total</p></div>
                </div>
              </div>
              <ul className="flex-1 space-y-2.5 text-sm">
                {Object.entries(STATUS_META).map(([k, m]) => (
                  <li key={k} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-muted"><span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />{m.label}</span>
                    <span className="font-semibold text-charcoal">{stats.counts[k] || 0}</span>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-3 border-t border-sand pt-2.5">
                  <span className="flex items-center gap-2 text-bad"><span className="h-2.5 w-2.5 rounded-full bg-bad" />SLA overdue</span>
                  <span className="font-semibold text-bad">{stats.overdue}</span>
                </li>
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="themed rounded-[1.4rem] border border-sand bg-card p-6 shadow-[var(--shadow-sm)]" aria-labelledby="recent-h">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent-h" className="font-serif text-xl font-medium text-charcoal">Recent enquiries</h2>
            <Link to="/admin/enquiries" className="text-xs font-medium text-accent underline-offset-4 hover:underline">View all</Link>
          </div>
          {loading && !enquiries ? <Skeleton className="h-40 w-full" /> : stats.recent.length === 0 ? (
            <EmptyState title="Nothing here yet" />
          ) : (
            <ul className="divide-y divide-sand">
              {stats.recent.map((q) => (
                <li key={q.id}>
                  <Link to="/admin/enquiries" className="flex items-center gap-3 py-3 transition-colors hover:bg-cream/70">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand text-xs font-bold text-accent">
                      {(q.customer?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-charcoal">{q.customer?.name || q.reference}</span>
                      <span className="block truncate text-xs text-muted">{q.destination || 'Kerala'} · {q.adults} adults{q.children ? `, ${q.children} children` : ''}</span>
                    </span>
                    <span className="text-right">
                      <span className={`chip ${STATUS_META[q.status]?.chip || 'bg-sand text-muted'}`}>{STATUS_META[q.status]?.label || q.status}</span>
                      <span className="mt-1 block text-[11px] text-muted">{timeAgo(q.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="themed rounded-[1.4rem] border border-sand bg-card p-6 shadow-[var(--shadow-sm)]" aria-labelledby="attn-h">
          <h2 id="attn-h" className="mb-4 font-serif text-xl font-medium text-charcoal">Needs attention</h2>
          {loading && !enquiries ? <Skeleton className="h-40 w-full" /> : stats.attention.length === 0 && stats.drafts === 0 ? (
            <EmptyState title="All caught up" message="No overdue enquiries and no unpublished drafts." />
          ) : (
            <ul className="space-y-3 text-sm">
              {stats.attention.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 rounded-xl border border-bad/30 bg-bad-soft px-4 py-3">
                  <span className="min-w-0"><span className="block truncate font-semibold text-bad">{q.reference}</span><span className="block truncate text-xs text-bad/80">SLA overdue · {q.customer?.name}</span></span>
                  <Link to="/admin/enquiries" className="shrink-0 text-xs font-semibold text-bad underline underline-offset-4">Respond</Link>
                </li>
              ))}
              {stats.drafts > 0 && (
                <li className="flex items-center justify-between gap-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3">
                  <span className="font-semibold text-warn">{stats.drafts} package{stats.drafts === 1 ? '' : 's'} with unpublished changes</span>
                  <Link to="/admin/packages" className="shrink-0 text-xs font-semibold text-warn underline underline-offset-4">Review</Link>
                </li>
              )}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
