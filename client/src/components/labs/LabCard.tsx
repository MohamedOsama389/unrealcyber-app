import React from 'react';
import { motion } from 'framer-motion';
import { Download, Box, AppWindow, ShieldCheck, Pencil, Trash2, Video, Paperclip } from 'lucide-react';

interface Lab {
    id: number;
    title: string;
    description: string;
    thumbnail_link: string;
    drive_link: string;
    file_id: string;
    video_link?: string | null;
    extra_files?: {
        id: string;
        name: string;
        webViewLink?: string;
    }[];
}

interface LabCardProps {
    lab: Lab;
    isAdmin?: boolean;
    onEdit?: (lab: Lab) => void;
    onDelete?: (lab: Lab) => void;
}

const LabCard = ({ lab, isAdmin, onEdit, onDelete }: LabCardProps) => {

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

    const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
    const thumbnailId = getDriveId(lab.thumbnail_link);
    const thumbnailUrl = thumbnailId
        ? `${apiBase}/api/labs/thumbnail/${thumbnailId}`
        : lab.thumbnail_link;
    const downloadUrl = lab.file_id ? `${apiBase}/api/labs/download/${lab.file_id}` : lab.drive_link;
    const videoUrl = lab.video_link || lab.drive_link;
    const extras = lab.extra_files || [];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-[#0f172a]/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden hover:border-cyan-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10"
        >
            {isAdmin && (
                <div className="absolute top-3 right-3 z-10 flex items-center space-x-2">
                    <button
                        onClick={() => onEdit && onEdit(lab)}
                        className="p-2 rounded-lg bg-slate-900/70 border border-white/10 text-slate-200 hover:text-white hover:border-cyan-400/40 transition-colors"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => onDelete && onDelete(lab)}
                        className="p-2 rounded-lg bg-slate-900/70 border border-white/10 text-red-300 hover:text-red-200 hover:border-red-400/40 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )}

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
                        onClick={() => window.open(downloadUrl, '_blank')}
                        className="flex-1 flex items-center justify-center space-x-2 bg-white text-slate-950 font-bold py-3 rounded-xl hover:bg-cyan-400 hover:text-black transition-all active:scale-95"
                    >
                        <Download size={18} />
                        <span>Download Lab</span>
                    </button>
                    <button
                        onClick={() => videoUrl ? window.open(videoUrl, '_blank') : window.open(downloadUrl, '_blank')}
                        className="p-3 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
                    >
                        <Video size={18} />
                    </button>
                </div>

                {extras.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center space-x-2">
                            <Paperclip size={14} className="text-cyan-400" />
                            <span>Supporting Files</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {extras.map((file) => {
                                const url = `${apiBase}/api/labs/download/${file.id}`;
                                return (
                                    <button
                                        key={file.id}
                                        onClick={() => window.open(url, '_blank')}
                                        className="text-xs px-3 py-2 rounded-xl bg-slate-800/60 border border-white/5 text-slate-200 hover:border-cyan-400/40 hover:text-white transition-all"
                                    >
                                        {file.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
};

export default LabCard;
