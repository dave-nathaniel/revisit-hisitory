import { CONTACT, CONTACT_EMAIL } from '../data/siteContent';

export type ContactValues = Record<string, string>;

export type ContactResult =
	| { readonly ok: true; readonly via: 'endpoint' | 'mailto' }
	| { readonly ok: false; readonly error: string };

function labelled(values: ContactValues): ReadonlyArray<readonly [string, string]> {
	return CONTACT.fields
		.map((f) => [f.label, (values[f.name] ?? '').trim()] as const)
		.filter(([, v]) => v !== '');
}

/**
 * Opens the visitor's mail client with the message pre-composed. The fallback
 * for when the SMTP endpoint is unreachable — see submitGroupEnquiry, which
 * this mirrors.
 */
function viaMailto(values: ContactValues): ContactResult {
	const body = labelled(values)
		.map(([label, value]) => `${label}: ${value}`)
		.join('\r\n');
	const href =
		`mailto:${CONTACT_EMAIL}` +
		`?subject=${encodeURIComponent(CONTACT.subject)}` +
		`&body=${encodeURIComponent(body)}`;
	window.location.href = href;
	return { ok: true, via: 'mailto' };
}

/**
 * Delivers a contact message to CONTACT.endpoint (our own SMTP-backed route —
 * see server/index.js), falling back to mailto if the request fails.
 */
export default async function submitContact(values: ContactValues): Promise<ContactResult> {
	const endpoint = CONTACT.endpoint as string;
	if (!endpoint) return viaMailto(values);

	const payload: Record<string, string> = { _subject: CONTACT.subject };
	for (const [label, value] of labelled(values)) payload[label] = value;

	try {
		const res = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify(payload),
		});
		if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
		return { ok: true, via: 'endpoint' };
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
	}
}
