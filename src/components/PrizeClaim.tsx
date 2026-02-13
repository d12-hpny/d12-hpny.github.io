import React, { useState } from 'react';
import { Button } from './ui/button';
import { Upload, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrizeClaimProps {
    prize: string;
    onClaim: (file: File) => void;
    onSkip?: () => void;
}

const PrizeClaim: React.FC<PrizeClaimProps> = ({ prize, onClaim, onSkip }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = () => {
        if (!file) return;
        setIsSubmitting(true);
        // Simulate upload delay
        setTimeout(() => {
            onClaim(file);
            setIsSubmitting(false);
        }, 2000);
    };

    const handleSkip = () => {
        if (onSkip) {
            onSkip();
        }
    };

    return (
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-4 border-yellow-400 max-w-md w-full relative animate-in fade-in zoom-in duration-300">
            {/* Close Button */}
            {onSkip && (
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    disabled={isSubmitting}
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            )}
            
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-3xl font-festive font-bold text-red-600 mb-2">Chúc Mừng!</h2>
                <div className="text-xl text-gray-700">Bạn đã trúng</div>
                <div className="text-4xl font-black text-yellow-600 drop-shadow-sm my-2">{prize}</div>
                <p className="text-sm text-gray-500">Vui lòng tải ảnh QR ngân hàng để nhận thưởng</p>
            </div>

            {/* Upload Area */}
            <div className="space-y-4">
                <div
                    className={cn(
                        "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden bg-gray-50",
                        file ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-red-400 hover:bg-red-50"
                    )}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                            <div className="bg-red-100 p-3 rounded-full mb-3">
                                <Upload className="w-6 h-6 text-red-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">Chạm để tải ảnh QR</p>
                            <p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG (Max 5MB)</p>
                        </>
                    )}
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={!file || isSubmitting}
                    className="w-full text-lg py-6 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Đang gửi..." : "Xác nhận nhận thưởng"}
                </Button>

                {onSkip && (
                    <button
                        onClick={handleSkip}
                        disabled={isSubmitting}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2 py-2 transition-colors disabled:opacity-50"
                    >
                        Để sau, tôi sẽ upload khi có mạng ổn định hơn
                    </button>
                )}
            </div>
        </div>
    );
};

export default PrizeClaim;
