import "../../css/shared-templates/nav.css"
import "../../css/shared-templates/footer.css"
import "../../css/landing-auth/landing.css"
import Nav from '../../components/shared-templates/Nav';
import Footer from '../../components/shared-templates/Footer';
import CookieBanner from '../../components/CookieBanner'

export default function MainLayout({ children }) {
  return (
    <>
      <Nav />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}