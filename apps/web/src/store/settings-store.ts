import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Settings = {
  nickname: string
  alternateSlotsLocal: boolean
  setNickname: (n: string) => void
  setAlternateSlots: (v: boolean) => void
}

export const useSettingsStore = create<Settings>()(
  persist(
    (set) => ({
      nickname: '',
      alternateSlotsLocal: true,
      setNickname: (nickname) => set({ nickname }),
      setAlternateSlots: (alternateSlotsLocal) => set({ alternateSlotsLocal }),
    }),
    { name: 'fn:settings' },
  ),
)
