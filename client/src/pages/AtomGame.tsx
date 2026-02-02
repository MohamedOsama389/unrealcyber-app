import React from 'react';
import SimEmbed from '../components/games/SimEmbed';

const AtomGame: React.FC = () => {
    return (
        <div className="w-screen h-screen bg-white">
            <SimEmbed
                src="https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html"
                title="Build an Atom"
                height="100%"
            />
        </div>
    );
};

export default AtomGame;
