export default function AuthBloom() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="mila-bloom-petal" x1="16" y1="10" x2="47" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFDCE7" />
          <stop offset="1" stopColor="#E77FA5" />
        </linearGradient>
        <linearGradient id="mila-bloom-leaf" x1="31" y1="38" x2="51" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A9E5D1" />
          <stop offset="1" stopColor="#2A9B78" />
        </linearGradient>
      </defs>
      <path d="M33 39c.4 7.6 3.8 12.5 9.9 16.2" fill="none" stroke="#2A8469" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M41.2 49.7c5-1.7 9.2-.3 11.1 3.8-5.1 1.9-9.2.5-11.1-3.8Z" fill="url(#mila-bloom-leaf)" stroke="#287B64" strokeWidth="1.2" strokeLinejoin="round" />
      <g fill="url(#mila-bloom-petal)" stroke="#B84E77" strokeWidth="1.25">
        <ellipse cx="32" cy="18.5" rx="8.5" ry="12.2" />
        <ellipse cx="32" cy="18.5" rx="8.5" ry="12.2" transform="rotate(72 32 32)" />
        <ellipse cx="32" cy="18.5" rx="8.5" ry="12.2" transform="rotate(144 32 32)" />
        <ellipse cx="32" cy="18.5" rx="8.5" ry="12.2" transform="rotate(216 32 32)" />
        <ellipse cx="32" cy="18.5" rx="8.5" ry="12.2" transform="rotate(288 32 32)" />
      </g>
      <circle cx="32" cy="32" r="7.2" fill="#F7CF69" stroke="#9A6E16" strokeWidth="1.35" />
      <circle cx="29.8" cy="29.7" r="1.7" fill="#FFF7D7" opacity=".9" />
    </svg>
  );
}
