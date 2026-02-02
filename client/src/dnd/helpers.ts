export const SHELL_CAPACITIES = [2, 8, 18, 32, 32, 18, 8];

export interface ElectronPosition {
    shellIndex: number;
    angle: number; // in degrees
    x: number;
    y: number;
}

/**
 * Calculates positions for electrons based on Bohr model.
 * @param count - Total number of electrons.
 * @returns Array of positions for each electron.
 */
export const calculateElectronPositions = (count: number): ElectronPosition[] => {
    const positions: ElectronPosition[] = [];
    let electronsLeft = count;

    for (let shellIndex = 0; shellIndex < SHELL_CAPACITIES.length; shellIndex++) {
        if (electronsLeft <= 0) break;

        const capacity = SHELL_CAPACITIES[shellIndex];
        const countInShell = Math.min(electronsLeft, capacity);
        electronsLeft -= countInShell;

        const radius = 60 + shellIndex * 35; // Radius starts at 60 and grows

        for (let i = 0; i < countInShell; i++) {
            const angle = (360 / countInShell) * i - 90; // Even spacing, offset to start at top
            const rad = (angle * Math.PI) / 180;

            positions.push({
                shellIndex,
                angle,
                x: Math.cos(rad) * radius,
                y: Math.sin(rad) * radius
            });
        }
    }

    return positions;
};
