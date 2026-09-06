import { CONTACT, CONTACT_EMAIL } from '../../data/siteContent';

/**
 * CONTACT — flat white, and the only panel that stands outside the Revisit
 * History umbrella entirely. That is why it carries no breadcrumb eyebrow while
 * every other panel does, and why leaving the `--subject-bg` field here reads as
 * stepping back out of the subject.
 *
 * The address is a standalone link, so it gets colour and hover only — no
 * underline. The inline-link exception applies to links buried mid-sentence.
 */
export interface ContactPanelProps {
	readonly id?: string;
}

export default function ContactPanel({ id = 'contact' }: ContactPanelProps) {
	return (
		<section className="contact" id={id} data-section="contact">
			<h2 data-split="">
				{CONTACT.headLead}
				<a href={`mailto:${CONTACT_EMAIL}`}>
					<span className="mail">{CONTACT_EMAIL}</span>
				</a>
			</h2>
			<div className="contact-meta gsap-fade">
				{CONTACT.meta.map((line, i) => (
					<div key={line}>{i === 0 ? <b>{line}</b> : <span>{line}</span>}</div>
				))}
			</div>
		</section>
	);
}
