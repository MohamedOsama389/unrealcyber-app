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
    // SCIENCE
    {
        id: 'atom-builder',
        title: 'Build an Atom',
        category: 'Science',
        unit: 'Unit 2: Electric Energy and Radioactivity',
        lesson: 'Lesson 3: Radioactivity and Nuclear Energy',
        description: 'Build atoms with protons, neutrons, and electrons. Explore the periodic table and isotopes.',
        simUrl: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html',
        isPhET: true,
        tags: ['Physics', 'Chemistry', 'Atoms']
    },
    {
        id: 'balancing-equations',
        title: 'Balancing Chemical Equations',
        category: 'Science',
        unit: 'Unit 1: Chemical Reactions',
        lesson: 'Lesson 1: Chemical Reactions',
        description: 'Learn how to balance chemical equations through a series of interactive challenges.',
        simUrl: 'https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_en.html',
        isPhET: true,
        tags: ['Chemistry', 'Equations', 'Reactions']
    },
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
        id: 'radioactive-dating',
        title: 'Radioactive Dating Game',
        category: 'Science',
        unit: 'Unit 2: Radioactivity',
        lesson: 'Lesson 3: Radioactivity and Nuclear Energy',
        description: 'Learn about half-life and carbon dating by measuring isotopes in various objects.',
        simUrl: 'https://openstax.github.io/simulations/radioactive-dating-game/',
        isPhET: true,
        tags: ['Nuclear', 'Isotopes', 'History']
    },

    // MATH
    {
        id: 'equation-balance',
        title: 'Algebra Balance Scales',
        category: 'Math',
        unit: 'Unit 1: Algebra',
        lesson: 'Equations',
        description: 'Solve equations by balancing scales using algebraic blocks.',
        simUrl: 'https://geogebra.org/m/a3sJthKg',
        isPhET: false,
        tags: ['Algebra', 'Equations']
    },
    {
        id: 'plinko-probability',
        title: 'Plinko Probability',
        category: 'Math',
        unit: 'Unit 3: Probability',
        lesson: 'Probability Distributions',
        description: 'Explore binomial distributions and probability through the Plinko game.',
        simUrl: 'https://phet.colorado.edu/sims/html/plinko-probability/latest/plinko-probability_en.html',
        isPhET: true,
        tags: ['Statistics', 'Probability']
    },

    // ENGLISH
    {
        id: 'sports-word-game',
        title: 'Sports Word Game',
        category: 'English',
        unit: 'Unit 7: Sports',
        lesson: 'Vocabulary Builder',
        description: 'Learn sports-related vocabulary with interactive matching.',
        simUrl: 'https://learnenglishkids.britishcouncil.org/grammar-vocabulary/word-games/sports-1',
        isPhET: false,
        tags: ['Vocabulary', 'Sports']
    }
];
