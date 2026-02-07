import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        'nav.dashboard': 'Dashboard',
        'nav.meetings': 'Meetings',
        'nav.tasks': 'Mission Center',
        'nav.videos': 'Recorded Sessions',
        'nav.files': 'Academy Files',
        'nav.vm': 'VM Rental',
        'nav.handsOn': 'Hands-On Space',
        'nav.chat': 'Comms Channel',
        'nav.admin': 'Admin Grid',
        'nav.games': 'Games',
        'theme.light': 'Light Mode',
        'theme.dark': 'Dark Mode',
        'action.signout': 'Sign Out',
    },
    ar: {
        'nav.dashboard': 'لوحة التحكم',
        'nav.meetings': 'الاجتماعات',
        'nav.tasks': 'مركز المهام',
        'nav.videos': 'الجلسات المسجلة',
        'nav.files': 'ملفات الأكاديمية',
        'nav.vm': 'تأجير الأجهزة',
        'nav.handsOn': 'مساحة التجارب',
        'nav.chat': 'قناة التواصل',
        'nav.admin': 'لوحة الإدارة',
        'nav.games': 'الألعاب',
        'theme.light': 'وضع النهار',
        'theme.dark': 'وضع الليل',
        'action.signout': 'تسجيل الخروج',
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        if (localStorage.getItem('language')) return localStorage.getItem('language');
        return 'en';
    });

    useEffect(() => {
        const root = document.documentElement;
        root.lang = language;
        root.dir = language === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem('language', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => (prev === 'en' ? 'ar' : 'en'));
    };

    const t = useMemo(() => {
        return (key, fallback) => {
            return translations[language]?.[key] || fallback || key;
        };
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
