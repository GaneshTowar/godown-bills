import '../styles/global.css';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';

const PUBLIC_ROUTES = ['/login', '/party-login', '/party-portal'];

function AuthWrapper({ children }) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
                Loading...
            </div>
        );
    }

    return children;
}

function MyApp({ Component, pageProps }) {
    const router = useRouter();
    const isPublic = PUBLIC_ROUTES.includes(router.pathname);

    if (isPublic) {
        return <Component {...pageProps} />;
    }

    return (
        <AuthWrapper>
            <Header />
            <Component {...pageProps} />
        </AuthWrapper>
    );
}

export default MyApp;
