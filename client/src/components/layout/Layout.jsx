import { useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function Layout({ children }) {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* key re-triggers the short fade-in whenever the route changes */}
      <main key={pathname} className="page-in flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
