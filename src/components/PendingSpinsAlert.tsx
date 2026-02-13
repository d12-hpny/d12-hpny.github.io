import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUserPendingSpins, uploadPrizeClaim } from '@/lib/supabase';

interface PendingSpin {
    id: string;
    prize_label: string;
    created_at: string;
    wheel_code: string;
}

interface PendingSpinsAlertProps {
    userEmail?: string;
    onClose: () => void;
}

export function PendingSpinsAlert({ userEmail, onClose }: PendingSpinsAlertProps) {
    const [pendingSpins, setPendingSpins] = useState<PendingSpin[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSpin, setSelectedSpin] = useState<PendingSpin | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (userEmail) {
            checkPendingSpins();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userEmail]);

    const checkPendingSpins = async () => {
        if (!userEmail) return;
        const spins = await getUserPendingSpins(userEmail);
        if (spins.length > 0) {
            setPendingSpins(spins);
            setIsOpen(true);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async () => {
        if (!file || !selectedSpin) return;

        setIsUploading(true);
        try {
            await uploadPrizeClaim(file, selectedSpin.id);
            // Remove uploaded spin from list
            const updated = pendingSpins.filter(s => s.id !== selectedSpin.id);
            setPendingSpins(updated);
            setSelectedSpin(null);
            setFile(null);
            setPreview(null);

            // Close dialog if no more pending spins
            if (updated.length === 0) {
                setIsOpen(false);
                onClose();
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Có lỗi khi tải ảnh lên. Vui lòng thử lại!');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSkip = () => {
        setIsOpen(false);
        onClose();
    };

    if (!isOpen || pendingSpins.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="w-5 h-5" />
                        Bạn có {pendingSpins.length} giải thưởng chưa nhận
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {!selectedSpin ? (
                        <>
                            <p className="text-sm text-gray-600">
                                Bạn đã trúng thưởng nhưng chưa upload mã QR để nhận. Vui lòng hoàn tất để nhận giải!
                            </p>

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {pendingSpins.map((spin) => (
                                    <div
                                        key={spin.id}
                                        className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                                    >
                                        <div>
                                            <div className="font-bold text-yellow-700">{spin.prize_label}</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(spin.created_at).toLocaleString('vi-VN')}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => setSelectedSpin(spin)}
                                            className="bg-orange-500 hover:bg-orange-600"
                                        >
                                            Upload QR
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleSkip}
                                    className="flex-1"
                                >
                                    Để sau
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800 mb-1">Upload QR cho giải</h3>
                                <div className="text-2xl font-black text-yellow-600">{selectedSpin.prize_label}</div>
                            </div>

                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden bg-gray-50",
                                    file ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-orange-400 hover:bg-orange-50"
                                )}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={isUploading}
                                />

                                {preview ? (
                                    <div className="relative w-full h-48">
                                        <img src={preview} alt="QR Preview" className="w-full h-full object-contain rounded-lg" />
                                        <div className="absolute top-2 right-2 bg-white/80 rounded-full p-1 shadow-sm">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-orange-100 p-3 rounded-full mb-3">
                                            <Upload className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">Chạm để tải ảnh QR</p>
                                        <p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG</p>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedSpin(null);
                                        setFile(null);
                                        setPreview(null);
                                    }}
                                    disabled={isUploading}
                                    className="flex-1"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={!file || isUploading}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                                >
                                    {isUploading ? "Đang gửi..." : "Xác nhận"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
