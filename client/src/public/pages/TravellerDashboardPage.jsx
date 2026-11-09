import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import { logout, fetchMe } from '../../features/auth/authSlice.js';
import { api } from '../../api/client.js';
import { CalendarIcon, PinIcon, UsersIcon, ArrowRightIcon, LogoutIcon } from '../../components/ui/Icons.jsx';

const STATUS_CHIPS = {
  new: 'bg-info-soft text-info border-info/30',
  contacted: 'bg-warn-soft text-warn border-warn/30',
  quoted: 'bg-violet-soft text-violet border-violet/30',
  won: 'bg-ok-soft text-ok border-ok/30',
  lost: 'bg-sand text-muted border-sand',
};

export default function TravellerDashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, status } = useSelector((state) => state.auth);

  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [enquiryError, setEnquiryError] = useState(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchMe());
    }
  }, [dispatch, status]);

  // Auth gate
  useEffect(() => {
    if (status === 'ready' && !user) {
      navigate('/login', { replace: true });
    }
  }, [status, user, navigate]);

  // Load enquiries for this traveller
  useEffect(() => {
    if (user) {
      setLoadingEnquiries(true);
      api
        .get('/enquiries/my')
        .then((res) => {
          setEnquiries(res.data.data.enquiries || []);
          setEnquiryError(null);
        })
        .catch((err) => {
          setEnquiryError(err.message || 'Unable to load enquiries');
        })
        .finally(() => {
          setLoadingEnquiries(false);
        });
    }
  }, [user]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  if (status !== 'ready' || !user) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center bg-ivory">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sand border-t-gold" />
            <p className="text-sm text-muted">Loading your traveller dashboard…</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-ivory pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container-site">
          {/* Top Banner / Welcome */}
          <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-sand bg-card p-6 shadow-[var(--shadow-sm)] md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gold/20 text-2xl font-bold text-on-gold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl font-medium text-charcoal md:text-3xl">
                    Namaskaram, {user.name}
                  </h1>
                  <span className="chip chip-gold uppercase text-[10px]">Traveller</span>
                </div>
                <p className="mt-1 text-sm text-muted">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/packages" className="btn btn-outline text-xs !py-2.5">
                Browse Journeys
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn border border-bad/30 bg-bad-soft text-bad hover:bg-bad/20 text-xs !py-2.5 inline-flex items-center gap-2"
              >
                <LogoutIcon size={16} /> Sign Out
              </button>
            </div>
          </div>

          {/* Grid Layout: Account Overview + Enquiries */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left: Profile & Info */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-sand bg-card p-6 shadow-[var(--shadow-sm)]">
                <h2 className="mb-4 font-serif text-lg font-medium text-charcoal">Account Details</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-muted">FULL NAME</span>
                    <span className="text-charcoal">{user.name}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-muted">REGISTERED EMAIL</span>
                    <span className="text-charcoal">{user.email}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-muted">MEMBERSHIP</span>
                    <span className="text-charcoal capitalize">{user.role} Member</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-muted">MEMBER SINCE</span>
                    <span className="text-charcoal">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '2026'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sand bg-cream p-6">
                <h3 className="mb-2 font-serif text-base font-medium text-charcoal">Need travel assistance?</h3>
                <p className="text-xs leading-relaxed text-muted">
                  Our Kochi-based destination consultants are ready to tailor an authentic Kerala or South India itinerary for your party.
                </p>
                <Link to="/contact" className="btn btn-gold mt-4 w-full text-xs">
                  Plan a Custom Journey <ArrowRightIcon size={14} />
                </Link>
              </div>
            </div>

            {/* Right: Enquiries & Bookings List */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-sand bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl font-medium text-charcoal">Your Journey Enquiries</h2>
                    <p className="mt-1 text-xs text-muted">
                      Track the status of your itinerary requests and bespoke travel quotations.
                    </p>
                  </div>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-charcoal">
                    {enquiries.length} {enquiries.length === 1 ? 'Record' : 'Records'}
                  </span>
                </div>

                {loadingEnquiries ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-sand border-t-gold" />
                    <p className="text-xs text-muted">Loading your enquiries…</p>
                  </div>
                ) : enquiryError ? (
                  <div className="rounded-xl border border-bad/30 bg-bad-soft p-4 text-xs text-bad">
                    {enquiryError}
                  </div>
                ) : enquiries.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm font-medium text-charcoal">No travel enquiries found</p>
                    <p className="mt-1 text-xs text-muted">
                      When you submit an enquiry through any package or our contact page, it will appear here.
                    </p>
                    <Link to="/packages" className="btn btn-primary mt-5 text-xs">
                      Explore Kerala Packages
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enquiries.map((enq) => (
                      <div
                        key={enq.id}
                        className="rounded-xl border border-sand bg-cream/50 p-5 transition-colors hover:border-gold"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand pb-3">
                          <span className="font-mono text-xs font-bold text-accent">{enq.reference}</span>
                          <span className={`chip border text-[11px] font-semibold uppercase ${STATUS_CHIPS[enq.status] || 'bg-sand text-muted'}`}>
                            {enq.status}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                          {enq.packageName && (
                            <div className="sm:col-span-2 font-medium text-charcoal">
                              Package: <span className="font-serif text-sm font-semibold">{enq.packageName}</span>
                            </div>
                          )}
                          {enq.destination && (
                            <div className="flex items-center gap-1.5 text-muted">
                              <PinIcon size={14} className="text-gold shrink-0" />
                              <span>Destination: {enq.destination}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-muted">
                            <UsersIcon size={14} className="text-gold shrink-0" />
                            <span>
                              {enq.adults} Adults{enq.children > 0 ? `, ${enq.children} Children` : ''}
                            </span>
                          </div>
                          {enq.travelStart && (
                            <div className="flex items-center gap-1.5 text-muted">
                              <CalendarIcon size={14} className="text-gold shrink-0" />
                              <span>
                                Travel Date: {new Date(enq.travelStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          )}
                          <div className="text-muted">
                            Submitted: {new Date(enq.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>

                        {enq.message && (
                          <div className="mt-3 rounded-lg bg-card p-3 text-xs text-muted border border-sand">
                            <span className="font-semibold text-charcoal">Note:</span> {enq.message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
