import { FOOTER_LINK } from '../data/siteContent';

/**
 * Footer — one link, deliberately. The parent-site link row (Acces / Projects /
 * Who we are / Guides Team / About Sadjo), the "Image by Jonathan Ramael" photo
 * credit and the © line were all stripped by request. If the hero photograph is
 * ever put back on the page, the credit has to come back with it.
 *
 * It sits outside `main.panels` in normal flow, below the last pinned panel —
 * which is why the snap engine bails when there is no point ahead while heading
 * down, or this would be unreachable.
 */
export interface SiteFooterProps {
	readonly className?: string;
}

export default function SiteFooter({ className }: SiteFooterProps) {
	return (
		<footer className={className}>
			<a href={FOOTER_LINK.href} data-link="">
				{FOOTER_LINK.label}
			</a>
		</footer>
	);
}
