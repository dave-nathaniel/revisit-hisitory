import { CONTACT_EMAIL, GROUP_ENQUIRY } from '../data/siteContent';

export type EnquiryValues = Record<string, string>;

export type EnquiryResult =
	| { readonly ok: true; readonly via: 'endpoint' | 'mailto' }
	| { readonly ok: false; readonly error: string };

/** Field label, not field name, so the email reads as prose rather than as JSON keys. */
function labelled(values: EnquiryValues): ReadonlyArray<readonly [string, string]> {
	return GROUP_ENQUIRY.fields
		.map((f) => [f.label, (values[f.name] ?? '').trim()] as const)
		.filter(([, v]) => v !== '');
}

function subjectFor(values: EnquiryValues): string {
	const org = (values.organisation ?? '').trim();
	return org ? `${GROUP_ENQUIRY.subject} — ${org}` : GROUP_ENQUIRY.subject;
}

/**
 * Opens the visitor's mail client with the enquiry pre-composed.
 *
 * This is the fallback, and it is a weak one: a visitor with no mail client
 * configured sees nothing happen and the enquiry is lost with no trace on our
 * side. It exists so the form is never a dead end while GROUP_ENQUIRY.endpoint
 * is empty — not as the intended delivery path.
 */
function viaMailto(values: EnquiryValues): EnquiryResult {
	const body = labelled(values)
		.map(([label, value]) => `${label}: ${value}`)
		.join('\r\n');
	const href =
		`mailto:${CONTACT_EMAIL}` +
		`?subject=${encodeURIComponent(subjectFor(values))}` +
		`&body=${encodeURIComponent(body)}`;
	window.location.href = href;
	return { ok: true, via: 'mailto' };
}

/**
 * Delivers a group enquiry.
 *
 * One seam, deliberately: the form does not know or care how this is sent. Set
 * GROUP_ENQUIRY.endpoint to a Formspree/Web3Forms URL and every enquiry starts
 * arriving as real email with no other edit. Swap this function's body for a
 * `fetch` at your own serverless route and the same holds.
 *
 * The payload is sent as JSON with `Accept: application/json` — Formspree and
 * Web3Forms both answer with JSON rather than a redirect when asked that way,
 * which is what keeps the visitor on the page.
 */
export default async function submitGroupEnquiry(values: EnquiryValues): Promise<EnquiryResult> {
	const endpoint = GROUP_ENQUIRY.endpoint as string;
	if (!endpoint) return viaMailto(values);

	const payload: Record<string, string> = { _subject: subjectFor(values) };
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
