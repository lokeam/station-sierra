interface LogoProps {
  size?: number;
  color?: string;
}

export function Logo({ size = 25, color = 'currentColor' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
    >
      <g
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 228 L128 30 L238 228 Z" />
        <path d="M73 129 L128 30 L183 129" />
        <path d="M18 228 L128 178 L238 228" />
        <path d="M114 56 L128 30 L142 56 Z" />
      </g>
    </svg>
  );
}
