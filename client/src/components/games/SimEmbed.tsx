import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, ExternalLink } from 'lucide-react';

interface SimEmbedProps {
    src: string;
    title: string;
    height?: string;
}

const SimEmbed: React.FC<SimEmbedProps> = ({ src, title, height = "80vh" }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
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
                relative w-full bg-white overflow-hidden border border-slate-200 transition-all
                ${isFullscreen ? 'h-screen' : 'rounded-2xl shadow-xl'}
            `}
            style={{ height: isFullscreen ? '100vh' : height }}
        >
            <iframe
                src={src}
                className="w-full h-full border-0"
                allow="fullscreen"
                title={title}
                loading="lazy"
            />

            <div className="absolute top-4 right-4 z-50 flex space-x-2">
                <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/90 backdrop-blur-md shadow-lg border border-slate-200 rounded-xl hover:bg-white transition-all text-slate-500 hover:text-blue-500"
                    title="Open in new tab"
                >
                    <ExternalLink size={18} />
                </a>
                <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-white/90 backdrop-blur-md shadow-lg border border-slate-200 rounded-xl hover:bg-white transition-all flex items-center space-x-2 text-slate-700 font-semibold text-xs group"
                >
                    {isFullscreen ? (
                        <>
                            <Minimize2 size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="hidden md:inline">EXIT</span>
                        </>
                    ) : (
                        <>
                            <Maximize2 size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="hidden md:inline">FULLSCREEN</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SimEmbed;
