import type { CSSProperties } from 'react';
import FormatField from './FormatField';
import { FORMATS, GALLERY } from '../../data/siteContent';

/**
 * PUBLIC FORMATS — content of the A Colonial Present subject, so it carries an
 * `A Colonial Present · …` breadcrumb rather than an umbrella-level one, and
 * stays inside the subject's colour world.
 *
 * REBUILT AGAIN (this time into a rail, at the site owner's request: "make
 * [this section] a GSAP slider like 'A Colonial Present' … more of a gallery
 * with the images"). Structurally identical to SubjectTrackPanel: a
 * stationary cover on the left carries the panel's statement, and a
 * horizontal rail on the right carries the two format fields followed by the
 * tour gallery (SUBJECT_TRACK's `track-*` classes are not reused — see the
 * note in site.css — so this gets its own parallel `gallery-*` set, and
 * useSiteMotion.ts duplicates rather than generalises the rail's tween for the
 * same reason: a change to one rail must never silently reach the other).
 *
 * THE SAME "THREE NUMBERS DERIVE FROM ONE ARRAY" RULE APPLIES HERE. `steps` —
 * and with it `--gallery-steps` (the section's height) and `data-snap-steps`
 * (the snap ladder's stops) — is `railItems.length - 1`. Add a format or a
 * gallery image and all three follow automatically.
 */
export interface FormatsPanelProps {
	readonly id?: string;
}

type RailItem =
	| { readonly kind: 'format'; readonly key: string; readonly index: number; readonly card: (typeof FORMATS.cards)[number] }
	| { readonly kind: 'image'; readonly key: string; readonly image: (typeof GALLERY.images)[number] };

export default function FormatsPanel({ id = 'formats' }: FormatsPanelProps) {
	const railItems: readonly RailItem[] = [
		...FORMATS.cards.map(
			(card, i): RailItem => ({ kind: 'format', key: card.ord, index: i + 1, card }),
		),
		...GALLERY.images.map((image): RailItem => ({ kind: 'image', key: image.ord, image })),
	];
	const steps = railItems.length - 1;

	return (
		<section
			className="formats"
			id={id}
			data-section="formats"
			data-snap-steps={steps}
			style={{ '--gallery-steps': steps } as CSSProperties}
		>
			<div className="gallery-stage">
				<div className="gallery-cover">
					<div className="eyebrow crumb gsap-fade">{FORMATS.crumb}</div>
					<h2 className="formats-head" data-split="">
						{FORMATS.headLead}
						<em>{FORMATS.headEm}</em>
						{FORMATS.headTail}
					</h2>
					<p className="formats-lede gsap-fade">{FORMATS.lede}</p>
				</div>

				<div className="gallery-viewport">
					<div className="gallery-rail">
						{railItems.map((item, i) => (
							<article className={`gallery-panel gallery-panel--${item.kind}`} key={item.key}>
								{item.kind === 'format' ? (
									<FormatField card={item.card} index={item.index} />
								) : (
									<>
										<div className="gallery-ord gsap-fade">{item.image.ord}</div>
										<figure className="gallery-figure">
											<img src={item.image.src} alt={item.image.alt} loading="lazy" decoding="async" />
											<figcaption className="gsap-fade">
												{item.image.caption && (
													<span className="gallery-caption">{item.image.caption}</span>
												)}
												{item.image.credit && (
													<span className="gallery-credit">{item.image.credit}</span>
												)}
											</figcaption>
										</figure>
									</>
								)}
								{i === 0 && (
									<p className="gallery-hint gsap-fade">
										{GALLERY.hint}
										<span className="arrow" aria-hidden="true" />
									</p>
								)}
							</article>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
