import { Route, Routes, Navigate } from 'react-router-dom';
import HomePage from './public/pages/HomePage.jsx';
import PackagesPage from './public/pages/PackagesPage.jsx';
import PackageDetailsPage from './public/pages/PackageDetailsPage.jsx';
import DestinationsPage from './public/pages/DestinationsPage.jsx';
import StoriesPage from './public/pages/StoriesPage.jsx';
import StoryDetailsPage from './public/pages/StoryDetailsPage.jsx';
import ContactPage from './public/pages/ContactPage.jsx';
import AboutPage from './public/pages/AboutPage.jsx';
import NotFoundPage from './public/pages/NotFoundPage.jsx';

// Traveller Auth & Dashboard
import LoginPage from './public/pages/LoginPage.jsx';
import SignupPage from './public/pages/SignupPage.jsx';
import TravellerDashboardPage from './public/pages/TravellerDashboardPage.jsx';

// Staff Admin & CMS Pages
import AdminLoginPage from './admin/pages/AdminLoginPage.jsx';
import AdminDashboardPage from './admin/pages/AdminDashboardPage.jsx';
import AdminPackagesPage from './admin/pages/AdminPackagesPage.jsx';
import AdminEnquiriesPage from './admin/pages/AdminEnquiriesPage.jsx';
import AdminStoriesPage from './admin/pages/AdminStoriesPage.jsx';
import AdminQuotesPage from './admin/pages/AdminQuotesPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/packages" element={<PackagesPage />} />
      <Route path="/packages/:slug" element={<PackageDetailsPage />} />
      <Route path="/destinations" element={<DestinationsPage />} />
      <Route path="/destinations/:slug" element={<DestinationsPage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/stories/:slug" element={<StoryDetailsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />

      {/* Traveller Authentication & Dashboard */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<TravellerDashboardPage />} />

      {/* Staff Admin & CMS Routes */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/packages" element={<AdminPackagesPage />} />
      <Route path="/admin/stories" element={<AdminStoriesPage />} />
      <Route path="/admin/enquiries" element={<AdminEnquiriesPage />} />
      <Route path="/admin/quotes" element={<AdminQuotesPage />} />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
