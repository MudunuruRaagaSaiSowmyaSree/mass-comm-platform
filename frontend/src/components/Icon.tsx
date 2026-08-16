export function Icon({ path, className = "w-5 h-5" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const icons = {
  speaker: "M11 5 6 9H2v6h4l5 4V5ZM19.1 4.9a11 11 0 0 1 0 14.2M15.5 8.5a6 6 0 0 1 0 7",
  grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  megaphone: "M3 11v2a2 2 0 0 0 2 2h1l3 5 1-1-1-4h6l4 3V6l-4 3H9L6 5 5 6l1 4H5a2 2 0 0 0-2 2v-1Z",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
  layout: "M4 5h16v4H4V5Zm0 6h7v8H4v-8Zm9 0h7v8h-7v-8Z",
  users: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm11 10v-2a4 4 0 0 0-3-3.9M16 3.1A4 4 0 0 1 16 11",
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0M12 18v3m-3 0h6",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.2 0 4-4 4-9s-1.8-9-4-9-4 4-4 9 1.8 9 4 9ZM3.6 9h16.8M3.6 15h16.8",
  shield: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Zm-3 9 2 2 4-4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 3",
  chart: "M4 20V10m6 10V4m6 16v-7",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.2-1.7l2-1.6-2-3.4-2.4.9a7.5 7.5 0 0 0-1.5-.9L15 2.5H9l-.3 2.8a7.5 7.5 0 0 0-1.5.9l-2.4-.9-2 3.4 2 1.6a7.4 7.4 0 0 0 0 3.4l-2 1.6 2 3.4 2.4-.9c.5.4 1 .7 1.5.9L9 21.5h6l.3-2.8c.5-.2 1-.5 1.5-.9l2.4.9 2-3.4-2-1.6c.1-.5.2-1.1.2-1.7Z",
  chevronDown: "M6 9l6 6 6-6",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
};