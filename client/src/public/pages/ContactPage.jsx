import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import { DEMO_PACKAGES, DEMO_DESTINATIONS } from '../../data/demoData.js';
import { api } from '../../api/client.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <div className="text-2xl w-9 flex-shrink-0 text-center">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-charcoal font-medium">{value}</p>
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
    } catch {
      // Graceful fallback to demo acknowledgment
      const year = new Date().getFullYear();
      const mockRef = `ENQ-${year}-DEMO${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedData({
        isLive: false,
        reference: mockRef,
        duplicate: false,
        name: form.name,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedData) {
    return (
      <Layout>
        <div className="pt-20 min-h-screen bg-ivory flex items-center">
          <div className="container-site py-20 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-forest text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg">
              ✓
            </div>
            <h1 className="font-serif text-4xl text-charcoal mb-3">Enquiry Confirmed</h1>
            <p className="text-xs uppercase tracking-widest text-olive font-semibold mb-2">
              Reference: <span className="font-mono text-forest font-bold text-sm">{submittedData.reference}</span>
            </p>

            <p className="text-charcoal/70 text-base leading-relaxed mb-6">
              Thank you, <strong>{submittedData.name}</strong>. Our Kochi-based travel desk has received your request.
              An AI-assisted travel proposal is currently being prepared and will be reviewed by our senior consultant.
            </p>

            <div className="p-4 bg-white rounded-2xl border border-sand shadow-sm text-left text-xs text-charcoal/80 space-y-2 mb-8">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted">Target Response SLA:</span>
                <strong className="text-forest">Within 1 Hour (Business Hours)</strong>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted">WhatsApp Updates:</span>
                <span>{form.whatsappConsent ? 'Enabled (Follow-up permitted)' : 'Disabled by preference'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Backend Sync Status:</span>
                <span className={submittedData.isLive ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                  {submittedData.isLive ? 'Persisted to Database & Queued for AI' : 'Demo Acknowledgment Recorded'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/packages"
                className="inline-flex items-center justify-center gap-2 bg-forest text-white font-semibold px-7 py-3.5 rounded-full hover:bg-forest-dark transition-colors text-sm"
              >
                Explore More Packages
              </Link>
              <button
                onClick={() => {
                  setSubmittedData(null);
                  setForm({
                    name: '',
                    email: '',
                    phone: '',
                    destination: 'Kerala',
                    packageSlug: '',
                    travelMonth: '',
                    travellers: '2',
                    children: '0',
                    budget: '',
                    specialRequirements: '',
                    whatsappConsent: true,
                  });
                }}
                className="inline-flex items-center justify-center border border-forest/30 text-forest font-semibold px-7 py-3.5 rounded-full hover:bg-forest/5 transition-colors text-sm"
              >
                Send Another Request
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 bg-forest-dark overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <img src="/images/seed/kerala-sunset.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative container-site text-center">
          <p className="text-olive text-xs font-semibold uppercase tracking-widest mb-3">Enquiry &amp; Reservations</p>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-5">
            Plan Your Kerala Journey
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            Share your travel preferences and our Kochi travel specialists will craft an authentic personalised itinerary.
          </p>
        </div>
      </section>

      {/* Contact section */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Contact info */}
            <div className="lg:col-span-1 space-y-8">
              <div>
                <h2 className="font-serif text-2xl text-charcoal mb-2">Talk to Us</h2>
                <p className="text-charcoal/60 text-sm leading-relaxed">
                  Our tour desk is based in Fort Kochi with direct relationships with heritage resorts, private houseboats, and accredited nature guides.
                </p>
              </div>

              <div className="space-y-5">
                <InfoItem icon="📍" label="Office" value="Fort Kochi, Kerala — 682001" />
                <InfoItem icon="📞" label="Direct Line" value="+91 98470 00000" />
                <InfoItem icon="✉" label="Email" value="hello@travelos.in" />
                <InfoItem icon="⏱" label="Response Guarantee" value="Within 1 Hour (Working Hours)" />
              </div>

              {/* Quick links */}
              <div className="border-t border-sand/60 pt-6">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Quick Package Selection</p>
                <div className="space-y-2">
                  {DEMO_PACKAGES.slice(0, 4).map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setForm((f) => ({ ...f, packageSlug: pkg.slug }))}
                      className="block w-full text-left text-sm text-charcoal/70 hover:text-forest transition-colors py-1"
                    >
                      → {pkg.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Enquiry form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-sand/60 p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-serif text-xl text-charcoal mb-1">Tailored Travel Enquiry</h2>
                    <p className="text-xs text-muted">All submissions are assigned directly to an expert travel consultant</p>
                  </div>
                  <span className="text-[10px] bg-forest/10 text-forest px-2.5 py-0.5 rounded-full font-semibold uppercase">
                    Authoritative Quote
                  </span>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Name + Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Vikram Sharma"
                        className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-colors bg-ivory ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-sand focus:border-forest'}`}
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="vikram@example.com"
                        className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-colors bg-ivory ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-sand focus:border-forest'}`}
                      />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 98470 12345"
                      className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-colors bg-ivory ${errors.phone ? 'border-red-400' : 'border-sand focus:border-forest'}`}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  {/* Package or Destination */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                        Specific Package (Optional)
                      </label>
                      <select
                        name="packageSlug"
                        value={form.packageSlug}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest transition-colors bg-ivory"
                      >
                        <option value="">Custom Itinerary / Undecided</option>
                        {DEMO_PACKAGES.map((p) => (
                          <option key={p.id} value={p.slug}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                        Preferred Region / Destination *
                      </label>
                      <select
                        name="destination"
                        value={form.destination}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest transition-colors bg-ivory"
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
                      <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                        Preferred Travel Month
                      </label>
                      <select
                        name="travelMonth"
                        value={form.travelMonth}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest transition-colors bg-ivory"
                      >
                        <option value="">Any Season / Flexible</option>
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                        Adult Travellers
                      </label>
                      <select
                        name="travellers"
                        value={form.travellers}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest transition-colors bg-ivory"
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
                    <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                      Children (under 12)
                    </label>
                    <select
                      name="children"
                      value={form.children}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest transition-colors bg-ivory"
                    >
                      <option value="0">No children</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? 'Child' : 'Children'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Approximate Total Budget */}
                  <div>
                    <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                      Approximate Total Budget (INR)
                    </label>
                    <select
                      name="budget"
                      value={form.budget}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest transition-colors bg-ivory"
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
                    <label className="block text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                      Special Requirements or Desired Experiences
                    </label>
                    <textarea
                      name="specialRequirements"
                      value={form.specialRequirements}
                      onChange={handleChange}
                      rows={4}
                      placeholder="e.g. Private air-conditioned houseboat on Vembanad Lake, authentic Ayurvedic massage in Kovalam, spice plantation tour in Thekkady..."
                      className="w-full px-4 py-3 text-sm border border-sand rounded-xl outline-none focus:border-forest transition-colors bg-ivory resize-none"
                    />
                  </div>

                  {/* DPDP Consent: WhatsApp Communication */}
                  <div className="p-3.5 bg-cream rounded-xl border border-sand/60">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="whatsappConsent"
                        checked={form.whatsappConsent}
                        onChange={handleChange}
                        className="mt-0.5 w-4 h-4 text-forest rounded border-sand focus:ring-forest"
                      />
                      <span className="text-xs text-charcoal/80 leading-relaxed">
                        I agree to receive itinerary updates, quotation drafts, and travel vouchers via WhatsApp on this number. (Required under DPDP guidelines before WhatsApp messaging).
                      </span>
                    </label>
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-forest text-white font-semibold py-3.5 rounded-xl hover:bg-forest-dark transition-colors text-sm shadow-md disabled:opacity-50"
                    >
                      {submitting ? 'Submitting & Initializing AI Assistant...' : 'Submit Enquiry & Request Quote →'}
                    </button>
                    <p className="text-center text-[11px] text-muted mt-2">
                      🔒 Your privacy is respected. We never share customer information with third-party advertisers.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
