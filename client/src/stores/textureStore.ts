import { create } from "zustand";

const textures = Array.from({ length: 12 }, (_, i) => `/textures/${i + 1}.png`);

interface TextureState {
  currentTexture: string;
  nextTexture: string | null;
  preloadNextTexture: () => void;
  setRandomTexture: () => void;
}

const preloadImage = (src: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = resolve;
    img.onerror = reject;
  });
};

export const useTextureStore = create<TextureState>((set, get) => {
  const initialState = {
    currentTexture: textures[Math.floor(Math.random() * textures.length)],
    nextTexture: null,
    preloadNextTexture: () => {
      const currentTexture = get().currentTexture;
      let nextTextureSrc;
      do {
        nextTextureSrc =
          textures[Math.floor(Math.random() * textures.length)];
      } while (nextTextureSrc === currentTexture);

      preloadImage(nextTextureSrc).then(() => {
        set({ nextTexture: nextTextureSrc });
      });
    },
    setRandomTexture: () => {
      const { nextTexture, preloadNextTexture } = get();
      if (nextTexture) {
        set({ currentTexture: nextTexture, nextTexture: null });
        preloadNextTexture();
      } else {
        // Fallback for initial load or if preloading fails
        const currentTexture = get().currentTexture;
        let nextTextureSrc;
        do {
          nextTextureSrc =
            textures[Math.floor(Math.random() * textures.length)];
        } while (nextTextureSrc === currentTexture);
        set({ currentTexture: nextTextureSrc });
        preloadNextTexture();
      }
    },
  };

  return initialState;
});
