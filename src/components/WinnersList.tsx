
import { useEffect, useState } from 'react';
import { Trophy, QrCode, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { getRecentWinners, updateSpinStatus } from '@/lib/supabase';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';


interface Winner {
    id: string;
    winner_name: string;
    winner_avatar?: string;
    winner_email?: string;
    prize_label: string;
    image_url?: string; // QR / Proof image
    created_at: string;
    status?: 'pending' | 'claimed' | 'delivered';
}

interface WinnersListProps {
    wheelCode?: string;
    refreshTrigger?: number;
}

export function WinnersList({ wheelCode, refreshTrigger }: WinnersListProps) {
    const [winners, setWinners] = useState<Winner[]>([]);
    const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [allWinners, setAllWinners] = useState<Winner[]>([]); // For history view
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchWinners = async (limit = 20) => {
        const data = await getRecentWinners(wheelCode, limit);
        if (data) return data;
        return [];
    };

    useEffect(() => {
        // Initial fetch for horizontal list (limit 10)
        const load = async () => {
            const data = await fetchWinners(10);
            setWinners(data);
        };
        load();

        const interval = setInterval(load, 10000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wheelCode, refreshTrigger]);

    const handleOpenHistory = async () => {
        setIsHistoryOpen(true);
        // Load more for history
        const data = await fetchWinners(100);
        setAllWinners(data);
    };

    const handleSelectWinner = (winner: Winner) => {
        setSelectedWinner(winner);
        setIsDetailOpen(true);
    };

    const handleNavigate = (direction: 'next' | 'prev') => {
        if (!selectedWinner) return;
        // Use the list that created the context. If detail opened from horizontal, use 'winners'.
        // If from history, use 'allWinners'. 
        // For simplicity, let's use the list that contains the selected winner.
        const sourceList = isHistoryOpen ? allWinners : winners;

        const currentIndex = sourceList.findIndex(w => w.id === selectedWinner.id);
        if (currentIndex === -1) return;

        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (newIndex >= 0 && newIndex < sourceList.length) {
            setSelectedWinner(sourceList[newIndex]);
        }
    };

    const handleToggleStatus = async () => {
        if (!selectedWinner || isUpdating) return;
        
        setIsUpdating(true);
        try {
            const currentStatus = selectedWinner.status || 'pending';
            const newStatus: 'pending' | 'delivered' = currentStatus === 'delivered' ? 'pending' : 'delivered';
            
            await updateSpinStatus(selectedWinner.id, newStatus);
            
            // Update local state
            const updatedWinner: Winner = { ...selectedWinner, status: newStatus };
            setSelectedWinner(updatedWinner);
            
            // Update in winners list
            setWinners(prev => prev.map(w => w.id === selectedWinner.id ? updatedWinner : w));
            setAllWinners(prev => prev.map(w => w.id === selectedWinner.id ? updatedWinner : w));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Có lỗi khi cập nhật trạng thái!');
        } finally {
            setIsUpdating(false);
        }
    };

    const WinnerDetail = ({ winner }: { winner: Winner }) => (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            {/* Left Column: Info */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 p-1 shadow-xl mb-4">
                    {winner.winner_avatar ? (
                        <img src={winner.winner_avatar} alt={winner.winner_name} className="w-full h-full rounded-full object-cover border-4 border-white" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-red-800 flex items-center justify-center text-white text-3xl font-bold border-4 border-white capitalize">
                            {winner.winner_name.charAt(0)}
                        </div>
                    )}
                </div>
                <h3 className="text-xl font-bold text-red-900 mb-1">{winner.winner_name}</h3>
                <p className="text-sm text-gray-500 mb-4">{winner.winner_email}</p>

                <div className="bg-white px-6 py-2 rounded-full shadow-inner border border-red-100 flex flex-col items-center">
                    <span className="text-xs text-gray-400 uppercase tracking-widest">Phần thưởng</span>
                    <span className="text-2xl font-bold text-yellow-600">{winner.prize_label}</span>
                </div>

                <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-400">
                        {new Date(winner.created_at).toLocaleString('vi-VN')}
                    </div>
                    
                    {/* Status Toggle Button */}
                    <Button
                        onClick={handleToggleStatus}
                        disabled={isUpdating}
                        size="sm"
                        className={`gap-2 ${
                            winner.status === 'delivered' 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-gray-400 hover:bg-gray-500'
                        }`}
                    >
                        {winner.status === 'delivered' ? (
                            <>
                                <Check className="w-4 h-4" />
                                Đã nhận giải
                            </>
                        ) : (
                            <>
                                <X className="w-4 h-4" />
                                Chưa nhận
                            </>
                        )}
                    </Button>
                    
                    {winner.image_url && (
                        <span className="text-xs text-green-600 font-medium">
                            ✓ Đã upload QR
                        </span>
                    )}
                </div>
            </div>

            {/* Right Column: QR / Proof - No hover effects */}
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 rounded-xl p-4 relative overflow-hidden">
                {winner.image_url ? (
                    <img src={winner.image_url} alt="Proof" className="max-w-full max-h-[300px] object-contain rounded-lg shadow-2xl" />
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-600 gap-2 opacity-50">
                        <QrCode className="w-16 h-16" />
                        <span className="text-sm">Chưa có mã QR</span>
                    </div>
                )}
            </div>
        </div>
    );

    if (winners.length === 0) return null;

    return (
        <div className="w-full max-w-4xl mt-12 px-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-widest text-sm">
                    <Trophy className="w-4 h-4" />
                    <span>Danh sách may mắn</span>
                </div>

                <Button
                    variant="link"
                    className="text-yellow-200 hover:text-white text-xs underline"
                    onClick={handleOpenHistory}
                >
                    Xem tất cả
                </Button>
            </div>

            <div className="relative overflow-hidden group">
                {/* Horizontal Scrolling Container */}
                <div className="flex gap-6 overflow-x-auto pb-4 px-4 snap-x justify-center mask-image-gradient scrollbar-hide">
                    {winners.map((winner) => (
                        <div
                            key={winner.id}
                            className="flex flex-col items-center gap-2 min-w-[100px] snap-center cursor-pointer transition-transform hover:scale-105"
                            onClick={() => handleSelectWinner(winner)}
                        >
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 p-[3px] shadow-lg">
                                    {winner.winner_avatar ? (
                                        <img src={winner.winner_avatar} alt={winner.winner_name} className="w-full h-full rounded-full object-cover border-2 border-white" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-red-800 flex items-center justify-center text-white text-xl font-bold border-2 border-white/20 capitalize">
                                            {winner.winner_name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-red-900 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-white whitespace-nowrap">
                                    {winner.prize_label.replace(',000 VNĐ', 'k').replace(' VNĐ', '')}
                                </div>
                            </div>
                            <div className="text-center w-full">
                                <div className="text-white text-xs font-medium truncate max-w-[120px] mx-auto" title={winner.winner_name}>
                                    {winner.winner_name}
                                </div>
                                <div className="text-white/60 text-[10px]">
                                    {new Date(winner.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Fade edges */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-red-900/0 to-transparent pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-red-900/0 to-transparent pointer-events-none"></div>
            </div>

            {/* Winner Detail Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-3xl sm:h-[500px] p-0 overflow-hidden bg-white border-none shadow-2xl flex flex-col">
                    {selectedWinner && (
                        <div className="relative flex-1 flex flex-col">
                            {/* Nav Buttons */}
                            <div className="absolute top-1/2 -translate-y-1/2 left-2 z-10">
                                <Button size="icon" variant="ghost" className="rounded-full bg-white/20 hover:bg-white/40 text-black hover:text-black" onClick={() => handleNavigate('prev')}>
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                            </div>
                            <div className="absolute top-1/2 -translate-y-1/2 right-2 z-10">
                                <Button size="icon" variant="ghost" className="rounded-full bg-white/20 hover:bg-white/40 text-black hover:text-black" onClick={() => handleNavigate('next')}>
                                    <ChevronRight className="w-6 h-6" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6 md:p-8">
                                <WinnerDetail winner={selectedWinner} />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* All History Modal */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col bg-white/95 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-4 text-red-800 font-bold uppercase tracking-widest text-lg border-b pb-4 border-red-100">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <span>Lịch sử trúng thưởng</span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allWinners.map((winner) => (
                            <div
                                key={winner.id}
                                className="flex items-center gap-4 p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition-all"
                                onClick={() => handleSelectWinner(winner)}
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0 overflow-hidden">
                                    {winner.winner_avatar ? (
                                        <img src={winner.winner_avatar} alt={winner.winner_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-600 font-bold">
                                            {winner.winner_name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-800 truncate">{winner.winner_name}</div>
                                    <div className="text-xs text-gray-500">{new Date(winner.created_at).toLocaleString('vi-VN')}</div>
                                </div>
                                <div className="font-bold text-yellow-600 text-sm whitespace-nowrap">
                                    {winner.prize_label}
                                </div>
                            </div>
                        ))}
                        {allWinners.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">Chưa có ai trúng thưởng cả :(</div>}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

