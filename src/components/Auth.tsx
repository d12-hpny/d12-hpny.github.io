import { useState } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Auth = () => {
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Redirect to the current URL so the code/wheel context is preserved
                    redirectTo: window.location.href
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in:', error);
            toast.error('Không thể tải đăng nhập. Vui lòng thử lại.');
        } finally {
            setLoading(false);
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
