import '../styles/globals.css'  // Make sure this line exists
import AuthErrorBoundary from '../components/AuthErrorBoundary';
import { AuthProvider } from '../contexts/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AuthErrorBoundary>
        <Component {...pageProps} />
      </AuthErrorBoundary>
    </AuthProvider>
  );
}

export default MyApp;