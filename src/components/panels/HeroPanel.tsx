import { HERO } from '../../data/siteContent';

/**
 * HERO — the signature curtain reveal. REVISIT (orange) and HISTORY (white)
 * fill the viewport split horizontally; on scroll REVISIT slides up and HISTORY
 * slides down to uncover the site.
 *
 * The panel is 175vh tall so it acts as its own pinned scene: the first ~0.85vh
 * of scroll scrubs the curtain, and the height is tuned so the next panel starts
 * covering exactly as the curtain clears — no blank-paper gap. It also has no
 * snap point at all, by request, which does double duty: with nothing at 0,
 * scrolling back up out of Intro free-falls into the curtain instead of being
 * yanked forward again.
 *
 * The ids here (`heroBg`, `curtainRevisit`, `curtainHistory`) are the handles
 * useSiteMotion animates; the `<h1>` is the page's only unwrapped instance of
 * the wordmark, and is screen-reader-only so it is never painted.
 */
export interface HeroPanelProps {
	readonly id?: string;
}

export default function HeroPanel({ id = 'top' }: HeroPanelProps) {
	return (
		<section className="hero" id={id} data-section="hero">
			<div className="hero-bg" id="heroBg" aria-hidden="true" />
			<div className="hero-curtain" aria-hidden="true">
				<span className="curtain-word curtain-revisit" id="curtainRevisit">
					{HERO.curtainTop}
				</span>
				<span className="curtain-word curtain-history" id="curtainHistory">
					{HERO.curtainBottom}
				</span>
			</div>
			{/* Accessible heading. The hero eyebrow and the "Scroll" affordance that
			    used to sit here are commented out in the source markup, so they are
			    intentionally absent — not lost in the port. */}
			<h1 className="visually-hidden">{HERO.srHeading}</h1>
		</section>
	);
}
