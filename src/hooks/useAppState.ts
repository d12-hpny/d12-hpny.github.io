import { useState, useEffect } from 'react';
import { supabase, getUserState, getHostByCode } from '@/lib/supabase';

interface Prize {
    id: string;
    label: string;
    stock: number;
    color: string;
    text: string;
    probability: number;
}

interface UserSettings {
    prizes?: Prize[];
    enabled?: boolean;
    is_paused?: boolean;
    start_time?: string;
    end_time?: string;
}

export interface User {
    email: string;
    name: string;
    picture?: string;
    avatar_url?: string;
    code?: string;
    settings?: UserSettings;
}

export type GameState = 'IDLE' | 'PLAYING' | 'CLAIMING' | 'FINISHED' | 'LOADING';

export function useAppState(code?: string) {
    const [user, setUser] = useState<User | null>(null);
    const [host, setHost] = useState<User | null>(null);
    const [gameState, setGameState] = useState<GameState>('LOADING');
    const [error, setError] = useState<string>('');
    const [showPendingAlert, setShowPendingAlert] = useState(false);

    useEffect(() => {
        const loadHostAndUser = async () => {
            // Check Supabase session
            const { data: { session } } = await supabase.auth.getSession();
            let currentUser: User | null = null;

            if (session?.user) {
                const email = session.user.email;
                const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email?.split('@')[0] || 'User';
                const picture = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;

                const userInfo = { email: email!, name, picture };
                const dbUser = await getUserState(email!, userInfo);
                if (dbUser) {
                    currentUser = { ...userInfo, ...dbUser } as User;
                } else {
                    currentUser = userInfo as User;
                }
                setUser(currentUser);
            } else {
                setUser(null);
            }

            // Load Host Data if code is present
            if (code) {
                const hostData = await getHostByCode(code);
                if (hostData) {
                    setHost(hostData as User);
                    if (currentUser) {
                        setGameState('PLAYING');
                    } else {
                        setGameState('IDLE');
                    }
                } else {
                    setError('Mã vòng quay không hợp lệ hoặc không tồn tại.');
                    setGameState('IDLE');
                }
            } else {
                // Landing page mode (Admin/Create)
                if (currentUser) {
                    setGameState('PLAYING');
                    setTimeout(() => setShowPendingAlert(true), 1500);
                } else {
                    setGameState('IDLE');
                }
            }
        };

        loadHostAndUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            loadHostAndUser();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [code]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // State updates will be handled by the onAuthStateChange listener
    };

    return {
        user,
        host,
        gameState,
        setGameState,
        error,
        showPendingAlert,
        setShowPendingAlert,
        handleLogout
    };
}
