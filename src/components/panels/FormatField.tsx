import type { FormatCard as FormatCardData } from '../../data/siteContent';

/**
 * ONE FORMAT, AS A FIELD — not a card. This replaced `FormatCard` (2026-09-03)
 * because the card presentation did not work: two loose text columns adrift in a
 * large empty ground, with a 100px roman numeral shouting above a 20px title, so
 * the numeral carried the hierarchy and the format's NAME whispered. And nothing
 * in it let you compare two offers that vary along exactly four axes.
 *
 * What changed, in order of importance:
 *   1. The TITLE is the display type now, and the numeral is a small archival
 *      mark like the subject track's. The loud thing on the panel is the thing
 *      the reader is choosing between.
 *   2. The chip row became a keyed SPEC LIST. Four rows in a fixed order, so the
 *      same question is asked of both formats and the answers sit on the same
 *      baselines — the comparison is the presentation.
 *   3. Each format owns a full-height TERRITORY with its own ground, one tone
 *      step apart. Still no card, mat, keyline or inset: the fields bleed to the
 *      panel's top and bottom edges and meet at a hard seam, which is a change of
 *      place rather than a box. See the note in site.css for the tonal ramp and
 *      why every step of it clears contrast.
 *
 * The body sits in a `1fr` row so the CTA is pushed to the bottom of the field.
 * That is what keeps the two CTAs on one line despite the two bodies being very
 * different lengths — the old columns' ragged bottoms were half the problem.
 */
export interface FormatFieldProps {
	readonly card: FormatCardData;
	/** 1-based, and only used to pick the field's ground. */
	readonly index: number;
}

export default function FormatField({ card, index }: FormatFieldProps) {
	return (
		<article className={`format-field format-field--${index}`}>
			<div className="format-ord gsap-fade">{card.ord}</div>

			<h3 className="format-title gsap-fade">
				{card.titleLead}
				<em>{card.titleEm}</em>
			</h3>

			<dl className="format-specs gsap-fade">
				{card.specs.map((spec) => (
					<div className="format-spec" key={spec.k}>
						<dt>{spec.k}</dt>
						<dd>{spec.v}</dd>
					</div>
				))}
			</dl>

			<p className="format-body gsap-fade">{card.body}</p>

			{/* Solid `clip-path` arrowhead, hover slides it — never a chevron glyph
			    and never a rule. */}
			<a
				className="card-cta gsap-fade"
				href={card.ctaHref}
				{...(card.ctaInPage ? { 'data-link': '' } : {})}
			>
				{card.ctaLabel} <span className="arrow" aria-hidden="true" />
			</a>
		</article>
	);
}
