type MaterialIconProps = {
  icon: string;
  filled?: boolean;
  className?: string;
};

export function MaterialIcon({ icon, filled = false, className = "" }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined not-italic leading-none ${className}`}
      style={
        filled
          ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
          : undefined
      }
      aria-hidden
    >
      {icon}
    </span>
  );
}
