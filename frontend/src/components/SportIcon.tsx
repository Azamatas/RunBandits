const icons = {
  run: (
    <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
  ),
  ride: (
    <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zM10.9 8.6l2.1 2v5.4h-2V12l-2.6-2.3-3.4 3.4 1.4 1.4L9 12l1.9-1.4z" />
  ),
  walk: (
    <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3c.8.9 1.8 1.6 3 2v-2c-1-.5-1.8-1.2-2.3-2l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
  ),
  hike: (
    <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM17.5 10.78l-1.14-4.28c-.29-.97-1.18-1.64-2.19-1.62l-1.71.03a2.283 2.283 0 0 0-1.87 1.16l-.92 1.63c-.33.58-.2 1.32.3 1.76l2.53 2.24-1.02 5.82L9 14.5l-3 9h2.12l2.18-6.5 2.2 2.28V23h2v-4.72l-2.3-3.58.77-4.42 1.33 1.5c.42.47 1.02.78 1.7.78h3V10.78h-1.5z" />
  ),
};

export default function SportIcon({ sport, size = 24, color = "currentColor", className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      className={className}
      aria-label={sport}
    >
      {icons[sport] ?? icons.run}
    </svg>
  );
}

export function KudosIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 2 7.59 8.59C7.22 8.95 7 9.45 7 10v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
  );
}

export function SearchIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}

export function LogoIcon({ size = 28 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size}>
      {/* Ears */}
      <path d="M5 9 L9 2 L13 10 Z" fill="#e8651b" />
      <path d="M27 9 L23 2 L19 10 Z" fill="#e8651b" />
      {/* Inner ear */}
      <path d="M7.5 8 L9 4 L11 8.5 Z" fill="#7a2c08" />
      <path d="M24.5 8 L23 4 L21 8.5 Z" fill="#7a2c08" />
      {/* Head */}
      <circle cx="16" cy="17" r="11" fill="#f47925" />
      {/* White muzzle */}
      <ellipse cx="16" cy="22" rx="6" ry="4.5" fill="#ffffff" />
      {/* Blue bandit mask */}
      <path
        d="M4 13.5 Q10 11.5 16 13.5 Q22 11.5 28 13.5 L27 17.5 Q22 18.5 16 17 Q10 18.5 5 17.5 Z"
        fill="#1e6cd9"
        stroke="#0a3a8a"
        strokeWidth="0.4"
      />
      {/* Eyes */}
      <circle cx="11" cy="15.5" r="1.3" fill="#ffffff" />
      <circle cx="21" cy="15.5" r="1.3" fill="#ffffff" />
      <circle cx="11" cy="15.5" r="0.6" fill="#0a0a0a" />
      <circle cx="21" cy="15.5" r="0.6" fill="#0a0a0a" />
      {/* Nose */}
      <ellipse cx="16" cy="20" rx="1.4" ry="1.1" fill="#1a0d05" />
      {/* Mouth */}
      <path d="M14 22.5 Q16 24 18 22.5" stroke="#1a0d05" strokeWidth="0.7" fill="none" strokeLinecap="round" />
    </svg>
  );
}
