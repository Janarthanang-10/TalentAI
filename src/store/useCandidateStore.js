import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCandidateStore = create(
    persist(
        (set) => ({
            candidates: [],
            theme: 'dark', // 'dark' | 'light' | 'cyber'

            addCandidate: (c) => set((s) => ({ candidates: [...s.candidates, c] })),
            deleteCandidate: (id) => set((s) => ({ candidates: s.candidates.filter(c => c.id !== id) })),
            clearAll: () => set({ candidates: [] }),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'talent-ai-storage',
            partialize: (state) => ({
                candidates: state.candidates,
                theme: state.theme,
            })
        }
    )
)
