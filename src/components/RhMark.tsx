/**
 * The "Revisit History" wordmark: Revisit in brand orange, History in ink.
 *
 * This is a hard brand rule — EVERY visible instance of the name renders this
 * way, including breadcrumb eyebrows and running body copy, not just headline
 * uses. Inside eyebrows and support copy the mark inherits the host's case,
 * tracking and weight (see the `.eyebrow .rh-mark, .intro-support .rh-mark, …`
 * rule in site.css); only the colour carries over.
 *
 * `.rh-h` is ink by default because every surface on this site is light;
 * `onDark` is the escape hatch for a dark backing. The only unwrapped instance
 * anywhere is the visually-hidden <h1>, which is never painted.
 */
export interface RhMarkProps {
	/** Joins the two words with a non-breaking space (the top-bar brand does). */
	readonly nbsp?: boolean;
	/** Adds `on-light`, as the intro lede does. */
	readonly onLight?: boolean;
	/** Adds `on-dark` — for a dark backing only. */
	readonly onDark?: boolean;
}

export default function RhMark({ nbsp = false, onLight = false, onDark = false }: RhMarkProps) {
	const cls = ['rh-mark', onLight ? 'on-light' : '', onDark ? 'on-dark' : '']
		.filter(Boolean)
		.join(' ');
	return (
		<span className={cls}>
			<span className="rh-r">Revisit</span>
			{nbsp ? ' ' : ' '}
			<span className="rh-h">History</span>
		</span>
	);
}
