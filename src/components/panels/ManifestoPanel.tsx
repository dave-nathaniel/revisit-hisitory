import RhMark from '../RhMark';
import { MANIFESTO } from '../../data/siteContent';

/**
 * WHY — umbrella level (white, outside the subject). The turn of the whole
 * Revisit History idea, set at full display scale: this is the one thing this
 * surface shouts.
 *
 * `.manifesto-support` keeps its `minmax(0, 42ch)` columns and is NOT part of
 * the full-width three-column family: two paragraphs across `--max` would be
 * ~830px columns, ~75 characters even at the top of the size clamp.
 */
export interface ManifestoPanelProps {
	readonly id?: string;
}

export default function ManifestoPanel({ id = 'idea' }: ManifestoPanelProps) {
	return (
		<section className="manifesto" id={id} data-section="idea">
			<div className="manifesto-inner">
				<div className="eyebrow crumb gsap-fade">
					<RhMark /> · {MANIFESTO.crumb}
				</div>
				<h2 data-split="">
					{MANIFESTO.headLead}
					<em>{MANIFESTO.headEm}</em>
				</h2>
				<div className="manifesto-support">
					<p className="gsap-fade">{MANIFESTO.supportFirst}</p>
					<p className="gsap-fade">
						{MANIFESTO.supportSecondLead}
						<RhMark />
						{MANIFESTO.supportSecondMid}
						<em>{MANIFESTO.supportSecondEm}</em>
					</p>
				</div>
			</div>
		</section>
	);
}
