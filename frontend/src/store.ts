import { create } from 'zustand';
import type { Offer } from './types';

interface StoreState {
    offers: Offer[];
    isLoading: boolean;
    setOffers: (offers: Offer[]) => void;
    addOffer: (offer: Offer) => void;
    setLoading: (loading: boolean) => void;
    priorityOrigin: string | null;
    setPriorityOrigin: (origin: string | null) => void;
    showOnlyPriority: boolean;
    setShowOnlyPriority: (show: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
    offers: [],
    isLoading: false,
    setOffers: (offers) => set({ offers }),
    addOffer: (offer) => set((state) => {
        // Prevent duplicates in frontend too just in case
        if (state.offers.some(o => o.id === offer.id)) return state;
        return { offers: [offer, ...state.offers] };
    }),
    setLoading: (loading) => set({ isLoading: loading }),
    priorityOrigin: null,
    setPriorityOrigin: (origin) => set({ priorityOrigin: origin }),
    showOnlyPriority: false,
    setShowOnlyPriority: (show) => set({ showOnlyPriority: show }),
}));
