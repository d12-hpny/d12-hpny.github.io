import React from 'react';

const LanternSVG = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 120" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 0L20 15V85L50 100L80 85V15L50 0Z" fill="#FCA5A5" fillOpacity="0.2" />
        <path d="M50 0L20 15V85L50 100" stroke="#FDE047" strokeWidth="2" />
        <path d="M50 0L80 15V85L50 100" stroke="#FDE047" strokeWidth="2" />
        <path d="M20 15L80 15" stroke="#FDE047" strokeWidth="2" />
        <path d="M20 85L80 85" stroke="#FDE047" strokeWidth="2" />
        <line x1="50" y1="100" x2="50" y2="120" stroke="#FDE047" strokeWidth="2" />
        <circle cx="50" cy="120" r="3" fill="#FDE047" />
    </svg>
);

const BlossomSVG = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg viewBox="0 0 50 50" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 0C30 15 40 20 50 25C40 30 30 35 25 50C20 35 10 30 0 25C10 20 20 15 25 0Z" fill="#FDE047" fillOpacity="0.3" />
        <circle cx="25" cy="25" r="5" fill="#FCA5A5" />
    </svg>
);

const BackgroundDecor: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#D2042D]">
            {/* Decorative Gradient */}
            <div className="absolute inset-0 bg-radial-gradient from-[#D2042D] via-[#b00326] to-[#80021c] opacity-50" />

            {/* Floating Lanterns */}
            <LanternSVG className="absolute top-10 left-10 w-24 h-24 floating opacity-60 animate-bounce duration-[3000ms]" />
            <LanternSVG className="absolute top-20 right-10 w-20 h-20 floating opacity-50 animate-bounce duration-[4000ms]" style={{ animationDelay: '1s' }} />
            <LanternSVG className="absolute bottom-20 left-20 w-16 h-16 floating opacity-30 animate-bounce duration-[5000ms]" style={{ animationDelay: '1.5s' }} />
            <LanternSVG className="absolute top-1/2 right-20 w-24 h-24 floating opacity-50 animate-bounce duration-[3500ms]" style={{ animationDelay: '2s' }} />

            {/* Blossoms Pattern */}
            <BlossomSVG className="absolute top-[15%] left-[20%] w-12 h-12 opacity-30" />
            <BlossomSVG className="absolute top-[45%] right-[25%] w-16 h-16 opacity-20 rotate-45" />
            <BlossomSVG className="absolute bottom-[20%] left-[40%] w-10 h-10 opacity-40 -rotate-12" />
            <BlossomSVG className="absolute top-[60%] left-[5%] w-14 h-14 opacity-25" />
            <BlossomSVG className="absolute bottom-[10%] right-[10%] w-20 h-20 opacity-35 rotate-12" />

            {/* Traditional Pattern overlay */}
            <div className="absolute inset-0 opacity-[0.05]" style={{
                backgroundImage: `url('https://www.transparenttextures.com/patterns/cubes.png')`
            }} />
        </div>
    );
};

export default BackgroundDecor;
