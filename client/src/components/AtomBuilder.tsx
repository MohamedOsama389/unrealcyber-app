import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

const AtomBuilder: React.FC = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (containerRef.current?.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`
                relative w-full h-full bg-white overflow-hidden border border-slate-200
                ${isFullscreen ? '' : 'rounded-2xl shadow-2xl'}
            `}
        >
            {/* PhET Official Simulator Iframe */}
            <iframe
                src="https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html"
                className="w-full h-full border-0 select-none"
                allow="fullscreen"
                title="PhET Build an Atom"
                scrolling="no"
            />

            {/* Custom Fullscreen Toggle Overlay */}
            <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-50 p-2.5 bg-white/90 backdrop-blur-md shadow-lg border border-slate-200 rounded-xl hover:bg-white transition-all flex items-center space-x-2 text-slate-700 font-semibold text-xs tracking-wide group"
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
                {isFullscreen ? (
                    <>
                        <Minimize2 size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                        <span>EXIT FULLSCREEN</span>
                    </>
                ) : (
                    <>
                        <Maximize2 size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                        <span>FULLSCREEN</span>
                    </>
                )}
            </button>

            {/* Hidden hint for Esc key when in Fullscreen */}
            {isFullscreen && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 hover:opacity-100 transition-opacity bg-black/50 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm">
                    Press ESC to exit
                </div>
            )}
        </div>
    );
};

export default AtomBuilder;
