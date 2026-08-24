import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCandidateStore = create(
    persist(
        (set, get) => ({
            candidates: [],
            theme: 'dark', // 'dark' | 'light' | 'cyber'
            
            // Admin Access Control
            isAdmin: true, // defaults to true for initial setup, can be locked by user
            adminPin: '1234',
            isAdminProtected: true,

            addCandidate: (c) => set((s) => ({ candidates: [...s.candidates, c] })),
            deleteCandidate: (id) => set((s) => ({ candidates: s.candidates.filter(c => c.id !== id) })),
            clearAll: () => set({ candidates: [] }),
            setTheme: (theme) => set({ theme }),

            // Admin Actions
            loginAdmin: (pin) => {
                const currentPin = get().adminPin || '1234';
                if (pin === currentPin) {
                    set({ isAdmin: true });
                    return true;
                }
                return false;
            },
            logoutAdmin: () => set({ isAdmin: false }),
            setAdminPin: (newPin) => set({ adminPin: newPin }),
            toggleAdminProtection: (enabled) => set({ isAdminProtected: enabled }),
        }),
        {
            name: 'talent-ai-storage',
            partialize: (state) => ({
                candidates: state.candidates,
                theme: state.theme,
                adminPin: state.adminPin,
                isAdminProtected: state.isAdminProtected,
            })
        }
    )
)
