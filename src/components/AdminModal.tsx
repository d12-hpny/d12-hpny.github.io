import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Save } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"

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
            alert(`Mã vòng quay đã được tạo: ${data}`);
        } catch (error) {
            console.error("Error generating code:", error);
            alert("Lỗi khi tạo mã. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // 1. Ensure code exists
            const codeToSave = wheelCode;
            if (!codeToSave) {
                alert("Vui lòng tạo mã vòng quay trước!");
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
            console.log("Saving to Supabase:", updates);

            const { error } = await supabase.from('users').update(updates).eq('email', user?.email || '');

            if (error) throw error;

            alert(`Đã lưu! Mã vòng quay của bạn: ${codeToSave}`);
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Có lỗi xảy ra khi lưu cài đặt.");
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
                        <div className="space-y-3 py-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-yellow-800 uppercase">Trạng thái vòng quay</h3>
                                        {!wheelCode && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-6 px-2 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                                                onClick={handleCreateCode}
                                            >
                                                Create
                                            </Button>
                                        )}
                                    </div>
                                    {wheelCode ? (
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Đang hoạt động</span>
                                    ) : (
                                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Chưa kích hoạt</span>
                                    )}
                                </div>

                                {wheelCode ? (
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm text-gray-600">Mã tham gia:</div>
                                        <div className="font-mono text-xl font-bold text-red-600 tracking-wider bg-white px-3 py-1 rounded border border-red-100">
                                            {wheelCode}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="ml-2 h-8 w-8 p-0 border-yellow-300 text-yellow-700 hover:bg-yellow-100 rounded-full"
                                            onClick={() => {
                                                const link = `${window.location.origin}/${wheelCode}`;
                                                navigator.clipboard.writeText(link);
                                                alert(`Đã copy link: ${link}`);
                                            }}
                                            title="Copy Link Share"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-600">
                                        Bấm <b>Create</b> để tạo mã vòng quay ngẫu nhiên.
                                    </p>
                                )}
                            </div>

                            {wheelCode && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <h3 className="text-sm font-bold text-blue-800 uppercase mb-2">Điều khiển vòng quay</h3>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium">Tạm dừng vòng quay</Label>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={isPaused}
                                            onClick={() => setIsPaused(!isPaused)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                                isPaused ? 'bg-red-600' : 'bg-green-600'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    isPaused ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        {isPaused ? '⏸️ Đã tạm dừng - Không ai có thể quay' : '▶️ Đang hoạt động - Mọi người có thể quay'}
                                    </p>
                                </div>
                            )}

                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <h3 className="text-sm font-bold text-purple-800 uppercase mb-2">Thời gian sự kiện</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="start_time" className="text-xs font-medium mb-1 block">Bắt đầu</Label>
                                        <Input
                                            id="start_time"
                                            type="datetime-local"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="end_time" className="text-xs font-medium mb-1 block">Kết thúc</Label>
                                        <Input
                                            id="end_time"
                                            type="datetime-local"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full text-sm"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 mt-2">
                                    💡 Để trống nếu không giới hạn thời gian
                                </p>
                            </div>
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
                                                className="w-24 border-gray-300"
                                            />
                                            <span className="text-xs text-gray-500">lượt</span>
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
