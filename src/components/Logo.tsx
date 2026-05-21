type Props = {
  height?: number;
  className?: string;
  iconOnly?: boolean;
};

/**
 * Icon comes from `/assets/ScanGoLogo.png` (mono-blue, works on both themes).
 * The "ScanGo" wordmark is rendered as text so it auto-adapts to the theme
 * via CSS variables.
 */
export default function Logo({
  height = 56,
  className,
  iconOnly = false,
}: Props) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(height * 0.22),
      }}
    >
      <img
        src="/assets/ScanGoLogo.png"
        alt="ScanGo"
        width={height}
        height={height}
        style={{ objectFit: "contain", display: "block" }}
      />
      {!iconOnly && (
        <span
          style={{
            fontSize: Math.round(height * 0.55),
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--color-text)",
            lineHeight: 1,
          }}
        >
          ScanGo
        </span>
      )}
    </span>
  );
}
