export const STABLE_ISOTOPES: Record<number, number[]> = {
    1: [0, 1], // H-1, H-2 (D)
    2: [1, 2], // He-3, He-4
    3: [3, 4], // Li-6, Li-7
    4: [5],    // Be-9
    5: [5, 6], // B-10, B-11
    6: [6, 7], // C-12, C-13
    7: [7, 8], // N-14, N-15
    8: [8, 9, 10], // O-16, O-17, O-18
    9: [10],   // F-19
    10: [10, 11, 12], // Ne-20, 21, 22
    11: [12],  // Na-23
    12: [12, 13, 14], // Mg-24, 25, 26
    13: [14],  // Al-27
    14: [14, 15, 16], // Si-28, 29, 30
    15: [16],  // P-31
    16: [16, 17, 18, 20], // S-32, 33, 34, 36
    17: [18, 20], // Cl-35, 37
    18: [18, 20, 22], // Ar-36, 38, 40
    19: [20, 22], // K-39, 41
    20: [20, 22, 23, 24, 26, 28], // Ca-40, 42, 43, 44, 46, 48
    // ... Simplified fallback for others or specific common ones
};

/**
 * Checks if isotope with given protons and neutrons is stable.
 * Fallback logic for elements not in precise dataset:
 * Common rule: N/P ratio between 1.0 and 1.5 for smaller/larger atoms.
 */
export const checkStability = (protons: number, neutrons: number): boolean => {
    if (protons === 0) return true;

    // Dataset check
    if (STABLE_ISOTOPES[protons]) {
        return STABLE_ISOTOPES[protons].includes(neutrons);
    }

    // General rule (Valley of Stability)
    const ratio = neutrons / protons;
    if (protons <= 20) {
        return ratio >= 0.8 && ratio <= 1.2;
    } else if (protons <= 118) {
        return ratio >= 1.0 && ratio <= 1.6;
    }

    return false;
};
