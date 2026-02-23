import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Sparkles, Gift } from 'lucide-react';
import { supabase, checkUserHasPlayed } from '@/lib/supabase';

interface User {
    email: string;
    name: string;
    avatar_url?: string;
    picture?: string;
}

interface HostSettings {
    is_paused?: boolean;
    start_time?: string;
    end_time?: string;
}

interface SpinWheelProps {
    onFinish: (result: { label: string; spinId: string }) => void;
    prizes?: { id: string; label: string; color?: string; text?: string }[];
    wheelCode?: string;
    user?: User;
    hostSettings?: HostSettings;
}

const DEFAULT_PRIZES = [
    { id: '50k', label: '50k', stock: 50, color: '#FFD700', text: '#D2042D', probability: 0.4 },
    { id: '100k', label: '100k', stock: 20, color: '#FFFDD0', text: '#D2042D', probability: 0.3 },
    { id: '200k', label: '200k', stock: 10, color: '#FFD700', text: '#D2042D', probability: 0.2 },
    { id: '500k', label: '500k', stock: 5, color: '#FFFDD0', text: '#D2042D', probability: 0.1 },
];

const SpinWheel: React.FC<SpinWheelProps> = ({ onFinish, prizes = DEFAULT_PRIZES, wheelCode, user, hostSettings }) => {
    const [spinning, setSpinning] = useState(false);
    const wheelRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState(0);
    const [hasPlayed, setHasPlayed] = useState(false);
    const [checkingPlayed, setCheckingPlayed] = useState(true);

    // Check if user has already played when component mounts or user/wheelCode changes
    useEffect(() => {
        const checkPlayed = async () => {
            if (user?.email && wheelCode) {
                setCheckingPlayed(true);
                const played = await checkUserHasPlayed(user.email, wheelCode);
                setHasPlayed(played);
                setCheckingPlayed(false);
            } else {
                setCheckingPlayed(false);
            }
        };
        checkPlayed();
    }, [user?.email, wheelCode]);

    // Helper function to check if current time is outside the event time range
    const isOutsideTimeRange = () => {
        if (hostSettings?.start_time) {
            const startTime = new Date(hostSettings.start_time);
            const now = new Date();
            if (now < startTime) return true;
        }
        if (hostSettings?.end_time) {
            const endTime = new Date(hostSettings.end_time);
            const now = new Date();
            if (now > endTime) return true;
        }
        return false;
    };

    // Helper function to get appropriate button text based on state
    const getButtonText = () => {
        if (checkingPlayed) return "Đang kiểm tra...";
        if (spinning) return "Đang quay...";
        if (!wheelCode) return "⚠️ Cần truy cập đúng URL";
        if (hasPlayed) return "🎁 Bạn đã quay rồi";
        if (hostSettings?.is_paused) return "⏸️ Tạm dừng";
        
        if (hostSettings?.start_time) {
            const startTime = new Date(hostSettings.start_time);
            const now = new Date();
            if (now < startTime) {
                return `⏰ Bắt đầu ${startTime.toLocaleString('vi-VN', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}`;
            }
        }
        
        if (hostSettings?.end_time) {
            const endTime = new Date(hostSettings.end_time);
            const now = new Date();
            if (now > endTime) return "🏁 Đã kết thúc";
        }
        
        return (
            <span className="flex items-center gap-2">
                <Sparkles className="w-6 h-6" /> QUAY NGAY <Sparkles className="w-6 h-6" />
            </span>
        );
    };

    const spin = async () => {
        if (spinning) return;
        
        // 1. Check wheel code exists in URL
        if (!wheelCode) {
            alert("⚠️ Vui lòng truy cập đường dẫn có mã vòng quay (VD: /ABC123) để tham gia!");
            return;
        }

        // 2. Check if user has already played
        if (hasPlayed) {
            alert("🎁 Bạn đã quay vòng này rồi! Mỗi người chỉ được quay 1 lần.");
            return;
        }

        // 3. Check if wheel is paused
        if (hostSettings?.is_paused === true) {
            alert("⏸️ Vòng quay đang tạm dừng. Vui lòng chờ host mở lại!");
            return;
        }

        // 3. Check start time
        if (hostSettings?.start_time) {
            const startTime = new Date(hostSettings.start_time);
            const now = new Date();
            if (now < startTime) {
                alert(`⏰ Sự kiện chưa bắt đầu. Vui lòng quay lại sau ${startTime.toLocaleString('vi-VN')}!`);
                return;
            }
        }

        // 4. Check end time
        if (hostSettings?.end_time) {
            const endTime = new Date(hostSettings.end_time);
            const now = new Date();
            if (now > endTime) {
                alert(`🏁 Sự kiện đã kết thúc vào ${endTime.toLocaleString('vi-VN')}!`);
                return;
            }
        }

        const playerName = user?.name || "Khách";
        const playerEmail = user?.email || "";
        const playerAvatar = user?.avatar_url || user?.picture || "";

        // 1. Start Animation Immediately (Fake Spin)
        setSpinning(true);
        // Rotate significantly to simulate high speed
        const fakeTarget = rotation + 360 * 10 + Math.random() * 360;
        setRotation(fakeTarget);

        try {
            // 2. Call RPC Function to get result
            const { data, error } = await supabase.rpc('spin_wheel', {
                wheel_code: wheelCode,
                player_name: playerName,
                player_email: playerEmail,
                player_avatar: playerAvatar
            });

            if (error) throw error;
            if (!data) throw new Error("Không nhận được kết quả từ server");

            // 3. Process Result
            const wonPrize = data.prize;

            // Find index
            const prizeIndex = prizes.findIndex(p => p.id === wonPrize.id);
            if (prizeIndex === -1) {
                console.error("Prize mismatch:", wonPrize);
                setSpinning(false);
                return;
            }

            // 4. Calculate Final Landing
            // Segment Angle
            const segmentAngle = 360 / prizes.length;

            // Prize Center relative to 0deg (3 o'clock)
            // But visually, the wheel is generated starting from 0deg.
            // If Index 0 is at 0-X deg.
            // Let's refine the math for "Pointer at Top (270deg)".
            // Angle of center of target segment:
            const indexAngle = prizeIndex * segmentAngle + (segmentAngle / 2);

            // We want (FinalRotation + indexAngle) % 360  == 270 (Top)
            // FinalRotation = K * 360 + 270 - indexAngle

            // Current visual state is 'fakeTarget'.
            // Let's find the nearest K * 360 that is > fakeTarget.

            // We need to ensure we don't reverse.
            // We want to calculate the specific remainder.

            // The "remainder" of rotation needed is (270 - indexAngle). 
            // If negative, normalize to positive (0-360).
            let targetRemainder = (270 - indexAngle) % 360;
            if (targetRemainder < 0) targetRemainder += 360;

            // Current rotation remainder
            const currentRemainder = rotation % 360;

            // Calculate delta to reach target remainder
            let delta = targetRemainder - currentRemainder;
            if (delta < 0) delta += 360;

            // Final target
            // Add extra full spins + the delta
            const finalRotation = rotation - (rotation % 360) + 360 * 5 + targetRemainder;

            // Update rotation to the *real* target
            setRotation(finalRotation);

            // Wait for animation to finish (approx 5s from now?)
            // We set duration 5s.
            setTimeout(() => {
                setSpinning(false);
                onFinish({ label: wonPrize.label, spinId: data.spin_id });
            }, 5500); // slightly longer than transition

        } catch (err) {
            console.error("Spin error:", err);
            // User-friendly error messages
            const errorMsg = (err as Error).message || "Vui lòng thử lại";
            if (errorMsg.includes("tạm dừng") || errorMsg.includes("paused")) {
                alert("⏸️ Vòng quay đang tạm dừng. Vui lòng chờ host mở lại!");
            } else if (errorMsg.includes("chưa bắt đầu")) {
                alert("⏰ Sự kiện chưa bắt đầu. Vui lòng quay lại sau!");
            } else if (errorMsg.includes("đã kết thúc")) {
                alert("🏁 Sự kiện đã kết thúc!");
            } else {
                alert("Lỗi lượt quay: " + errorMsg);
            }
            setSpinning(false);
            // Reset rotation to allow another attempt
            setRotation(rotation % 360);
        }
    };

    return (
        <div className="flex flex-col items-center relative">
            {/* Status Banner */}
            {!wheelCode && (
                <div className="mb-4 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg">
                    ⚠️ Cần truy cập URL có mã vòng quay (VD: /ABC123)
                </div>
            )}
            {wheelCode && (hostSettings?.is_paused || isOutsideTimeRange()) && (
                <div className="mb-4 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg animate-pulse">
                    {hostSettings?.is_paused ? "⏸️ Vòng quay đang tạm dừng" : 
                     hostSettings?.start_time && new Date() < new Date(hostSettings.start_time) ? "⏰ Sự kiện chưa bắt đầu" :
                     "🏁 Sự kiện đã kết thúc"}
                </div>
            )}
            
            <div className="relative w-80 h-80 md:w-96 md:h-96">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 w-8 h-10 bg-gradient-to-b from-yellow-300 to-yellow-600 clip-path-polygon shadow-md border-2 border-white" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>

                {/* Wheel */}
                <div
                    ref={wheelRef}
                    className="w-full h-full rounded-full border-4 border-yellow-500 shadow-2xl overflow-hidden transition-transform cubic-bezier(0.25, 0.1, 0.25, 1)"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transitionDuration: '5s',
                        background: 'conic-gradient(from 0deg at 50% 50%, ' +
                            prizes.map((p, i) => `${p.color || (i % 2 === 0 ? '#FFD700' : '#FFFDD0')} ${(i * 100) / prizes.length}%, ${p.color || (i % 2 === 0 ? '#FFD700' : '#FFFDD0')} ${((i + 1) * 100) / prizes.length}%`).join(', ') +
                            ')'
                    }}
                >
                    {prizes.map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-0 left-1/2 w-full h-full -translate-x-1/2 origin-bottom flex justify-center pt-8"
                            style={{
                                transform: `rotate(${i * (360 / prizes.length)}deg)`,
                                clipPath: 'polygon(50% 50%, 0 0, 100% 0)', // This clip path might be tricky for segment text placement
                                // Alternative: Use conic gradient for background and just place text absolute
                            }}
                        >
                            {/* Text positioning is tricky with simple CSS rotation of container. 
                    Better approach: separate text container rotated. 
                */}
                        </div>
                    ))}

                    {/* Text Layer - Simplified for robustness */}
                    {prizes.map((prize, i) => (
                        <div
                            key={i}
                            className="absolute w-full h-full text-center flex justify-center font-bold text-lg"
                            style={{
                                transform: `rotate(${i * (360 / prizes.length) + (360 / prizes.length) / 2}deg)`, // Rotate to center of segment
                            }}
                        >
                            <span className="mt-8 transform" style={{ color: prize.text || '#D2042D' }}>{prize.label}</span>
                        </div>
                    ))}
                </div>

                {/* Center Knob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-yellow-400 to-red-600 rounded-full shadow-inner border-4 border-yellow-200 z-10 flex items-center justify-center">
                    <Gift className="w-8 h-8 text-white" />
                </div>
            </div>

            <Button
                onClick={spin}
                disabled={checkingPlayed || spinning || !wheelCode || hasPlayed || hostSettings?.is_paused || isOutsideTimeRange()}
                size="lg"
                className={cn(
                    "mt-12 text-2xl px-12 py-8 rounded-full font-festive font-black tracking-wider shadow-2xl border-4 border-yellow-300",
                    (checkingPlayed || spinning || !wheelCode || hasPlayed || hostSettings?.is_paused || isOutsideTimeRange())
                        ? "bg-gray-400 cursor-not-allowed border-gray-500"
                        : "bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-yellow-300 animate-pulse"
                )}
            >
                {getButtonText()}
            </Button>
        </div>
    );
};

export default SpinWheel;
