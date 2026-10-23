// Lucide icons (https://lucide.dev) as raw SVG.
const Icon = ({
  children,
  bgColor = "transparent",
  strokeColor = "currentColor",
  fillColor = "none",
  strokeWidth = 2,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill={fillColor}
    stroke={strokeColor}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ verticalAlign: "-0.125em", background: bgColor }}
  >
    {children}
  </svg>
);

// check
export const ResetIcon = (props) => (
  <Icon strokeWidth={3} {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

// play
export const PlayIcon = (props) => (
  <Icon fillColor="currentColor" {...props}>
    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
  </Icon>
);

// pause
export const PauseIcon = (props) => (
  <Icon fillColor="currentColor" {...props}>
    <rect x="14" y="3" width="5" height="18" rx="1" />
    <rect x="5" y="3" width="5" height="18" rx="1" />
  </Icon>
);
