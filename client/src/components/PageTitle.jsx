import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageTitle = () => {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        let title = 'Unreal Cyber Academy';

        switch (true) {
            case path.startsWith('/dashboard'):
                title = 'Dashboard | UCA';
                break;
            case path.startsWith('/meetings'):
                title = 'Live Sessions | UCA';
                break;
            case path.startsWith('/tasks'):
                title = 'Mission Center | UCA';
                break;
            case path.startsWith('/videos'):
                title = 'Recorded Sessions | UCA';
                break;
            case path.startsWith('/vm-rental'):
                title = 'VM Access | UCA';
                break;
            case path.startsWith('/chat'):
                title = 'Comms Channel | UCA';
                break;
            case path.startsWith('/admin'):
                title = 'Command Center | UCA';
                break;
            case path.startsWith('/login'):
                title = 'Login | UCA';
                break;
            case path.startsWith('/signup'):
                title = 'Recruit Signup | UCA';
                break;
            default:
                title = 'Unreal Cyber Academy';
        }

        document.title = title;
    }, [location]);

    return null;
};

export default PageTitle;
