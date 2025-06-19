export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0  flex items-center z-50 w-full justify-center mt-12 animate-in slide-in-from-top-full duration-700">
      <img
        src="/logo.svg"
        alt="Synapse Logo"
        className="md:h-10 h-8 w-auto object-cover"
      />
    </header>
  );
}
