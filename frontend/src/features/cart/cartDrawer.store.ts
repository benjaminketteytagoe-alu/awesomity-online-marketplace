import { create } from 'zustand';

interface CartDrawerState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Drawer open/close state.
 *
 * Small, dedicated store so the header button, product page buttons,
 * and the drawer itself can all control it without prop drilling.
 * Kept separate from useCartStore so cart contents and UI state don't
 * get tangled — one is persisted, the other is ephemeral.
 */
export const useCartDrawerStore = create<CartDrawerState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
