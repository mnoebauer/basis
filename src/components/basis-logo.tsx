type BasisLogoProps = {
  invert?: boolean;
};

export function BasisLogo({ invert = false }: BasisLogoProps) {
  const textClass = invert ? "text-white" : "text-black";

  return (
    <div className={`flex items-center gap-3 ${textClass}`}>
      
      <span className="text-2xl font-semibold tracking-[-0.015em]">Basis</span>
    </div>
  );
}
