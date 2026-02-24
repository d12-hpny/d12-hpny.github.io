import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock, Calendar } from 'lucide-react';

// Math helpers for SVG
function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees) * Math.PI / 180.0;
    return {
        x: cx + (r * Math.cos(angleInRadians)),
        y: cy + (r * Math.sin(angleInRadians))
    };
}

function getSlicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    return [
        "M", cx, cy,
        "L", start.x, start.y,
        "A", r, r, 0, 0, 1, end.x, end.y,
        "Z"
    ].join(" ");
}

const ClockFace = ({ minute, onMinuteChange }: { minute: number, onMinuteChange: (m: number) => void }) => {
    const cx = 100, cy = 100, r = 100;
    const slices = [];

    // Draw 12 pie segments for 0, 5, 10... 55 minutes
    for (let pos = 1; pos <= 12; pos++) {
        const m = pos === 12 ? 0 : pos * 5;
        // SVG angles: 12 o'clock is -90 deg.
        const centerAngle = pos * 30 - 90;
        const startAngle = centerAngle - 15;
        const endAngle = centerAngle + 15;

        const path = getSlicePath(cx, cy, r, startAngle, endAngle);
        const isSelected = minute === m;

        const labelPos = polarToCartesian(cx, cy, r * 0.7, centerAngle);
        const subLabelPos = polarToCartesian(cx, cy, r * 0.9, centerAngle);

        slices.push(
            <g key={pos} onClick={() => onMinuteChange(m)} className="cursor-pointer group">
                <path
                    d={path}
                    className={`${isSelected ? 'fill-red-500' : 'fill-red-50 group-hover:fill-red-200'} transition-colors stroke-white`}
                    strokeWidth="2"
                />
                <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-red-900 pointer-events-none'}`}
                >
                    {pos}
                </text>
                <text
                    x={subLabelPos.x}
                    y={subLabelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`text-[8px] font-medium ${isSelected ? 'text-red-200' : 'text-red-400 pointer-events-none'}`}
                >
                    {m.toString().padStart(2, '0')}
                </text>
            </g>
        );
    }

    // Position the red clock hand
    const handAngle = (minute / 5) * 30 - 90;
    const handEnd = polarToCartesian(cx, cy, r * 0.65, handAngle);

    return (
        <svg viewBox="0 0 200 200" className="w-32 h-32 drop-shadow-sm rounded-full bg-white select-none mx-auto border border-red-100">
            {slices}
            <circle cx={cx} cy={cy} r="6" className="fill-red-700 pointer-events-none" />
            <line
                x1={cx} y1={cy}
                x2={handEnd.x} y2={handEnd.y}
                className="stroke-red-700 pointer-events-none"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
};

export interface DateTimePickerProps {
    value?: string;
    onChange: (val: string) => void;
    label: string;
    id: string;
}

export function DateTimePicker({ value, onChange, label, id }: DateTimePickerProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    let initDate = "";
    let initHour = 0;
    let initMin = 0;

    if (value) {
        const t = new Date(value);
        if (!isNaN(t.getTime())) {
            initDate = `${t.getFullYear()}-${(t.getMonth() + 1).toString().padStart(2, '0')}-${t.getDate().toString().padStart(2, '0')}`;
            initHour = t.getHours();
            initMin = Math.round(t.getMinutes() / 5) * 5;
            if (initMin === 60) initMin = 0;
        }
    }

    const [date, setDate] = useState(initDate);
    const [hour, setHour] = useState(initHour);
    const [minute, setMinute] = useState(initMin);

    // Automatically construct formatted timestamp to parents
    useEffect(() => {
        if (!date) return;
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        onChange(`${date}T${h}:${m}:00`);
    }, [date, hour, minute, onChange]);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDate("");
        setHour(0);
        setMinute(0);
        onChange("");
        setIsExpanded(false);
    };

    return (
        <div className="space-y-1.5 flex flex-col items-start w-full relative">
            <Label htmlFor={id} className="text-xs font-bold text-purple-800">{label}</Label>

            <div
                className={`w-full bg-white border ${isExpanded ? 'border-purple-500 ring-2 ring-purple-200' : 'border-purple-200'} rounded-lg shadow-sm flex items-center justify-between px-3 py-2 cursor-pointer hover:border-purple-400 transition-all min-h-[44px]`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>
                        {date
                            ? `${date.split('-').reverse().join('/')} - ${hour.toString().padStart(2, '0')} giờ ${minute.toString().padStart(2, '0')} phút`
                            : 'Chưa thiết lập'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {date && (
                        <div
                            className="text-gray-400 hover:text-white bg-gray-100 hover:bg-red-500 rounded-full w-5 h-5 flex items-center justify-center transition-colors shadow-sm"
                            onClick={handleClear}
                            title="Xóa thời gian này"
                        >
                            &times;
                        </div>
                    )}
                    <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {isExpanded && (
                <div className="w-full mt-2 bg-purple-50/50 border border-purple-100 rounded-xl p-4 shadow-md flex flex-col gap-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col">
                        <Label className="text-xs mb-1 text-gray-500 font-bold uppercase tracking-wider">🗓 Chọn Ngày</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="bg-white w-full cursor-pointer border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center border-t border-purple-100 pt-3">

                        {/* Hour Config */}
                        <div className="flex flex-col items-center sm:flex-1 w-full">
                            <Label className="text-[10px] mb-2 text-gray-500 font-bold uppercase tracking-wider text-center">⏳ Chọn Giờ</Label>
                            <div className="bg-white border border-gray-200 rounded-lg p-2 w-full max-w-[100px] mx-auto shadow-sm relative hover:border-purple-300 transition-colors">
                                <select
                                    value={hour}
                                    onChange={e => setHour(parseInt(e.target.value))}
                                    className="w-full text-center text-2xl font-bold text-gray-800 bg-transparent border-none focus:ring-0 cursor-pointer appearance-none outline-none"
                                >
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                            </div>
                            <p className="text-[9px] text-gray-400 mt-1.5 text-center select-none">Nhấn để chọn giờ</p>
                        </div>

                        {/* Minute Config (SVG Pie Clock) */}
                        <div className="flex flex-col items-center w-full sm:flex-[1.2] bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <Label className="text-[10px] mb-2 text-gray-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1 w-full text-center">
                                <Clock className="w-3 h-3 text-red-500" /> Chọn Phút
                            </Label>
                            <ClockFace minute={minute} onMinuteChange={setMinute} />
                        </div>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-purple-100 mt-2">
                        <button
                            className="text-xs bg-purple-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-purple-700 font-bold transition-all"
                            onClick={() => setIsExpanded(false)}
                        >
                            Hoàn tất
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
