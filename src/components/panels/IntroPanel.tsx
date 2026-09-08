import RhMark from '../RhMark';
import { INTRO } from '../../data/siteContent';

/**
 * ABOUT — umbrella level (white, outside the subject colour field).
 *
 * `.intro-body` is the lede and deliberately shares `.manifesto h2`'s exact
 * display recipe: both are umbrella-level panels and shout at the same volume.
 * Keep them in step. That applies to the lede only — the three support columns
 * below diverge from manifesto's two on purpose.
 *
 * `.intro-support` is a three-column grid with NO ch cap, so it fills the full
 * `--max` width rather than stopping short. What keeps the measure readable as
 * the columns widen is the paragraph's own size clamp — bigger type and full
 * width are the same fix here. Don't re-add a grid cap, and don't shrink the
 * type without restoring one.
 *
 * `data-scrollread` makes useSiteMotion tint the lede's words from faded to
 * full, scrubbed as the paragraph passes through.
 */
export interface IntroPanelProps {
	readonly id?: string;
}

export default function IntroPanel({ id = 'about' }: IntroPanelProps) {
	return (
		<section className="intro" id={id} data-section="about">
			<div className="intro-grid">
				<div className="intro-main">
					<div className="eyebrow crumb gsap-fade">
						<RhMark /> · {INTRO.crumb}
					</div>
					<p className="intro-body" data-scrollread="">
						{INTRO.title}
					</p>
					<div className="intro-support">
						<p className="gsap-fade">
							<RhMark />
							{INTRO.supportFirstTail}
						</p>
						<p className="gsap-fade">
							{INTRO.supportSecondLead}
							<RhMark />
							{INTRO.supportSecondTail}
						</p>
						<p className="gsap-fade">{INTRO.supportThird}</p>
					</div>
				</div>
				{/* The `.intro-coords` block (51°13′N · 4°24′E, etc.) is commented out in
				    the source markup — intentionally absent, not lost in the port. */}
			</div>
		</section>
	);
}
