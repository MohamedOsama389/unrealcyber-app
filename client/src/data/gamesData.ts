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
        lesson: 'Lesson 1: Physical Properties of Current',
        description: 'Build circuits with batteries, light bulbs, resistors, and switches.',
        simUrl: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html',
        isPhET: true,
        tags: ['Electricity', 'Circuits', 'Physics']
    },
    {
        id: 'reaction-visualizer',
        title: 'Cheminal Reactions',
        category: 'Science',
        unit: 'Unit 1: Chemical Reactions',
        lesson: 'Interactive Reaction Builder',
        description: 'Launch the embedded Scinece reaction visualizer as a separate game.',
        simUrl: '/scinece/index.html',
        isPhET: false,
        tags: ['Chemistry', 'Reactions', 'Visualizer']
    }
];
