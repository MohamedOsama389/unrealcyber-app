import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageTitle = () => {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        let title = 'Unreal Cyber Academy';

        switch (true) {
            case path === '/':
                title = 'UnrealCyber Academy';
                break;
            case path.startsWith('/vision/'):
                title = 'Course Details | UnrealCyber';
                break;
            case path.startsWith('/private/dashboard'):
                title = 'Dashboard | UCA';
                break;
            case path.startsWith('/private/meetings'):
                title = 'Live Sessions | UCA';
                break;
            case path.startsWith('/private/tasks'):
                title = 'Mission Center | UCA';
                break;
            case path.startsWith('/private/videos'):
                title = 'Recorded Sessions | UCA';
                break;
            case path.startsWith('/private/vm-rental'):
                title = 'VM Access | UCA';
                break;
            case path.startsWith('/private/chat'):
                title = 'Comms Channel | UCA';
                break;
            case path.startsWith('/private/admin'):
                title = 'Command Center | UCA';
                break;
            case path.startsWith('/private/login'):
                title = 'Login | UCA';
                break;
            case path.startsWith('/private/signup'):
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

