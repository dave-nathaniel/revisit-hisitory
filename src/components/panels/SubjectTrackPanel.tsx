import type { CSSProperties } from 'react';
import RhMark from '../RhMark';
import TrackPanel from './TrackPanel';
import { SUBJECT, SUBJECT_TRACK } from '../../data/siteContent';

/**
 * THE SUBJECT PANEL — "A Colonial Present", split in two. The cover stands still
 * on the left; a rail of panels scrubs past on the right, driven by vertical
 * scroll. When the rail runs out, the page carries on down into Formats.
 *
 * This replaces two panels that used to be stacked vertically: the subject cover
 * and Antwerp. Antwerp is now the rail's first panel — it was always the
 * subject's *starting point*, and the rail is where a starting point belongs.
 *
 * WHY THE PIN IS `position: sticky` AND NOT ScrollTrigger's `pin`. The GreenSock
 * demos this is modelled on (codepen YzygYvM, WNjaxKp) both pin the container
 * with ScrollTrigger. `pin: true` wraps the pinned element in a spacer <div>,
 * and buildSnapTable() derives the whole snap ladder by walking
 * `main.panels`'s children filtering for `tagName === 'SECTION'` — a wrapped
 * section drops out of that walk and every offset below it shifts. So the pin
 * comes from the same sticky rule every other panel on this site uses, and only
 * the horizontal TWEEN is taken from the demos. See useSiteMotion.
 *
 * THREE NUMBERS DERIVE FROM ONE ARRAY and must not be written by hand:
 *   `--track-steps`    → the section's height, (1 + steps) × 100vh
 *   `data-snap-steps`  → the intermediate snap points buildSnapTable() adds
 *   the tween's travel  → `xPercent: -100 * steps`
 * All three are `SUBJECT_TRACK.panels.length - 1`. One viewport of vertical
 * scroll then advances the rail by exactly one panel, and each panel gets a
 * place the page can come to rest on. Break the agreement and the rail settles
 * between panels.
 *
 * The id stays `#colonial` — it is what the snap table and any in-page link
 * resolve through, and the merged panel is still the subject's cover.
 *
 * "A Colonial Present" is not a typo for "Presence". It is a double entendre —
 * the colonial now, and the colonial bequest — and the `<em>` lands on the
 * pivoting word for exactly that reason.
 */
export interface SubjectTrackPanelProps {
	readonly id?: string;
}

export default function SubjectTrackPanel({ id = 'colonial' }: SubjectTrackPanelProps) {
	const panels = SUBJECT_TRACK.panels;
	const steps = panels.length - 1;

	return (
		<section
			className="subject-track"
			id={id}
			data-section="colonial"
			data-snap-steps={steps}
			style={{ '--track-steps': steps } as CSSProperties}
		>
			{/* The section box is several viewports tall, but only its first viewport
			    is ever on screen — it is stuck at top:0 for the whole run. The stage is
			    absolutely positioned into that first viewport so the split always
			    measures exactly one screen, whatever the section's height is. */}
			<div className="track-stage">
				{/* THE COVER IS DELIBERATELY THIN — a standing marker, not a column of
				    argument. It holds the breadcrumb, the subject's name and its lede,
				    and nothing else; the two method paragraphs that used to sit under
				    them are now rail panel IV (2026-09-03, at the site owner's request:
				    narrower, less text, pinned top-left). It is aligned to the TOP of the
				    stage rather than centred, so the name stays put at the same height
				    while four panels of different shapes pass beside it. */}
				<div className="track-cover">
					<div className="eyebrow crumb gsap-fade">
						<RhMark /> · {SUBJECT.crumb}
					</div>
					<h2 className="subject-title" data-split="">
						{SUBJECT.titleLead}
						<em>{SUBJECT.titleEm}</em>
					</h2>
					<p className="subject-lede gsap-fade">{SUBJECT.lede}</p>
				</div>

				<div className="track-viewport">
					<div className="track-rail">
						{panels.map((panel, i) => (
							<TrackPanel
								key={panel.ord}
								panel={panel}
								hint={i === 0 ? SUBJECT_TRACK.hint : undefined}
							/>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
