import { useId, useState } from 'react';
import { CONTACT, CONTACT_EMAIL } from '../../data/siteContent';
import submitContact, { type ContactValues } from '../../lib/contact';

type Status =
	| { kind: 'idle' }
	| { kind: 'sending' }
	/** Actually delivered via CONTACT.endpoint. */
	| { kind: 'sent' }
	/** Handed to the visitor's mail client. NOT delivered — see submitContact. */
	| { kind: 'handedOff' }
	| { kind: 'failed' };

/**
 * CONTACT — flat white, and the only panel that stands outside the Revisit
 * History umbrella entirely. That is why it carries no breadcrumb eyebrow while
 * every other panel does, and why leaving the `--subject-bg` field here reads as
 * stepping back out of the subject.
 *
 * Was a plain mailto heading; is now a form that POSTs to our own SMTP-backed
 * endpoint (server/index.js), same pattern as GroupEnquiryForm. The mailto
 * link survives as the failure fallback only, via the .inline-link exception.
 */
export interface ContactPanelProps {
	readonly id?: string;
}

export default function ContactPanel({ id = 'contact' }: ContactPanelProps) {
	const uid = useId();
	const [values, setValues] = useState<ContactValues>({});
	const [status, setStatus] = useState<Status>({ kind: 'idle' });

	const set = (name: string, value: string) =>
		setValues((prev) => ({ ...prev, [name]: value }));

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (status.kind === 'sending') return;
		setStatus({ kind: 'sending' });
		const result = await submitContact(values);
		if (!result.ok) {
			setStatus({ kind: 'failed' });
			return;
		}
		setStatus(result.via === 'endpoint' ? { kind: 'sent' } : { kind: 'handedOff' });
	}

	return (
		<section className="contact" id={id} data-section="contact">
			<div className="contact-inner">
				<h2 className="contact-head" data-split="">
					{CONTACT.headLead}
				</h2>

				{status.kind === 'sent' ? (
					<div className="enquiry-done" role="status">
						<p>{CONTACT.success}</p>
					</div>
				) : (
					<form className="enquiry contact-form" onSubmit={onSubmit}>
						{status.kind === 'handedOff' && (
							<p className="enquiry-handoff" role="status">
								{CONTACT.handedOff}
							</p>
						)}

						<div className="enquiry-grid">
							{CONTACT.fields.map((field) => {
								const fid = `${uid}-${field.name}`;
								const value = values[field.name] ?? '';
								return (
									<p
										className={`enquiry-field${field.type === 'textarea' ? ' is-wide' : ''}`}
										key={field.name}
									>
										<label htmlFor={fid}>{field.label}</label>
										{field.type === 'textarea' ? (
											<textarea
												id={fid}
												name={field.name}
												rows={3}
												required={field.required}
												value={value}
												onChange={(e) => set(field.name, e.target.value)}
											/>
										) : (
											<input
												id={fid}
												name={field.name}
												type={field.type}
												required={field.required}
												autoComplete={field.autoComplete}
												value={value}
												onChange={(e) => set(field.name, e.target.value)}
											/>
										)}
									</p>
								);
							})}
						</div>

						<div className="enquiry-foot">
							<button type="submit" className="enquiry-send" disabled={status.kind === 'sending'}>
								{status.kind === 'sending' ? CONTACT.sending : CONTACT.submit}
							</button>

							{status.kind === 'failed' && (
								<span className="enquiry-error" role="alert">
									{CONTACT.failure}{' '}
									<a href={`mailto:${CONTACT_EMAIL}`} className="inline-link">
										{CONTACT_EMAIL}
									</a>
								</span>
							)}
						</div>
					</form>
				)}
			</div>
		</section>
	);
}
