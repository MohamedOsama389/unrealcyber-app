export const DEFAULT_PUBLIC_CONTENT = {
    hero: {
        title: 'UnrealCyber Latest Video',
        subtitle: 'Networking, ethical hacking, and programming. Learn fast, build real skills.',
        ctaText: 'Watch on YouTube',
        ctaLink: 'https://www.youtube.com/',
        heroVideoLink: 'https://www.youtube.com/watch?v=W1rJ6EvDWU4'
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
            popularVideoTitle: '',
            popularVideoUrl: '',
            playlistUrl: '',
            videos: [
                { title: 'Intro to Networking', description: 'Quick fundamentals to get started.', url: '', downloads: [] }
            ]
        },
        {
            key: 'ethical-hacking',
            title: 'Ethical Hacking',
            description: 'Red-team mindset, tooling, and practical exploits.',
            popularVideoTitle: '',
            popularVideoUrl: '',
            playlistUrl: '',
            videos: []
        },
        {
            key: 'programming',
            title: 'Programming',
            description: 'Build scripts, automation, and security tooling.',
            popularVideoTitle: '',
            popularVideoUrl: '',
            playlistUrl: '',
            videos: []
        }
    ],
    socials: {
        youtube: '',
        telegram: '',
        discord: '',
        instagram: '',
        tiktok: '',
        facebook: '',
        twitter: '',
        linkedin: ''
    },
    footer: {
        enabled: true,
        brand: 'UNREALCYBER',
        description: 'Hands-on cybersecurity learning focused on networking, ethical hacking, and programming.',
        madeWithText: 'Made with ❤️ for Unreal Cyber community',
        copyrightText: '© 2026 Unreal Cyber Academy. All Rights Reserved.',
        headings: {
            platform: 'Platform',
            resources: 'Resources',
            legal: 'Legal'
        },
        columns: {
            platform: [
                { label: 'About', url: '/about' },
                { label: 'Tracking', url: '/tracking' },
                { label: 'Progress', url: '/progress' },
                { label: 'Profile', url: '/profile' }
            ],
            resources: [
                { label: 'Documentation', url: '#' },
                { label: 'Community', url: '#' },
                { label: 'Blog', url: '#' },
                { label: 'Careers', url: '#' }
            ],
            legal: [
                { label: 'Privacy Policy', url: '#' },
                { label: 'Terms of Service', url: '#' },
                { label: 'Cookie Policy', url: '#' }
            ]
        }
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
        popularVideoTitle: section.popularVideoTitle || '',
        popularVideoUrl: section.popularVideoUrl || '',
        playlistUrl: section.playlistUrl || '',
        videos: Array.isArray(section.videos) ? section.videos : []
    }));
    merged.footer = {
        ...DEFAULT_PUBLIC_CONTENT.footer,
        ...(merged.footer || {}),
        headings: {
            ...DEFAULT_PUBLIC_CONTENT.footer.headings,
            ...(merged.footer?.headings || {})
        },
        columns: {
            ...DEFAULT_PUBLIC_CONTENT.footer.columns,
            ...(merged.footer?.columns || {})
        }
    };
    merged.footer.columns.platform = Array.isArray(merged.footer.columns.platform)
        ? merged.footer.columns.platform
        : DEFAULT_PUBLIC_CONTENT.footer.columns.platform;
    merged.footer.columns.resources = Array.isArray(merged.footer.columns.resources)
        ? merged.footer.columns.resources
        : DEFAULT_PUBLIC_CONTENT.footer.columns.resources;
    merged.footer.columns.legal = Array.isArray(merged.footer.columns.legal)
        ? merged.footer.columns.legal
        : DEFAULT_PUBLIC_CONTENT.footer.columns.legal;
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
            border: 'border-sky-500/30',
            accent: 'text-sky-300',
            glow: 'shadow-[0_0_40px_rgba(56,189,248,0.12)]',
            chip: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
            gradient: 'from-sky-500/15 via-slate-900/80 to-cyan-500/10'
        },
        programming: {
            border: 'border-blue-500/30',
            accent: 'text-blue-300',
            glow: 'shadow-[0_0_40px_rgba(59,130,246,0.12)]',
            chip: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
            gradient: 'from-blue-500/15 via-slate-900/80 to-sky-500/10'
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
