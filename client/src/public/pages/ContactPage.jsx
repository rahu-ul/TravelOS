import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import PageHero from '../../components/ui/PageHero.jsx';
import { ArrowRightIcon, PinIcon, PhoneIcon, MailIcon, ClockIcon } from '../../components/ui/Icons.jsx';
import { DEMO_PACKAGES, DEMO_DESTINATIONS } from '../../data/demoData.js';
import { api } from '../../api/client.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/50 text-gold">
        <Icon size={20} />
      </span>
      <div>
        <p className="mb-0.5 text-xs font-medium text-white/60">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const preselectedPackage = searchParams.get('package') || '';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    destination: 'Kerala',
    packageSlug: preselectedPackage,
    travelMonth: '',
    travellers: '2',
    children: '0',
    budget: '',
    specialRequirements: '',
    whatsappConsent: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required for reservations';
    if (!form.destination && !form.packageSlug) errs.destination = 'Please select a destination or package';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const budgetAmount = form.budget ? parseInt(form.budget, 10) : undefined;
      const res = await api.post('/enquiries', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        destination: form.destination || 'Kerala',
        packageSlug: form.packageSlug || undefined,
        adults: parseInt(form.travellers, 10) || 2,
        children: parseInt(form.children, 10) || 0,
        budget: Number.isFinite(budgetAmount) ? budgetAmount : undefined,
        requirements: form.specialRequirements ? form.specialRequirements.trim() : undefined,
        whatsappConsent: Boolean(form.whatsappConsent),
      });

      setSubmittedData({
        isLive: true,
        reference: res.data.data.reference,
        duplicate: res.data.data.duplicate,
        name: form.name,
      });
    } catch (err) {
      setSubmitError(err.message || 'Unable to submit your enquiry at this time. Please check your connection or contact our team directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedData) {
    return (
      <Layout>
        <section className="relative flex min-h-screen items-center overflow-hidden bg-cream pb-16 pt-28">
          <div className="container-site">
            <div className="pop-in mx-auto max-w-2xl rounded-[1.75rem] border border-sand bg-card p-8 text-center shadow-[var(--shadow-lg)] md:p-12">
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-gold text-2xl font-bold text-on-gold shadow-[var(--shadow-md)]" aria-hidden="true">✓</div>
              <h1 className="mb-3 font-serif text-4xl font-medium text-charcoal">Enquiry Confirmed</h1>
              <p className="mb-5 text-xs font-semibold tracking-widest text-olive">
                REFERENCE: <span className="font-mono text-sm font-bold text-accent">{submittedData.reference}</span>
              </p>
              <p className="mb-6 text-base leading-relaxed text-muted">
                Thank you, <strong className="text-charcoal">{submittedData.name}</strong>. Our Kochi-based travel desk has received your request.
              An AI-assisted travel proposal is currently being prepared and will be reviewed by our senior consultant.
              </p>
              <div className="mb-8 space-y-3 rounded-2xl border border-sand bg-cream p-5 text-left text-xs">
                <div className="flex justify-between gap-4 border-b border-sand pb-3">
                  <span className="text-muted">Target Response SLA:</span>
                  <strong className="text-right text-accent">Within 1 Hour (Business Hours)</strong>
                </div>
                <div className="flex justify-between gap-4 border-b border-sand pb-3">
                  <span className="text-muted">WhatsApp Updates:</span>
                  <span className="text-right text-charcoal">{form.whatsappConsent ? 'Enabled (Follow-up permitted)' : 'Disabled by preference'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Backend Sync Status:</span>
                  <span className={`text-right ${submittedData.isLive ? 'font-semibold text-ok' : 'text-warn'}`}>
                    {submittedData.isLive ? 'Persisted to Database & Queued for AI' : 'Demo Acknowledgment Recorded'}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/packages" className="btn btn-primary">Explore More Packages <ArrowRightIcon size={16} /></Link>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedData(null);
                    setForm({
                      name: '', email: '', phone: '', destination: 'Kerala', packageSlug: '', travelMonth: '',
                      travellers: '2', children: '0', budget: '', specialRequirements: '', whatsappConsent: true,
                    });
                  }}
                  className="btn btn-outline"
                >
                  Send Another Request
                </button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative overflow-hidden bg-[#0B110D] pb-16 pt-28 md:pb-24 md:pt-36">
        <img src="/images/seed/kerala-sunset.jpg" alt="" className="hero-zoom absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B110D]/90 via-[#0B110D]/65 to-[#0B110D]/40" />

        <div className="container-site relative">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
            {/* Left: contact info */}
            <div className="lg:pt-6">
              <p className="rise-in mb-3 text-sm font-medium tracking-wide text-gold">Get in touch</p>
              <h1 className="rise-in font-serif text-4xl font-medium leading-[1.08] tracking-tight text-white md:text-5xl lg:text-6xl" style={{ animationDelay: '0.08s' }}>
                Plan Your Kerala Journey
              </h1>
              <p className="rise-in mt-5 max-w-md text-base leading-relaxed text-white/75" style={{ animationDelay: '0.18s' }}>
                Our tour desk is based in Fort Kochi with direct relationships with heritage resorts, private houseboats, and accredited nature guides.
              </p>

              <div className="rise-in mt-9 space-y-6" style={{ animationDelay: '0.28s' }}>
                <InfoItem icon={PinIcon} label="Office" value="Fort Kochi, Kerala — 682001" />
                <InfoItem icon={PhoneIcon} label="Direct Line" value="+91 98470 00000" />
                <InfoItem icon={MailIcon} label="Email" value="hello@travelos.in" />
                <InfoItem icon={ClockIcon} label="Response Guarantee" value="Within 1 Hour (Working Hours)" />
              </div>

              <div className="mt-10 border-t border-white/15 pt-6">
                <p className="mb-3 text-xs font-medium text-white/60">Quick package selection</p>
                <div className="flex flex-col items-start gap-1">
                  {DEMO_PACKAGES.slice(0, 4).map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, packageSlug: pkg.slug }))}
                      className={`py-1 text-left text-sm transition-colors ${form.packageSlug === pkg.slug ? 'font-semibold text-gold' : 'text-white/75 hover:text-white'}`}
                    >
                      → {pkg.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: enquiry form */}
            <div id="enquiry" className="pop-in rounded-[1.75rem] border border-sand bg-card p-6 shadow-[var(--shadow-lg)] md:p-9">
              <div className="mb-7">
                <h2 className="font-serif text-2xl font-medium text-charcoal">Tailored travel enquiry</h2>
                <p className="mt-1 text-xs text-muted">All submissions are assigned directly to an expert travel consultant</p>
              </div>

              {submitError && (
                <div className="mb-6 rounded-xl border border-bad/30 bg-bad-soft p-4 text-xs leading-relaxed text-bad flex items-center justify-between">
                  <span>{submitError}</span>
                  <button type="button" onClick={() => setSubmitError(null)} className="ml-3 font-bold">✕</button>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Name + Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="enq-name" className="label">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="enq-name" name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Vikram Sharma"
                        className="field"
                        aria-invalid={Boolean(errors.name)}
                      />
                      {errors.name && <p className="mt-1 text-xs text-bad">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="enq-email" className="label">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="enq-email" name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="vikram@example.com"
                        className="field"
                        aria-invalid={Boolean(errors.email)}
                      />
                      {errors.email && <p className="mt-1 text-xs text-bad">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="enq-phone" className="label">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="enq-phone" name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 98470 12345"
                      className="field"
                        aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-bad">{errors.phone}</p>}
                  </div>

                  {/* Package or Destination */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="enq-packageSlug" className="label">
                        Specific Package (Optional)
                      </label>
                      <select
                        id="enq-packageSlug" name="packageSlug"
                        value={form.packageSlug}
                        onChange={handleChange}
                        className="field"
                      >
                        <option value="">Custom Itinerary / Undecided</option>
                        {DEMO_PACKAGES.map((p) => (
                          <option key={p.id} value={p.slug}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="enq-destination" className="label">
                        Preferred Region / Destination *
                      </label>
                      <select
                        id="enq-destination" name="destination"
                        value={form.destination}
                        onChange={handleChange}
                        className="field"
                      >
                        <option value="Kerala">All Kerala (Backwaters &amp; Hills)</option>
                        {DEMO_DESTINATIONS.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                        <option value="Madurai">Madurai / Tamil Nadu</option>
                        <option value="Ooty">Ooty &amp; Nilgiris</option>
                      </select>
                    </div>
                  </div>

                  {/* Travel month + Travellers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="enq-travelMonth" className="label">
                        Preferred Travel Month
                      </label>
                      <select
                        id="enq-travelMonth" name="travelMonth"
                        value={form.travelMonth}
                        onChange={handleChange}
                        className="field"
                      >
                        <option value="">Any Season / Flexible</option>
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="enq-travellers" className="label">
                        Adult Travellers
                      </label>
                      <select
                        id="enq-travellers" name="travellers"
                        value={form.travellers}
                        onChange={handleChange}
                        className="field"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>{n} {n === 1 ? 'Adult' : 'Adults'}</option>
                        ))}
                        <option value="9">9+ Adults (Group Tour)</option>
                      </select>
                    </div>
                  </div>

                  {/* Children */}
                  <div>
                    <label htmlFor="enq-children" className="label">
                      Children (under 12)
                    </label>
                    <select
                      id="enq-children" name="children"
                      value={form.children}
                      onChange={handleChange}
                      className="field"
                    >
                      <option value="0">No children</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? 'Child' : 'Children'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Approximate Total Budget */}
                  <div>
                    <label htmlFor="enq-budget" className="label">
                      Approximate Total Budget (INR)
                    </label>
                    <select
                      id="enq-budget" name="budget"
                      value={form.budget}
                      onChange={handleChange}
                      className="field"
                    >
                      <option value="">Flexible / Tailored to Preferred Category</option>
                      <option value="40000">Around ₹40,000</option>
                      <option value="75000">Around ₹75,000</option>
                      <option value="120000">Around ₹1,20,000</option>
                      <option value="200000">₹2,00,000+</option>
                    </select>
                  </div>

                  {/* Special requirements */}
                  <div>
                    <label htmlFor="enq-specialRequirements" className="label">
                      Special Requirements or Desired Experiences
                    </label>
                    <textarea
                      id="enq-specialRequirements" name="specialRequirements"
                      value={form.specialRequirements}
                      onChange={handleChange}
                      rows={4}
                      placeholder="e.g. Private air-conditioned houseboat on Vembanad Lake, authentic Ayurvedic massage in Kovalam, spice plantation tour in Thekkady..."
                      className="field resize-none"
                    />
                  </div>

                  {/* DPDP Consent: WhatsApp Communication */}
                  <div className="rounded-xl border border-sand bg-cream p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="whatsappConsent"
                        checked={form.whatsappConsent}
                        onChange={handleChange}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span className="text-xs leading-relaxed text-muted">
                        I agree to receive itinerary updates, quotation drafts, and travel vouchers via WhatsApp on this number. (Required under DPDP guidelines before WhatsApp messaging).
                      </span>
                    </label>
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary w-full !py-3.5 disabled:opacity-60"
                    >
                      {submitting ? 'Submitting & Initializing AI Assistant...' : 'Submit Enquiry & Request Quote →'}
                    </button>
                    <p className="mt-3 text-center text-[11px] text-muted">
                      🔒 Your privacy is respected. We never share customer information with third-party advertisers.
                    </p>
                  </div>
                </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
