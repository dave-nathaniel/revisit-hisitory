import { SUBJECT, type TrackPanelData } from '../../data/siteContent';

/**
 * ONE PANEL ON THE HORIZONTAL RAIL. Three layouts, one surface: every kind sits
 * flat on `--subject-bg` with no card, edge, mat or keyline, because the whole
 * "A Colonial Present" run is a single uninterrupted colour field and boxing a
 * panel would read as a frame. What distinguishes these panels is that they move
 * past you, not that they are drawn apart.
 *
 * Each panel is `flex: 0 0 100%` of the rail, i.e. exactly the width of the
 * right-hand column, which is what makes the tween's `xPercent: -100 * steps`
 * land each panel flush in the column. Do not give a panel its own width.
 *
 * The headings and paragraphs keep `data-split` / `gsap-fade` so the
 * reduced-motion block in the stylesheet still forces them to their finished
 * state. useSiteMotion deliberately SKIPS these elements in its generic
 * scroll-reveal loops and re-registers them against the rail's tween via
 * ScrollTrigger's `containerAnimation` — a vertical trigger would fire all four
 * panels at once, since horizontally-parked content is already in view
 * vertically.
 */
export interface TrackPanelProps {
	readonly panel: TrackPanelData;
	/** Shown on the first panel only, as the rail's one direction cue. */
	readonly hint?: string;
}

export default function TrackPanel({ panel, hint }: TrackPanelProps) {
	const { ord, kind } = panel;

	return (
		<article className={`track-panel track-panel--${kind}`} data-ord={ord}>
			<div className="track-ord gsap-fade">{ord}</div>

			{kind === 'statement' && (
				<div className="track-body">
					<h2 className="track-head" data-split="">
						{panel.headLead}
						<em>{panel.headEm}</em>
					</h2>
					<p className="track-turn gsap-fade">{panel.turn}</p>
					{hint && (
						<p className="track-hint gsap-fade">
							{hint}
							{/* Solid arrowhead via clip-path, never a chevron glyph and never a
							    border trick — the same shape `.card-cta .arrow` uses. */}
							<span className="arrow" aria-hidden="true" />
						</p>
					)}
				</div>
			)}

			{kind === 'text' && (
				<div className="track-body track-text">
					{panel.paras?.map((para) => (
						<p className="gsap-fade" key={para.slice(0, 32)}>
							{para}
						</p>
					))}
				</div>
			)}

			{/* The subject's method note. It reads from SUBJECT rather than from the
			    panel's own data because it IS that copy — it was the cover's until the
			    cover was narrowed — and duplicating it into the track array would leave
			    two places to edit one paragraph. The italic pivot on "inherited" is why
			    it cannot just be a `text` panel's plain strings. */}
			{kind === 'method' && (
				<div className="track-body track-text">
					<p className="gsap-fade">
						{SUBJECT.methodOneLead}
						<em>{SUBJECT.methodOneEm}</em>
						{SUBJECT.methodOneTail}
					</p>
					<p className="gsap-fade">{SUBJECT.methodTwo}</p>
				</div>
			)}

			{kind === 'image' && (
				<figure className="track-figure">
					{/* Full-bleed: the photograph runs to the panel's edges rather than
					    sitting on a mat. The caption and credit sit over a bottom scrim —
					    a fill, which is allowed, not a line, which is not. */}
					<img src={panel.src} alt={panel.alt ?? ''} loading="lazy" decoding="async" />
					<figcaption className="gsap-fade">
						{panel.caption && <span className="track-caption">{panel.caption}</span>}
						{panel.credit && <span className="track-credit">{panel.credit}</span>}
					</figcaption>
				</figure>
			)}
		</article>
	);
}
