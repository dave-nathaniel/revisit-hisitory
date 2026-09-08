// The site's one backend: sends the contact form and group-enquiry form by
// email over SMTP, and (in production) serves the built `dist/` with an SPA
// fallback so a direct visit to /about, /book or /contact — the routes
// NAV_ITEMS now hrefs — loads the app instead of 404ing. See
// src/lib/contact.ts, src/lib/groupEnquiry.ts and the routing note atop
// useSiteMotion.ts for the client half of both features.
//
// Configure via a `.env` file (see .env.example) or real environment
// variables — never commit real credentials. Required: SMTP_HOST, SMTP_PORT,
// SMTP_USER, SMTP_PASS. Optional: SMTP_SECURE ('true' for port 465),
// MAIL_FROM (defaults to SMTP_USER), MAIL_TO (defaults to CONTACT_EMAIL
// below), PORT (defaults to 8787).
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Kept in step with CONTACT_EMAIL in src/data/siteContent.ts by hand — the
// server has no build step that would let it import that file directly.
const CONTACT_EMAIL = 'hello@revisithistory.be';

const PORT = Number(process.env.PORT ?? 8787);
const MAIL_TO = process.env.MAIL_TO || CONTACT_EMAIL;
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER;

const smtpConfigured = Boolean(
	process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
);

const transporter = smtpConfigured
	? nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT ?? 587),
			secure: process.env.SMTP_SECURE === 'true',
			auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
		})
	: null;

if (!transporter) {
	console.warn(
		'[mail] SMTP_HOST / SMTP_USER / SMTP_PASS not set — /api/contact and /api/enquiry will return 503 until they are. See server/.env.example.',
	);
}

const app = express();
app.use(express.json({ limit: '32kb' }));

/**
 * Both forms POST the same shape: `{ _subject, <Field label>: <value>, ... }`
 * — see labelled()/payload in src/lib/contact.ts and src/lib/groupEnquiry.ts.
 * One handler serves both; the only difference is which one filled the body.
 */
async function handleFormPost(req, res) {
	if (!transporter) {
		res.status(503).json({ error: 'Mail is not configured on the server yet.' });
		return;
	}
	const body = req.body;
	if (!body || typeof body !== 'object') {
		res.status(400).json({ error: 'Invalid payload' });
		return;
	}
	const { _subject, ...fields } = body;
	const subject = typeof _subject === 'string' && _subject.trim() ? _subject : 'Website enquiry';
	const entries = Object.entries(fields).filter(([, v]) => typeof v === 'string' && v.trim());
	if (entries.length === 0) {
		res.status(400).json({ error: 'Empty message' });
		return;
	}

	const text = entries.map(([label, value]) => `${label}: ${value}`).join('\n');
	const html = `<table cellpadding="4" cellspacing="0">${entries
		.map(
			([label, value]) =>
				`<tr><td style="color:#666;white-space:nowrap;vertical-align:top"><b>${escapeHtml(label)}</b></td><td>${escapeHtml(value).replace(/\n/g, '<br>')}</td></tr>`,
		)
		.join('')}</table>`;

	// Reply-To the visitor's own address when the form collected one, so a
	// simple "Reply" in the inbox goes straight back to them.
	const emailField = entries.find(([label]) => /email/i.test(label));

	try {
		await transporter.sendMail({
			from: MAIL_FROM,
			to: MAIL_TO,
			replyTo: emailField?.[1],
			subject,
			text,
			html,
		});
		res.json({ ok: true });
	} catch (err) {
		console.error('[mail] send failed:', err);
		res.status(502).json({ error: 'Mail send failed' });
	}
}

function escapeHtml(s) {
	return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

app.post('/api/contact', handleFormPost);
app.post('/api/enquiry', handleFormPost);

// ─── Static site + SPA fallback ───
// Only relevant once `npm run build` has produced `dist/` — in dev, Vite
// serves the app itself and proxies /api to this server (see vite.config.ts).
app.use(express.static(DIST));
app.get('*', (req, res, next) => {
	if (req.path.startsWith('/api/')) return next();
	res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
	console.log(`[server] listening on http://localhost:${PORT}`);
});
