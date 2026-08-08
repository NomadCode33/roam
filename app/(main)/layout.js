import "../../css/shared-templates/nav.css"
import "../../css/shared-templates/footer.css"
import "../../css/landing-auth/landing.css"
import Nav from '../../components/shared-templates/Nav';
import Footer from '../../components/shared-templates/Footer';

export default function MainLayout({ children }) {
  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}