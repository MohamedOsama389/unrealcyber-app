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
        }, // SOCIAL STUDIES
    {
        id: 'ss-capital-match',
        title: 'Capital Match Game',
        category: 'Social Studies',
        unit: 'Unit 1: Geography',
        lesson: 'Lesson: Country Capitals',
        description: 'Test your knowledge of country capitals by matching capitals to countries in a multiple-choice quiz.',
        simUrl: '/games/ss-capital-match.html',
        isPhET: false,
        tags: ['Geography', 'Capitals', 'Quiz']
    },
    // ARABIC
    {
        id: 'arabic-sentence-scramble',
        title: 'Arabic Sentence Scramble',
        category: 'Arabic',
        unit: 'Unit 1: Sentence Construction',
        lesson: 'Lesson: Word Order',
        description: 'Arrange the scrambled Arabic words to form correct sentences and improve understanding of sentence structure.',
        simUrl: '/games/arabic-sentence-scramble.html',
        isPhET: false,
        tags: ['Arabic', 'Sentence', 'Grammar']
    },
    // ENGLISH
    {
        id: 'english-synonym-game',
        title: 'English Synonym Game',
        category: 'English',
        unit: 'Unit 5: Vocabulary',
        lesson: 'Lesson: Synonyms',
        description: 'Choose synonyms for given words to build your vocabulary in this interactive quiz.',
        simUrl: '/games/english-synonym-game.html',
        isPhET: false,
        tags: ['Vocabulary', 'Synonyms', 'English']
    },
    // SCIENCE
    {
        id: 'science-hormone-quiz',
        title: 'Hormone Quiz',
        category: 'Science',
        unit: 'Unit 4: Hormones',
        lesson: 'Lesson: Hormones and Glands',
        description: 'Test your understanding of hormones by identifying which glands produce specific hormones in this multiple-choice quiz.',
        simUrl: '/games/science-hormone-quiz.html',
        isPhET: false,
        tags: ['Biology', 'Hormones', 'Quiz']
    },
    // MATH
    {
        id: 'math-fraction-game',
        title: 'Fraction Addition Game',
        category: 'Math',
        unit: 'Unit 2: Fractions',
        lesson: 'Lesson: Fraction Addition',
        description: 'Practice adding fractions with like denominators through a series of multiple-choice questions.',
        simUrl: '/games/math-fraction-game.html',
        isPhET: false,
        tags: ['Fractions', 'Math', 'Addition']
    },
];
