import React from 'react';
import { motion } from 'framer-motion';
import { Download, Box, AppWindow, ExternalLink, ShieldCheck } from 'lucide-react';

interface Lab {
    id: number;
    title: string;
    description: string;
    thumbnail_link: string;
    drive_link: string;
    file_id: string;
}

const LabCard = ({ lab }: { lab: Lab }) => {
    const handleDownload = () => {
        window.open(lab.drive_link, '_blank');
    };

    const getDriveId = (url: string) => {
        if (!url) return null;

        // If someone already stored a bare Drive ID, just use it.
        if (!url.startsWith('http') && /^[\w-]{10,}$/.test(url)) return url;

        try {
            const parsed = new URL(url);

            // Common query param forms: ?id=, ?file_id=, ?fid=
            const paramId =
                parsed.searchParams.get('id') ||
                parsed.searchParams.get('file_id') ||
                parsed.searchParams.get('fid');
            if (paramId) return paramId;

            // Path forms: /file/d/<id>/view, /u/0/uc?id=<id>, /open?id=<id>
            const path = parsed.pathname;
            const pathMatch =
                path.match(/\/file\/d\/([^/]+)/) ||
                path.match(/\/d\/([^/]+)/) ||
                path.match(/\/folders\/([^/]+)/);
            if (pathMatch?.[1]) return pathMatch[1];
        } catch {
            // Non-URL strings fall through to regex scan below.
        }

        // Last‑chance: grab any long drive-like token.
        const fallback = url.match(/[-\w]{15,}/);
        return fallback ? fallback[0] : null;
    };

    const thumbnailId = getDriveId(lab.thumbnail_link);
    const thumbnailUrl = thumbnailId
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/labs/thumbnail/${thumbnailId}`
        : lab.thumbnail_link;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-[#0f172a]/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden hover:border-cyan-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10"
        >
            {/* Thumbnail */}
            <div className="aspect-video w-full bg-slate-900 overflow-hidden relative">
                {lab.thumbnail_link ? (
                    <img
                        src={thumbnailUrl}
                        alt={lab.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                            // Fallback if extraction fails
                            (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <Box size={48} className="text-slate-700 group-hover:text-cyan-500/40 transition-colors" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-60" />

                {/* Status Badge */}
                <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                    <ShieldCheck size={14} className="text-cyan-400" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Verified Lab</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                    <AppWindow size={16} className="text-cyan-400" />
                    <span className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-widest">Application</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {lab.title}
                </h3>

                <p className="text-slate-400 text-xs leading-relaxed mb-6 line-clamp-2">
                    {lab.description || "Experimental lab environment. Download and launch to practice advanced networking scenarios locally."}
                </p>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => window.open(lab.drive_link, '_blank')}
                        className="flex-1 flex items-center justify-center space-x-2 bg-white text-slate-950 font-bold py-3 rounded-xl hover:bg-cyan-400 hover:text-black transition-all active:scale-95"
                    >
                        <Download size={18} />
                        <span>Download Lab</span>
                    </button>
                    <button
                        onClick={() => window.open(lab.drive_link, '_blank')}
                        className="p-3 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ExternalLink size={18} />
                    </button>
                </div>
            </div>

            {/* Decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
};

export default LabCard;
