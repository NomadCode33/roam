import "../../css/shared-templates/nav.css"
import "../../css/shared-templates/footer.css"
import "../../css/landing-auth/auth.css"
import AuthNav from '../../components/shared-templates/AuthNav';
import AuthFooter from '../../components/shared-templates/AuthFooter';

export default function AuthLayout({ children }) {
  return (
    <>
      <AuthNav />
      <main className="auth-content">{children}</main>
      <AuthFooter />
    </>
  );
}