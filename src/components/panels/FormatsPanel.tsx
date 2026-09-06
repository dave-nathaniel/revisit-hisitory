import FormatField from './FormatField';
import { FORMATS } from '../../data/siteContent';

/**
 * PUBLIC FORMATS — content of the A Colonial Present subject, so it carries an
 * `A Colonial Present · …` breadcrumb rather than an umbrella-level one, and
 * stays inside the subject's colour world.
 *
 * REBUILT 2026-09-03 (the site owner on the previous version: "I don't like the
 * presentation at all"). It is now a three-field split, borrowing the grammar the
 * subject track above it established — a thin standing statement on the left,
 * content in wide fields on the right:
 *
 *   [ statement ][ format I ][ format II ]
 *
 * The statement rail keeps the panel's framing copy; each format owns a
 * full-height field with its own ground. The head is deliberately DEMOTED from
 * the display size it used to have: on a panel whose job is to present two
 * offers, the offers' names are what should shout, and the house rule is one
 * shout per surface. Its `data-split` word reveal is unchanged.
 *
 * `.formats-statement h2` is still clamped on both axes, and this panel is still the
 * reason that rule exists — sized on width alone it overflowed a 618px-tall
 * viewport by 221px and the copy silently vanished under the 100vh
 * `overflow: hidden` pin. Every size in the fields is clamped the same way.
 * Verify any copy change by measuring content height against innerHeight at
 * ~618px tall, not by eye at desktop size.
 *
 * There is no `.subject-wrap` here any more: the fields are full-bleed, so the
 * `--max` cap would have left a band of ground down both edges of a layout whose
 * whole point is that the fields ARE the panel.
 */
export interface FormatsPanelProps {
	readonly id?: string;
}

export default function FormatsPanel({ id = 'formats' }: FormatsPanelProps) {
	return (
		<section className="formats" id={id} data-section="formats">
			<div className="formats-statement">
				<div className="eyebrow crumb gsap-fade">{FORMATS.crumb}</div>
				<h2 data-split="">
					{FORMATS.headLead}
					<em>{FORMATS.headEm}</em>
					{FORMATS.headTail}
				</h2>
				<p className="formats-lede gsap-fade">{FORMATS.lede}</p>
			</div>

			{FORMATS.cards.map((card, i) => (
				<FormatField card={card} index={i + 1} key={card.ord} />
			))}
		</section>
	);
}
