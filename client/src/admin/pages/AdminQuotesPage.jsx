import { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout.jsx';
import { api } from '../../api/client.js';
import { useSelector } from 'react-redux';
import Logo from '../../components/ui/Logo.jsx';

export default function AdminQuotesPage() {
  const { user } = useSelector((state) => state.auth);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quote Form State
  const [travellerName, setTravellerName] = useState('Dr. Sunil Sharma');
  const [travellerEmail, setTravellerEmail] = useState('sunil.sharma@example.com');
  const [travellerPhone, setTravellerPhone] = useState('+91 98401 23456');
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [selectedSeasonName, setSelectedSeasonName] = useState('');
  const [guests, setGuests] = useState(2);
  const [customPricePerPerson, setCustomPricePerPerson] = useState('');
  const [notes, setNotes] = useState('Complimentary spice plantation guided walk and traditional Kathakali evening show included.');
  const [validUntilDays, setValidUntilDays] = useState(14);

  useEffect(() => {
    api.get('/packages')
      .then((res) => {
        const list = res.data?.data?.packages || [];
        setPackages(list);
        if (list.length > 0) {
          setSelectedPkgId(list[0].id || list[0]._id);
        }
      })
      .catch((err) => {
        console.warn('Could not load packages for quote builder:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedPkg = packages.find((p) => (p.id || p._id) === selectedPkgId) || null;

  // When package changes, update default price
  useEffect(() => {
    if (selectedPkg) {
      const base = selectedPkg.startingPrice || 32000;
      setCustomPricePerPerson(String(base));
      setSelectedSeasonName(selectedPkg.destination || 'Kerala High Season');
    }
  }, [selectedPkgId]);

  // Calculations
  const ratePerPerson = Number(customPricePerPerson) || 0;
  const subtotal = ratePerPerson * Number(guests || 1);
  const gstRate = 0.05; // 5% GST for Indian tour packages
  const gstAmount = Math.round(subtotal * gstRate);
  const grandTotal = subtotal + gstAmount;

  const quoteRef = `QT-${new Date().getFullYear()}-${String(Math.abs(selectedPkgId?.charCodeAt(0) || 42)).padStart(3, '0')}${String(guests)}`;
  const validUntilDate = new Date(Date.now() + validUntilDays * 86400000).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Screen Header (Hidden when printing) */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-medium text-charcoal">Branded Quote Builder</h1>
            <p className="text-xs text-muted mt-1">
              Generate custom, branded quotations with GST breakdown, seasonal rates, and instant PDF print.
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-forest hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <span>🖨</span> Print / Save as PDF
          </button>
        </div>

        {/* Builder Layout: Config form on Left (hidden in print), Branded Quotation on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Form (5 cols, hidden in print) */}
          <div className="lg:col-span-4 bg-card rounded-2xl shadow-sm border border-sand p-6 space-y-4 print:hidden">
            <h2 className="font-serif text-lg font-bold text-charcoal pb-2 border-b border-sand">
              Quotation Parameters
            </h2>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Traveller Name</label>
              <input
                type="text"
                value={travellerName}
                onChange={(e) => setTravellerName(e.target.value)}
                className="w-full p-2 text-xs border border-sand rounded-xl bg-cream outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={travellerEmail}
                  onChange={(e) => setTravellerEmail(e.target.value)}
                  className="w-full p-2 text-xs border border-sand rounded-xl bg-cream outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Phone</label>
                <input
                  type="text"
                  value={travellerPhone}
                  onChange={(e) => setTravellerPhone(e.target.value)}
                  className="w-full p-2 text-xs border border-sand rounded-xl bg-cream outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Select Base Package</label>
              <select
                value={selectedPkgId}
                onChange={(e) => setSelectedPkgId(e.target.value)}
                className="w-full p-2 text-xs border border-sand rounded-xl bg-cream outline-none font-medium"
              >
                {packages.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name} ({p.durationDays || 5}D · ₹{p.startingPrice?.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Guests (Pax)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full p-2 text-xs border border-sand rounded-xl bg-cream outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Rate / Person (₹)</label>
                <input
                  type="number"
                  value={customPricePerPerson}
                  onChange={(e) => setCustomPricePerPerson(e.target.value)}
                  className="w-full p-2 text-xs border border-sand rounded-xl bg-cream outline-none font-bold text-forest"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Season / Plan Name</label>
              <input
                type="text"
                value={selectedSeasonName}
                onChange={(e) => setSelectedSeasonName(e.target.value)}
                className="w-full p-2 text-xs border border-sand rounded-xl bg-cream outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Validity (Days)</label>
              <input
                type="number"
                value={validUntilDays}
                onChange={(e) => setValidUntilDays(parseInt(e.target.value, 10) || 7)}
                className="w-full p-2 text-xs border border-sand rounded-xl bg-cream outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase mb-1">Special Inclusions / Notes</label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 text-xs border border-sand rounded-xl bg-cream outline-none font-sans"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2 bg-forest hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow"
              >
                Generate Branded Document →
              </button>
            </div>
          </div>

          {/* Branded Quotation Preview (8 cols on screen, 100% width on print) */}
          <div className="lg:col-span-8 bg-white text-charcoal rounded-3xl shadow-lg border border-sand/80 p-8 sm:p-12 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full">
            {/* Document Header */}
            <div className="flex flex-wrap items-start justify-between gap-6 pb-8 border-b-2 border-sand">
              <div>
                <Logo tagline={false} />
                <p className="text-[11px] text-muted mt-2">
                  TravelOS Curated Journeys Pvt. Ltd.<br />
                  Fort Kochi, Kerala 682001, India<br />
                  contact@travelos.example · +91 484 221 8000
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-gold/15 text-gold-dark font-mono font-bold text-xs rounded-full uppercase tracking-wider mb-2">
                  Official Travel Quotation
                </span>
                <p className="font-mono text-sm font-bold text-charcoal">{quoteRef}</p>
                <p className="text-[11px] text-muted mt-1">Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="text-[11px] text-muted">Valid until: <strong>{validUntilDate}</strong></p>
              </div>
            </div>

            {/* Recipient & Journey Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-sand text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Prepared For</span>
                <strong className="text-sm font-serif text-charcoal block">{travellerName}</strong>
                <span className="text-muted block">{travellerEmail}</span>
                <span className="text-muted block">{travellerPhone}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Consultant / Account Manager</span>
                <strong className="text-sm font-serif text-charcoal block">{user?.name || 'Staff Travel Consultant'}</strong>
                <span className="text-muted block">{user?.email || 'consultant@travelos.example'}</span>
                <span className="text-muted block">Direct line: +91 484 221 8000</span>
              </div>
            </div>

            {/* Journey Highlights */}
            {selectedPkg && (
              <div className="py-6 border-b border-sand space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-xl font-bold text-forest">{selectedPkg.name}</h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sand/60 text-charcoal">
                    {selectedPkg.durationDays || 5} Days / {(selectedPkg.durationDays || 5) - 1} Nights
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {selectedPkg.summary || 'A bespoke handcrafted journey through Kerala’s premier destinations.'}
                </p>
                <div className="flex gap-4 text-xs text-muted pt-1">
                  <span>📍 Destination: <strong>{selectedPkg.destination || 'Kerala'}</strong></span>
                  <span>🏨 Stay Tier: <strong>{selectedPkg.hotelCategory || '4-Star Boutique Stays'}</strong></span>
                  <span>👥 Party Size: <strong>{guests} Travellers</strong></span>
                </div>
              </div>
            )}

            {/* Inclusions & Notes */}
            {notes && (
              <div className="py-6 border-b border-sand space-y-2 text-xs">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted">Custom Inclusions &amp; Experience Highlights</h4>
                <div className="p-3 bg-cream rounded-xl border border-sand/60 leading-relaxed text-charcoal/90">
                  {notes}
                </div>
              </div>
            )}

            {/* Detailed Financial Breakdown Table */}
            <div className="py-6 space-y-4">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted">Investment &amp; Pricing Breakdown</h4>
              <table className="w-full text-left text-xs divide-y divide-sand">
                <thead className="bg-sand/30 font-semibold text-muted uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Basis</th>
                    <th className="p-3 text-center">Qty / Pax</th>
                    <th className="p-3 text-right">Rate (INR)</th>
                    <th className="p-3 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/50">
                  <tr>
                    <td className="p-3">
                      <strong>{selectedPkg?.name || 'Selected Package'}</strong>
                      <span className="block text-[11px] text-muted">Plan: {selectedSeasonName}</span>
                    </td>
                    <td className="p-3 text-center text-muted">Twin-Sharing</td>
                    <td className="p-3 text-center font-bold">{guests}</td>
                    <td className="p-3 text-right">₹{ratePerPerson.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-semibold">₹{subtotal.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="p-3 text-right text-muted font-medium">
                      Subtotal (Tour Package)
                    </td>
                    <td className="p-3 text-right font-semibold">₹{subtotal.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="p-3 text-right text-muted font-medium">
                      Goods &amp; Services Tax (GST 5% per Indian Tour Operator Regulations)
                    </td>
                    <td className="p-3 text-right font-semibold text-muted">₹{gstAmount.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-sand/20 font-bold text-sm">
                    <td colSpan="4" className="p-4 text-right text-charcoal uppercase tracking-wider font-serif">
                      Total Guaranteed Price (INR)
                    </td>
                    <td className="p-4 text-right text-forest font-serif text-lg">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[10px] text-muted italic">
                * Prices are all-inclusive of taxes, AC private chauffeur, accommodation, and specified meals. No hidden surcharges.
              </p>
            </div>

            {/* Document Footer & Sign-off */}
            <div className="pt-8 border-t-2 border-sand flex flex-wrap items-end justify-between gap-6 text-xs text-muted">
              <div>
                <p className="font-semibold text-charcoal">Terms of Acceptance:</p>
                <p className="text-[11px]">To confirm this itinerary, reply to your consultant or transfer the initial deposit before {validUntilDate}.</p>
              </div>
              <div className="text-right">
                <div className="h-8 border-b border-charcoal/40 w-44 mb-1"></div>
                <span className="text-[10px] uppercase font-semibold text-charcoal">Authorized Signature</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

