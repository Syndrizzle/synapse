export function Footer() {
  return (
    <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">
      <footer className="fixed bottom-0 left-0 right-0 flex-row gap-x-2 flex items-center z-50 w-full justify-center mb-12 animate-in slide-in-from-bottom-full duration-700 opacity-70 hover:opacity-100 transition-opacity">
        <p className="font-body text-white">Powered by</p>
        <img
          src="/openrouter.svg"
          alt="Synapse Logo"
          className="h-10 w-auto object-cover"
        />
      </footer>
    </a>
  );
}
