interface BackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export function Background({ className, children }: BackgroundProps) {
  return (
    <div className={` relative min-h-screen w-full `}>
    <div className="bg-[url('/background.webp')] bg-cover fixed inset-0 z-0 brightness-60 bg-center"></div>
      <div className={`relative z-10 ${className}`}>{children}</div>
    </div>
  );
}
