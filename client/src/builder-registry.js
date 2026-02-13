import { Builder } from '@builder.io/react';
import ParticleMorph from './ParticleMorph';
import ScrollSections from './ScrollSections';

// Register ParticleMorph
Builder.registerComponent(ParticleMorph, {
    name: 'ParticleMorph',
    inputs: [
        {
            name: 'scrollProgress',
            type: 'number',
            defaultValue: 0,
            helperText: 'Simulate scroll position (0 to 1)',
        },
    ],
});

// Register ScrollSections (The cards)
Builder.registerComponent(ScrollSections, {
    name: 'ScrollSections',
    inputs: [
        {
            name: 'scrollY',
            type: 'number',
            defaultValue: 0,
        }
    ],
});
