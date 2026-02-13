import React from 'react';
import BackgroundDecor from './BackgroundDecor';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-red-950 font-sans">
            <BackgroundDecor />

            {/* Cherry Blossom (Mai/Dao) - Bottom Left - Keep as extra layer if needed, or remove if BackgroundDecor handles it */}
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-contain bg-no-repeat bg-bottom opacity-60 pointer-events-none" style={{ backgroundImage: "url('https://png.pngtree.com/png-clipart/20230104/ourmid/pngtree-apricot-blossom-on-new-years-day-png-image_6551500.png')" }}></div>

            {/* Content */}
            <main className="relative z-10 container mx-auto px-4 py-8 h-screen flex flex-col">
                {children}
            </main>
        </div>
    );
};

export default Layout;
