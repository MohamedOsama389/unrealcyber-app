export type ParticleType = 'proton' | 'neutron' | 'electron';

export interface DragItem {
    type: ParticleType;
    id: string; // Unique ID for each dragged instance
}

export const DROP_ZONES = {
    NUCLEUS: 'nucleus-drop-zone',
    SHELLS: 'shells-drop-zone',
    TRASH: 'trash-drop-zone'
} as const;
