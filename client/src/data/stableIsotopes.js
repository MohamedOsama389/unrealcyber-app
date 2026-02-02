// Simplified stability data for educational purposes.
// For first ~30 elements, lists common stable mass numbers.
// This is an educational approximation.

export const STABLE_ISOTOPES = {
    1: [1, 2], // H-1, H-2 (Deuterium)
    2: [3, 4], // He-3, He-4
    3: [6, 7], // Li
    4: [9],    // Be
    5: [10, 11], // B
    6: [12, 13], // C
    7: [14, 15], // N
    8: [16, 17, 18], // O
    9: [19], // F
    10: [20, 21, 22], // Ne
    11: [23], // Na
    12: [24, 25, 26], // Mg
    13: [27], // Al
    14: [28, 29, 30], // Si
    15: [31], // P
    16: [32, 33, 34, 36], // S
    17: [35, 37], // Cl
    18: [36, 38, 40], // Ar
    19: [39, 41], // K (40 is radioactive but long lived, excluded for simplicity or can be added)
    20: [40, 42, 43, 44, 46, 48], // Ca
    21: [45], // Sc
    22: [46, 47, 48, 49, 50], // Ti
    23: [51], // V
    24: [50, 52, 53, 54], // Cr
    25: [55], // Mn
    26: [54, 56, 57, 58], // Fe
    27: [59], // Co
    28: [58, 60, 61, 62, 64], // Ni
    29: [63, 65], // Cu
    30: [64, 66, 67, 68, 70], // Zn
};

export const checkStability = (protons, neutrons) => {
    if (protons === 0 && neutrons === 0) return true; // Empty
    if (protons === 0) return false; // Just neutrons

    const mass = protons + neutrons;
    const stableMasses = STABLE_ISOTOPES[protons];

    if (!stableMasses) {
        // Fallback rule for heavier elements (approximate)
        // Ratio 1:1 up to 20, rising to 1:1.5
        const ratio = neutrons / protons;
        return ratio >= 1 && ratio <= 1.5;
    }

    return stableMasses.includes(mass);
};
