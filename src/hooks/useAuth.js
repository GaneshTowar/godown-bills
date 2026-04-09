import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUser({ username: data.username });
                } else {
                    router.replace('/login');
                }
            })
            .catch(() => router.replace('/login'))
            .finally(() => setLoading(false));
    }, []);

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.replace('/login');
    };

    return { user, loading, logout };
};
