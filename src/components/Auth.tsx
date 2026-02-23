import { useState } from 'react';
import { Button } from './ui/button';

interface UserInfo {
    email: string;
    name: string;
    picture?: string;
}

interface AuthProps {
    onLogin: (user: UserInfo) => void;
}

interface GoogleTokenResponse {
    access_token?: string;
}

declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: {
                        client_id: string;
                        scope: string;
                        callback: (response: GoogleTokenResponse) => void;
                    }) => { requestAccessToken: () => void };
                };
            };
        };
    }
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = () => {
        setLoading(true);

        if (window.google) {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                scope: 'email profile openid',
                callback: async (response: GoogleTokenResponse) => {
                    if (response.access_token) {
                        try {
                            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                headers: { Authorization: `Bearer ${response.access_token}` },
                            });
                            const userInfo = await userInfoResponse.json();
                            onLogin(userInfo);
                        } catch (error) {
                            alert('Không thể lấy thông tin người dùng. Vui lòng thử lại.');
                        } finally {
                            setLoading(false);
                        }
                    } else {
                        setLoading(false);
                    }
                },
            });
            client.requestAccessToken();
        } else {
            // Google script not loaded
            setLoading(false);
            alert('Không thể tải Google Sign-In. Vui lòng kiểm tra kết nối mạng và thử lại.');
        }
    };

    return (
        <div className="flex flex-col items-center">
            <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="bg-white text-red-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-full shadow-lg border-2 border-yellow-500 transition-transform transform hover:scale-105"
            >
                {loading ? "Đang kết nối..." : "Đăng nhập bằng Google"}
            </Button>
        </div>
    );
};

export default Auth;
