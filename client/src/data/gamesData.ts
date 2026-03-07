export interface GameMetadata {
    id: string;
    title: string;
    category: 'Science' | 'Math' | 'English' | 'Social Studies' | 'Arabic';
    unit: string;
    lesson: string;
    description: string;
    simUrl: string;
    isPhET: boolean;
    tags: string[];
}

export const GAMES_REGISTRY: GameMetadata[] = [
    {
        id: 'circuit-construction',
        title: 'Circuit Construction Kit: DC',
        category: 'Science',
        unit: 'Unit 2: Electric Energy',
        lesson: 'Embedded Science Project',
        description: 'Launch the embedded Scinece project directly inside the game viewer.',
        simUrl: '/scinece/index.html',
        isPhET: false,
        tags: ['Electricity', 'Circuits', 'Physics']
    }
];
