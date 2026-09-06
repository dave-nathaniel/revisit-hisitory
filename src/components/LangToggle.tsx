import { Fragment } from 'react';
import { LANGUAGES } from '../data/siteContent';

/**
 * EN / NL toggle. Visual only — no translations are wired. `aria-pressed` is
 * moved between the buttons by useSiteMotion, so the initial values here are
 * the ones the original markup shipped: first language pressed, rest not.
 *
 * The separator uses a keyed Fragment rather than a wrapper element: `.lang` is
 * a flex row whose gap and sizing apply to its direct children, so introducing
 * an extra DOM node between them would change the layout.
 */
export interface LangToggleProps {
	readonly label?: string;
}

export default function LangToggle({ label = 'Language' }: LangToggleProps) {
	return (
		<div className="lang" aria-label={label}>
			{LANGUAGES.map((lang, i) => (
				<Fragment key={lang}>
					{i > 0 && <span aria-hidden="true">/</span>}
					<button aria-pressed={i === 0 ? 'true' : 'false'}>{lang}</button>
				</Fragment>
			))}
		</div>
	);
}
