import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_MATCH_MODE, isMatchMode, type MatchMode } from '@find-number/shared'

type Settings = {
  nickname: string
  alternateSlotsLocal: boolean
  /** Last-used mode in Practice */
  practiceMode: MatchMode
  /** Last-used mode in Create Room */
  createRoomMode: MatchMode
  setNickname: (n: string) => void
  setAlternateSlots: (v: boolean) => void
  setPracticeMode: (m: MatchMode) => void
  setCreateRoomMode: (m: MatchMode) => void
}

export const useSettingsStore = create<Settings>()(
  persist(
    (set) => ({
      nickname: '',
      alternateSlotsLocal: true,
      practiceMode: 'quick',
      createRoomMode: 'quick',
      setNickname: (nickname) => set({ nickname }),
      setAlternateSlots: (alternateSlotsLocal) => set({ alternateSlotsLocal }),
      setPracticeMode: (practiceMode) =>
        set({ practiceMode: isMatchMode(practiceMode) ? practiceMode : DEFAULT_MATCH_MODE }),
      setCreateRoomMode: (createRoomMode) =>
        set({ createRoomMode: isMatchMode(createRoomMode) ? createRoomMode : DEFAULT_MATCH_MODE }),
    }),
    { name: 'fn:settings' },
  ),
)
