import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // -- Auth & User --
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),

      // -- UI Settings --
      theme: 'default',
      themeMode: 'dark',
      setTheme: (theme) => set({ theme }),
      setThemeMode: (mode) => set({ themeMode: mode }),

      // -- Current Context --
      activeScreen: 'welcome', // welcome, auth, dashboard, mission, badgehall, admin
      setActiveScreen: (screen) => set({ activeScreen: screen }),
      
      // -- Educational Context --
      currentSubject: null,
      currentCourseId: null,
      setCurrentSubject: (subject) => set({ currentSubject: subject }),
      setCurrentCourseId: (id) => set({ currentCourseId: id }),

      // -- AI Settings --
      missionAiProvider: 'anthropic',
      setMissionAiProvider: (provider) => set({ missionAiProvider: provider }),
      
      // -- Helper: Is Admin? --
      isAdmin: () => get().user?.role === 'admin',
      isTeacher: () => get().user?.role === 'teacher' || get().user?.role === 'admin',
    }),
    {
      name: 'mission-school-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user,
        theme: state.theme,
        themeMode: state.themeMode 
      }),
    }
  )
);
