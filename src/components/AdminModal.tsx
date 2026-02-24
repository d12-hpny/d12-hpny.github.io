import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Save } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { toast } from 'sonner'

interface Prize {
    id: string;
    label: string;
    stock: number;
    color: string;
    text: string;
    probability: number;
}

interface User {
    email: string;
    code?: string;
    settings?: {
        prizes?: Prize[];
        is_paused?: boolean;
        start_time?: string;
        end_time?: string;
    };
}

interface AdminModalProps {
    user?: User;
}

const INITIAL_PRIZES = [
    { id: '50k', label: '50,000 VNĐ', stock: 0, color: '#FFD700', text: '#D2042D', probability: 0.4 },
    { id: '100k', label: '100,000 VNĐ', stock: 0, color: '#FFFDD0', text: '#D2042D', probability: 0.3 },
    { id: '200k', label: '200,000 VNĐ', stock: 0, color: '#FFD700', text: '#D2042D', probability: 0.2 },
    { id: '500k', label: '500,000 VNĐ', stock: 0, color: '#FFFDD0', text: '#D2042D', probability: 0.1 },
];

export function AdminModal({ user }: AdminModalProps) {
    const [prizes, setPrizes] = useState(user?.settings?.prizes || INITIAL_PRIZES);
    const [wheelCode, setWheelCode] = useState<string | null>(user?.code || null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPaused, setIsPaused] = useState(user?.settings?.is_paused || false);
    const [startTime, setStartTime] = useState(user?.settings?.start_time || '');
    const [endTime, setEndTime] = useState(user?.settings?.end_time || '');

    // Update prizes if user data changes (fetched from DB)
    useEffect(() => {
        if (user?.settings?.prizes) {
            setPrizes(user.settings.prizes);
        }
        if (user?.code) {
            setWheelCode(user.code);
        }
        if (user?.settings?.is_paused !== undefined) {
            setIsPaused(user.settings.is_paused);
        }
        if (user?.settings?.start_time) {
            setStartTime(user.settings.start_time);
        }
        if (user?.settings?.end_time) {
            setEndTime(user.settings.end_time);
        }
    }, [user]);

    const handleStockChange = (id: string, newStock: string) => {
        setPrizes(prizes.map((p) => p.id === id ? { ...p, stock: parseInt(newStock) || 0 } : p));
    };

    const handleCreateCode = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc('generate_wheel_code', { user_email: user?.email });
            if (error) throw error;
            setWheelCode(data);
            toast.success(`Mã vòng quay đã được tạo: ${data}`);
        } catch (error) {
            console.error("Error generating code:", error);
            toast.error("Lỗi khi tạo mã. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // 1. Guard against unauthorized saves if a code exists
            if (wheelCode && user?.code && user.code !== wheelCode) {
                toast.error("Bạn không có quyền thay đổi cài đặt của vòng quay này.");
                setIsLoading(false);
                return;
            }

            // 2. Prepare updates (only settings, code is already saved via RPC)
            const updates = {
                settings: {
                    prizes: prizes,
                    enabled: true,
                    is_paused: isPaused,
                    start_time: startTime || null,
                    end_time: endTime || null
                }
            };

            // 3. Call Supabase implementation to update user
            const { error } = await supabase.from('users').update(updates).eq('email', user?.email || '');

            if (error) throw error;

            toast.success(`Đã lưu! Mã vòng quay của bạn: ${wheelCode}`);
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Có lỗi xảy ra khi lưu cài đặt.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-8 w-8">
                    <Settings className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle>Cài đặt</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full flex-1 overflow-hidden flex flex-col px-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">Điều khiển</TabsTrigger>
                        <TabsTrigger value="prizes">Giải thưởng</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="flex-1 overflow-y-auto pr-2">
                        <div className="space-y-4 py-3">
                            {/* State 1: Not Created */}
                            {!wheelCode ? (
                                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center space-y-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                        <Settings className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">Chưa có vòng quay nào</h3>
                                        <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                                            Bạn cần tạo một vòng quay mới để bắt đầu chương trình Lì Xì.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleCreateCode}
                                        disabled={isLoading}
                                        className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 shadow-lg hover:shadow-xl transition-all font-bold text-lg mt-4"
                                    >
                                        TẠO VÒNG QUAY NGAY
                                    </Button>
                                </div>
                            ) : (
                                /* State 2: Created / Activated */
                                <div className="space-y-4">
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="text-sm font-bold text-green-800 uppercase">Trạng thái: Đang hoạt động</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-gray-600 text-sm">Mã tham gia:</span>
                                                <span className="font-mono text-xl font-bold text-red-600 tracking-wider bg-white px-3 py-1 rounded border border-red-100 shadow-sm">
                                                    {wheelCode}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="border-green-300 text-green-700 hover:bg-green-100 bg-white"
                                            onClick={async () => {
                                                const link = `${window.location.origin}/#/${wheelCode}`;
                                                if (navigator.share) {
                                                    try {
                                                        await navigator.share({
                                                            title: 'Lì Xì Tết 2026 | VTI',
                                                            text: 'Tham gia vòng quay Lì Xì may mắn!',
                                                            url: link
                                                        });
                                                    } catch (err) {
                                                        if ((err as Error).name !== 'AbortError') {
                                                            navigator.clipboard.writeText(link);
                                                            toast.success(`Đã copy link: ${link}`);
                                                        }
                                                    }
                                                } else {
                                                    navigator.clipboard.writeText(link);
                                                    toast.success(`Đã copy link: ${link}`);
                                                }
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
                                            Chia sẻ link vòng quay
                                        </Button>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-blue-900 uppercase mb-1">Tạm dừng vòng quay</h3>
                                                <p className="text-xs text-blue-700/80 max-w-sm">
                                                    Bật tính năng này để tạm khóa vòng quay khi bạn muốn sửa đổi danh sách giải thưởng hoặc tạm nghỉ. Người chơi sẽ thấy thông báo "Đang tạm dừng".
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={isPaused}
                                                onClick={() => setIsPaused(!isPaused)}
                                                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${isPaused ? 'bg-red-500' : 'bg-blue-500'}`}
                                            >
                                                <span className="sr-only">Tạm dừng</span>
                                                <span
                                                    aria-hidden="true"
                                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPaused ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </button>
                                        </div>
                                        {isPaused && (
                                            <div className="mt-3 text-sm text-red-600 font-medium flex items-center gap-2 bg-red-100/50 p-2 rounded-lg border border-red-200">
                                                <span>⏸️</span> Vòng quay hiện đang bị khóa. Người chơi không thể quay lúc này.
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-purple-900 uppercase mb-3">Thời gian sự kiện</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="start_time" className="text-xs font-bold text-purple-800">Thời gian bắt đầu</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="start_time"
                                                        type="datetime-local"
                                                        step="300"
                                                        value={startTime}
                                                        onChange={(e) => setStartTime(e.target.value)}
                                                        className="w-full pl-3 pr-4 py-2.5 text-sm bg-white border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-lg shadow-sm transition-all text-gray-700 font-medium hover:border-purple-300 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="end_time" className="text-xs font-bold text-purple-800">Thời gian kết thúc</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="end_time"
                                                        type="datetime-local"
                                                        step="300"
                                                        value={endTime}
                                                        onChange={(e) => setEndTime(e.target.value)}
                                                        className="w-full pl-3 pr-4 py-2.5 text-sm bg-white border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-lg shadow-sm transition-all text-gray-700 font-medium hover:border-purple-300 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-purple-600 mt-3 flex items-center gap-1.5">
                                            💡 <span className="italic">Gợi ý: Nếu để trống cả hai ô, vòng quay sẽ hoạt động mãi mãi miễn là không bị Tạm dừng.</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="prizes" className="flex-1 overflow-y-auto pr-2">
                        <div className="space-y-4 py-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium">Cấu hình giải thưởng</h3>
                                <div className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                                    Tổng: {prizes.reduce((acc: number, p) => {
                                        let val = 0;
                                        if (p.id === '50k') val = 50000;
                                        if (p.id === '100k') val = 100000;
                                        if (p.id === '200k') val = 200000;
                                        if (p.id === '500k') val = 500000;
                                        return acc + (val * (p.stock > 0 ? p.stock : 0));
                                    }, 0).toLocaleString('vi-VN')} VNĐ
                                </div>
                            </div>
                            <div className="grid gap-4 border rounded-lg p-4 bg-gray-50">
                                {prizes.filter((p) => p.stock !== -1).map((prize) => (
                                    <div key={prize.id} className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor={prize.id} className="text-right col-span-1 font-bold text-gray-700">
                                            {prize.label}
                                        </Label>
                                        <div className="col-span-2 flex items-center gap-2">
                                            <Input
                                                id={prize.id}
                                                type="number"
                                                value={prize.stock}
                                                onChange={(e) => handleStockChange(prize.id, e.target.value)}
                                                className="w-24 border-gray-300 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center font-bold text-gray-800 transition-all shadow-sm"
                                            />
                                            <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded shadow-sm border border-gray-100">lượt</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 text-center mb-4">
                                *Số lượng giải thưởng sẽ giảm dần khi có người trúng.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Action Buttons - Always visible */}
                <div className="flex justify-end gap-2 border-t pt-4 px-6 pb-4 bg-white">
                    <Button variant="outline" onClick={() => setPrizes(INITIAL_PRIZES)} disabled={isLoading}>
                        Reset mặc định
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                        <Save className="w-4 h-4" />
                        {isLoading ? "Đang lưu..." : (wheelCode ? "Lưu cấu hình" : "Kích hoạt & Lưu")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
