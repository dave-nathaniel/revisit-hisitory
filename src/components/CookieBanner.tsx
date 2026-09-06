import { COOKIE } from '../data/siteContent';

/**
 * Consent banner — the worked example of the "big type, judiciously" rule.
 * It is a slim one-line bar, not display type, and the OK is an inline
 * underlined button inside the sentence (a link buried mid-sentence needs a
 * non-colour cue, so it underlines in currentColor — `.inline-link`'s faint ink
 * tint is tuned for ink-on-paper and would vanish on this dark ground).
 *
 * It always renders. Dismissal is the `.hidden` class, added by useSiteMotion —
 * which also reads localStorage on mount and looks `#cookieOk` up by id with no
 * null guard, so rendering this conditionally would throw.
 */
export interface CookieBannerProps {
	readonly className?: string;
}

export default function CookieBanner({ className }: CookieBannerProps) {
	return (
		<div className={className ? `cookies ${className}` : 'cookies'} id="cookies">
			<p className="ck-msg">
				{COOKIE.message}
				<button id="cookieOk">{COOKIE.accept}</button>
			</p>
		</div>
	);
}
