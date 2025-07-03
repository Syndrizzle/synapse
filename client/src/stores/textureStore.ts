import { create } from 'zustand';

const textures = Array.from({ length: 12 }, (_, i) => `/textures/${i + 1}.png`);

interface TextureState {
  currentTexture: string;
  setRandomTexture: () => void;
}

export const useTextureStore = create<TextureState>((set) => ({
  currentTexture: textures[Math.floor(Math.random() * textures.length)],
  setRandomTexture: () => {
    set({ currentTexture: textures[Math.floor(Math.random() * textures.length)] });
  },
}));
