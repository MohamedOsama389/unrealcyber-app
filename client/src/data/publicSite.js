export const DEFAULT_PUBLIC_CONTENT = {
    hero: {
        title: 'UnrealCyber Vision',
        subtitle: 'Networking, ethical hacking, and programming. Learn fast, build real skills.',
        ctaText: 'Watch on YouTube',
        ctaLink: 'https://www.youtube.com/'
    },
    pillars: [
        { title: 'Networking', description: 'Routing, switching, protocols, and real labs.' },
        { title: 'Ethical Hacking', description: 'Hands-on offensive security and defense.' },
        { title: 'Programming', description: 'Automation, scripts, and tools that scale.' }
    ],
    sections: [
        {
            key: 'networking',
            title: 'Networking',
            description: 'Core networking foundations and lab walkthroughs.',
            videos: [
                { title: 'Intro to Networking', description: 'Quick fundamentals to get started.', url: '', downloads: [] }
            ]
        },
        {
            key: 'ethical-hacking',
            title: 'Ethical Hacking',
            description: 'Red-team mindset, tooling, and practical exploits.',
            videos: []
        },
        {
            key: 'programming',
            title: 'Programming',
            description: 'Build scripts, automation, and security tooling.',
            videos: []
        }
    ],
    socials: {
        youtube: '',
        telegram: '',
        discord: ''
    }
};

export const normalizePublicContent = (content) => {
    const merged = { ...DEFAULT_PUBLIC_CONTENT, ...(content || {}) };
    merged.pillars = Array.isArray(merged.pillars) && merged.pillars.length
        ? merged.pillars
        : DEFAULT_PUBLIC_CONTENT.pillars;
    merged.sections = Array.isArray(merged.sections) && merged.sections.length
        ? merged.sections
        : DEFAULT_PUBLIC_CONTENT.sections;
    merged.sections = merged.sections.map((section, idx) => ({
        ...section,
        key: section.key || DEFAULT_PUBLIC_CONTENT.sections[idx]?.key || `section-${idx}`,
        videos: Array.isArray(section.videos) ? section.videos : []
    }));
    return merged;
};

export const slugify = (value = '') =>
    value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

export const buildVideoSlug = (title, index) => {
    const base = slugify(title || `video-${index + 1}`) || `video-${index + 1}`;
    return `${base}-${index + 1}`;
};

export const getDriveId = (url) => {
    if (!url) return '';
    if (!url.startsWith('http') && /^[\w-]{10,}$/.test(url)) return url;

    const isDriveDomain = url.includes('drive.google.com') || url.includes('docs.google.com');
    if (url.startsWith('http') && !isDriveDomain) return '';

    try {
        const parsed = new URL(url);
        const qp = parsed.searchParams.get('id') || parsed.searchParams.get('file_id') || parsed.searchParams.get('fid');
        if (qp) return qp;
        const pathMatch =
            parsed.pathname.match(/\/file\/d\/([^/]+)/) ||
            parsed.pathname.match(/\/d\/([^/]+)/) ||
            parsed.pathname.match(/\/folders\/([^/]+)/);
        if (pathMatch?.[1]) return pathMatch[1];
    } catch {
        /* ignore */
    }
    const fallback = isDriveDomain ? url.match(/[-\w]{15,}/) : null;
    return fallback ? fallback[0] : '';
};

export const isDriveLink = (url) => {
    return Boolean(getDriveId(url));
};

export const toDownloadHref = (url) => {
    if (!url) return '';
    const driveId = getDriveId(url);
    return driveId ? `/api/public/download/${encodeURIComponent(driveId)}` : url;
};

export const getVideoThumbnailUrl = (url) => {
    if (!url) return '';
    try {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
            else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
            else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];
            if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
    } catch {
        /* ignore */
    }

    const driveId = getDriveId(url);
    if (driveId) return `/api/public/thumbnail/${encodeURIComponent(driveId)}`;
    return '';
};

export const getVideoEmbedUrl = (url) => {
    if (!url) return '';
    try {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
            else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
            else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];
            else videoId = url;
            return `https://www.youtube.com/embed/${videoId}`;
        }

        const driveId = getDriveId(url);
        if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;

        return url.replace('/view', '/preview');
    } catch {
        return '';
    }
};

export const getSectionTheme = (key) => {
    const themes = {
        networking: {
            border: 'border-cyan-500/30',
            accent: 'text-cyan-300',
            glow: 'shadow-[0_0_40px_rgba(34,211,238,0.12)]',
            chip: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
            gradient: 'from-cyan-500/15 via-slate-900/80 to-blue-600/10'
        },
        'ethical-hacking': {
            border: 'border-amber-500/30',
            accent: 'text-amber-300',
            glow: 'shadow-[0_0_40px_rgba(251,191,36,0.12)]',
            chip: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
            gradient: 'from-amber-500/15 via-slate-900/80 to-orange-500/10'
        },
        programming: {
            border: 'border-emerald-500/30',
            accent: 'text-emerald-300',
            glow: 'shadow-[0_0_40px_rgba(16,185,129,0.12)]',
            chip: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
            gradient: 'from-emerald-500/15 via-slate-900/80 to-teal-500/10'
        }
    };
    return themes[key] || {
        border: 'border-white/10',
        accent: 'text-cyan-300',
        glow: 'shadow-[0_0_24px_rgba(148,163,184,0.15)]',
        chip: 'bg-white/5 text-secondary border-white/10',
        gradient: 'from-slate-800/40 via-slate-900/90 to-slate-900/70'
    };
};
