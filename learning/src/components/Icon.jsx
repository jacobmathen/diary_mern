const paths={
book:'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4z M13 7a3 3 0 0 1 3-3h5v15h-4a4 4 0 0 0-4 2',
grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z',
search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
plus:'M12 5v14 M5 12h14',arrow:'M5 12h14 M13 6l6 6-6 6',
image:'M3 3h18v18H3z m0 13 5-5 5 5 3-3 5 5 M15 7h.01',
close:'m6 6 12 12 M6 18 18 6',logout:'M9 3H4v18h5 M10 12h11 m-5-5 5 5-5 5',
moon:'M20 14A9 9 0 0 1 10 4a9 9 0 1 0 10 10',
chart:'M4 20V10 M12 20V4 M20 20v-7',download:'M12 3v12 m-5-5 5 5 5-5 M4 17v4h16v-4',
trash:'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
edit:'m4 16-1 5 5-1L21 7l-4-4z M14 6l4 4',
};
export default function Icon({name,size=20,...props}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]||paths.book}/></svg>;}
