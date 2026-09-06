import { NAV_ITEMS } from '../data/siteContent';

/**
 * Mobile menu. Open/closed is the `.open` class, added and removed by
 * useSiteMotion (via `#menuBtn`, `#menuClose`, a delegated click on the overlay
 * itself, and the in-page nav handler which closes it by id). It therefore
 * always renders — never conditionally — so those getElementById lookups
 * cannot return null.
 */
export interface MenuOverlayProps {
	readonly className?: string;
}

export default function MenuOverlay({ className }: MenuOverlayProps) {
	return (
		<div
			className={className ? `menu-overlay ${className}` : 'menu-overlay'}
			id="menuOverlay"
			role="dialog"
			aria-modal="true"
		>
			<button className="close" id="menuClose" aria-label="Close menu">
				Close
			</button>
			<ul>
				{NAV_ITEMS.map((item) => (
					<li key={item.href}>
						<a href={item.href} data-link="">
							{item.label}
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}
