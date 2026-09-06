import { useId, useState } from 'react';
import { CONTACT_EMAIL, GROUP_ENQUIRY } from '../../data/siteContent';
import submitGroupEnquiry, { type EnquiryValues } from '../../lib/groupEnquiry';

type Status =
	| { kind: 'idle' }
	| { kind: 'sending' }
	/** Actually delivered — only reachable when GROUP_ENQUIRY.endpoint is set. */
	| { kind: 'sent' }
	/** Handed to the visitor's mail client. NOT delivered; see below. */
	| { kind: 'handedOff' }
	| { kind: 'failed' };

/**
 * The group / school enquiry.
 *
 * NO CALENDAR, deliberately. Service 2 has zero bookable slots in SimplyBook and
 * a group date is negotiated rather than self-served — "Preferred tour date" is
 * a field here, not a picker, which is exactly how the SimplyBook account was
 * already configured (see app/SIMPLYBOOK_API.md).
 *
 * Nothing here carries `data-split` or `.gsap-fade`. Those are collected by
 * useSiteMotion at mount and this subtree starts inside a `hidden` pane, where a
 * ScrollTrigger would measure a zero-height element and never fire correctly.
 * The form is static markup and stays that way.
 *
 * Local React state is safe here for the same reason it is banned elsewhere in
 * this app: no hook and no imperative selector touches these nodes, so there is
 * nothing to desync from. The pane's visibility is the one thing shared with
 * BookPanel, and that lives there.
 */
export default function GroupEnquiryForm() {
	const uid = useId();
	const [values, setValues] = useState<EnquiryValues>({});
	const [status, setStatus] = useState<Status>({ kind: 'idle' });

	const set = (name: string, value: string) =>
		setValues((prev) => ({ ...prev, [name]: value }));

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (status.kind === 'sending') return;
		setStatus({ kind: 'sending' });
		const result = await submitGroupEnquiry(values);
		if (!result.ok) {
			setStatus({ kind: 'failed' });
			return;
		}
		setStatus(result.via === 'endpoint' ? { kind: 'sent' } : { kind: 'handedOff' });
	}

	/**
	 * ONLY the endpoint path clears the form and claims the enquiry arrived.
	 *
	 * The mailto path has delivered nothing — it opened a mail client that may not
	 * exist. Replacing the form with a thank-you there would tell the visitor
	 * something false AND destroy what they typed, leaving no way to recover it.
	 * So that path keeps the form on screen and says what actually happened.
	 */
	if (status.kind === 'sent') {
		return (
			<div className="enquiry-done" role="status">
				<p>{GROUP_ENQUIRY.success}</p>
			</div>
		);
	}

	return (
		// data-lenis-prevent: Lenis swallows wheel events for the whole page, so
		// without it a wheel inside this scroller moves the page — and snaps away
		// from Book — instead of the form.
		<form className="enquiry" onSubmit={onSubmit} data-lenis-prevent>
			<p className="enquiry-lede">{GROUP_ENQUIRY.lede}</p>

			{status.kind === 'handedOff' && (
				<p className="enquiry-handoff" role="status">
					{GROUP_ENQUIRY.handedOff}
				</p>
			)}

			<div className="enquiry-grid">
				{GROUP_ENQUIRY.fields.map((field) => {
					const id = `${uid}-${field.name}`;
					const value = values[field.name] ?? '';
					return (
						<p
							className={`enquiry-field${field.type === 'textarea' ? ' is-wide' : ''}`}
							key={field.name}
						>
							<label htmlFor={id}>
								{field.label}
								{!field.required && <span className="opt"> (optional)</span>}
							</label>

							{field.type === 'select' ? (
								<select
									id={id}
									name={field.name}
									required={field.required}
									value={value || field.options?.[0] || ''}
									onChange={(e) => set(field.name, e.target.value)}
								>
									{field.options?.map((opt) => (
										<option key={opt} value={opt}>
											{opt}
										</option>
									))}
								</select>
							) : field.type === 'textarea' ? (
								<textarea
									id={id}
									name={field.name}
									rows={3}
									required={field.required}
									value={value}
									onChange={(e) => set(field.name, e.target.value)}
								/>
							) : (
								<input
									id={id}
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
					{status.kind === 'sending' ? GROUP_ENQUIRY.sending : GROUP_ENQUIRY.submit}
				</button>

				{/* The enquiry is never left unrecoverable: a failed POST hands back a
				    mailto rather than a dead end. */}
				{status.kind === 'failed' && (
					<span className="enquiry-error" role="alert">
						{GROUP_ENQUIRY.failure}{' '}
						<a href={`mailto:${CONTACT_EMAIL}`} className="inline-link">
							{CONTACT_EMAIL}
						</a>
					</span>
				)}
			</div>
		</form>
	);
}
