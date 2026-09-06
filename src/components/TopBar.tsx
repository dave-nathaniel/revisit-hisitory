import RhMark from './RhMark';
import { NAV_ITEMS } from '../data/siteContent';

/**
 * Top bar — parent style: huge wordmark left, stacked list right.
 *
 * It renders with NO `compact` class, no `is-active` on any link, and no React
 * click handler on the menu button — exactly the markup the original emitted.
 * All three are owned imperatively by useSiteMotion: a ScrollTrigger on the hero
 * adds `.compact` once the curtain has opened (~45% of the hero panel), the
 * panel trackers move `.is-active` between links, and `#menuBtn` gets a plain
 * addEventListener. Do not lift any of it into React state — the hook and React
 * would then be fighting over the same class attribute, and the in-page nav
 * handler reaches straight for `#menuOverlay` by id to close the overlay.
 */
export interface TopBarProps {
	readonly className?: string;
}

export default function TopBar({ className }: TopBarProps) {
	return (
		<header className={className ? `bar ${className}` : 'bar'}>
			<a href="#top" className="brand" aria-label="Revisit History — a programme by Acces">
				<RhMark nbsp />
			</a>
			<ul className="nav-list" aria-label="Primary">
				{NAV_ITEMS.map((item) => (
					<li key={item.href}>
						<a href={item.href} data-link="">
							{item.label}
						</a>
					</li>
				))}
			</ul>
			<button className="menu-btn" id="menuBtn" aria-label="Open menu">
				Menu
			</button>
		</header>
	);
}
