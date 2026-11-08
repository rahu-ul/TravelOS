import { Route, Routes, Navigate } from 'react-router-dom';
import HomePage from './public/pages/HomePage.jsx';
import PackagesPage from './public/pages/PackagesPage.jsx';
import PackageDetailsPage from './public/pages/PackageDetailsPage.jsx';
import DestinationsPage from './public/pages/DestinationsPage.jsx';
import StoriesPage from './public/pages/StoriesPage.jsx';
import StoryDetailsPage from './public/pages/StoryDetailsPage.jsx';
import ContactPage from './public/pages/ContactPage.jsx';
import AboutPage from './public/pages/AboutPage.jsx';
import AdminLoginPage from './admin/pages/AdminLoginPage.jsx';
import AdminPackagesPage from './admin/pages/AdminPackagesPage.jsx';
import AdminEnquiriesPage from './admin/pages/AdminEnquiriesPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/packages" element={<PackagesPage />} />
      <Route path="/packages/:slug" element={<PackageDetailsPage />} />
      <Route path="/destinations" element={<DestinationsPage />} />
      <Route path="/destinations/:slug" element={<DestinationsPage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/stories/:slug" element={<StoryDetailsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />

      {/* Staff Admin & CMS Routes */}
      <Route path="/admin" element={<Navigate to="/admin/packages" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/packages" element={<AdminPackagesPage />} />
      <Route path="/admin/enquiries" element={<AdminEnquiriesPage />} />
      <Route
        path="*"
        element={
          <main className="min-h-screen flex items-center justify-center bg-ivory">
            <div className="text-center">
              <p className="text-6xl mb-4">🌿</p>
              <h1 className="font-serif text-3xl text-charcoal mb-3">Page not found</h1>
              <a href="/" className="text-forest text-sm font-medium hover:underline">
                ← Back to home
              </a>
            </div>
          </main>
        }
      />
    </Routes>
  );
}
