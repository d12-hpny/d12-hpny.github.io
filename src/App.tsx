import Layout from './components/Layout';
import { useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import Auth from './components/Auth';
import SpinWheel from './components/SpinWheel';
import PrizeClaim from './components/PrizeClaim';
import { Button } from './components/ui/button';
import { LogOut } from 'lucide-react';
import { AdminModal } from './components/AdminModal';
import { DebugModal } from './components/DebugModal';
import { WinnersList } from './components/WinnersList';
import { PendingSpinsAlert } from './components/PendingSpinsAlert';

import { getUserState, getHostByCode, uploadPrizeClaim } from '@/lib/supabase';

interface User {
    email: string;
    name: string;
    picture?: string;
    code?: string;
    [key: string]: unknown;
}

function Game() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [host, setHost] = useState<User | null>(null);
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'CLAIMING' | 'FINISHED' | 'LOADING'>('LOADING');
    const [prize, setPrize] = useState<string>('');
    const [currentSpinId, setCurrentSpinId] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [showPendingAlert, setShowPendingAlert] = useState(false);

    // Load Host Data if code is present
    useEffect(() => {
        const loadHostAndUser = async () => {
            // Check if current user is logged in
            const storedUser = localStorage.getItem('lixi_user');
            let currentUser = null;
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                // Refresh user data from Supabase to get 'code'
                const dbUser = await getUserState(currentUser.email, currentUser);
                if (dbUser) {
                    currentUser = { ...currentUser, ...dbUser };
                    setUser(currentUser);
                    localStorage.setItem('lixi_user', JSON.stringify(currentUser));
                } else {
                    setUser(currentUser);
                }
            }

            if (code) {
                const hostData = await getHostByCode(code);
                if (hostData) {
                    setHost(hostData);
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
                    // If user has a code but is at root, maybe we should redirect or just let them play their own?
                    // For now, allow them to manage/play.
                    setGameState('PLAYING');
                    // Check for pending spins after a short delay (for returning users)
                    setTimeout(() => {
                        setShowPendingAlert(true);
                    }, 1500);
                } else {
                    setGameState('IDLE');
                }
            }
        };
        loadHostAndUser();
    }, [code]);

    const handleLogin = async (userInfo: User) => {
        // Optimistic update
        setUser(userInfo);

        // Sync with Supabase (Upsert & Fetch)
        const dbUser = await getUserState(userInfo.email, userInfo);

        let fullUser = userInfo;
        if (dbUser) {
            fullUser = { ...userInfo, ...dbUser };
            setUser(fullUser);
        }
        localStorage.setItem('lixi_user', JSON.stringify(fullUser));

        if (code) {
            // Playing someone else's game
            // Check has_played logic here if needed
            setGameState('PLAYING');
        } else {
            // Landing page - logged in
            setGameState('PLAYING');
        }

        // Check for pending spins after a short delay
        setTimeout(() => {
            setShowPendingAlert(true);
        }, 1000);
    };

    const handleLogout = () => {
        setUser(null);
        setGameState('IDLE');
        localStorage.removeItem('lixi_user');
        navigate('/');
    };

    const handleSpinResult = (result: { label: string; spinId: string }) => {
        setPrize(result.label);
        setCurrentSpinId(result.spinId);
        setTimeout(() => {
            setGameState('CLAIMING');
        }, 1000);
    };

    const handleClaim = async (file: File) => {
        if (!currentSpinId) {
            console.error("No spin ID found");
            return;
        }
        try {
            await uploadPrizeClaim(file, currentSpinId);
            setGameState('FINISHED');
        } catch (error) {
            console.error("Failed to upload claim:", error);
            alert("Có lỗi khi tải ảnh lên. Vui lòng thử lại.");
        }
    };

    const handleSkipClaim = () => {
        // User skips uploading, can upload later via PendingSpinsAlert
        setGameState('PLAYING');
        setPrize('');
        setCurrentSpinId(null);
    };

    const resetGame = () => {
        setGameState('PLAYING');
        setPrize('');
    };

    if (error) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <h1 className="text-2xl text-white font-bold mb-4">{error}</h1>
                    <Button onClick={() => navigate('/')} variant="secondary">Về trang chủ</Button>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">

                {/* User Info / Logout Header */}
                {user && (
                    <div className="absolute top-4 right-4 flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 z-50">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500 flex items-center justify-center font-bold text-white shadow-inner">
                            {user.name.charAt(0)}
                        </div>
                        <span className="text-white font-medium hidden md:inline">{user.name}</span>

                        {/* Only show AdminModal if NO code (Landing) or if User matches Host (Owner) */}
                        {/* Simplified: Always show AdminModal, but maybe restrict features? For now allow all for simplicity/MVP */}
                        <AdminModal user={user} />
                        <DebugModal user={user} />

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="text-white hover:bg-white/20 rounded-full h-8 w-8"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* Loading State */}
                {gameState === 'LOADING' && (
                    <div className="text-white animate-pulse">Đang tải...</div>
                )}

                {/* Game Flow States */}
                {gameState === 'IDLE' && (
                    <div className="z-10 bg-white/10 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/20 shadow-2xl text-center max-w-lg mx-4">
                        <h1 className="text-5xl md:text-7xl font-bold text-yellow-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-2 font-festive">
                            Lì Xì Tết
                        </h1>
                        <div className="text-2xl md:text-3xl text-white font-light tracking-widest mb-8 uppercase">Chúc Mừng Năm Mới</div>

                        {code && host && (
                            <div className="mb-6 bg-red-900/50 p-4 rounded-xl border border-yellow-500/30">
                                <p className="text-yellow-200 text-sm">Vòng quay của</p>
                                <h2 className="text-xl font-bold text-white mb-2">{host.name}</h2>
                                {host.avatar_url && <img src={host.avatar_url} alt={host.name} className="w-12 h-12 rounded-full mx-auto border-2 border-yellow-400" />}
                            </div>
                        )}

                        <div className="bg-white/90 rounded-2xl p-6 shadow-inner mb-6">
                            <p className="text-gray-600 mb-4">Đăng nhập tài khoản Google để tham gia quay thưởng</p>
                            <Auth onLogin={handleLogin} />
                        </div>
                    </div>
                )}

                {gameState === 'PLAYING' && (
                    <div className="z-10 animate-in fade-in slide-in-from-bottom-10 duration-500 flex flex-col items-center w-full">
                        {/* Pass host prizes if available */}
                        <SpinWheel
                            onFinish={handleSpinResult}
                            prizes={host?.settings?.prizes?.length > 0 ? host.settings.prizes : undefined}
                            wheelCode={code}
                            user={user}
                            hostSettings={host?.settings}
                        />
                        <WinnersList wheelCode={code || user?.code} />
                    </div>
                )}

                {gameState === 'CLAIMING' && (
                    <div className="z-20 fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <PrizeClaim 
                            prize={prize} 
                            onClaim={handleClaim}
                            onSkip={handleSkipClaim}
                        />
                    </div>
                )}

                {gameState === 'FINISHED' && (
                    <div className="z-10 bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center max-w-sm border-4 border-green-500 animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🎉</span>
                        </div>
                        <h2 className="text-2xl font-bold text-green-700 mb-2">Thành công!</h2>
                        <p className="text-gray-600 mb-6">Yêu cầu nhận thưởng của bạn đã được gửi. Chúc bạn năm mới An Khang Thịnh Vượng!</p>
                        <Button onClick={resetGame} variant="outline" className="border-red-500 text-red-600 hover:bg-red-50">
                            Quay lại trang chủ
                        </Button>
                    </div>
                )}

                {/* Pending Spins Alert */}
                {showPendingAlert && user && (
                    <PendingSpinsAlert 
                        userEmail={user.email} 
                        onClose={() => setShowPendingAlert(false)}
                    />
                )}
            </div>
        </Layout>
    );
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<Game />} />
            <Route path="/:code" element={<Game />} />
        </Routes>
    );
}

export default App;
