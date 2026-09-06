/**
 * All static copy, hrefs and config for the site, lifted verbatim out of the
 * original single-file index.html. Curly quotes, em/en dashes and non-breaking
 * spaces (U+00A0) are significant: splitWords() in useSiteMotion tokenizes text
 * nodes on /\s+/ (which matches U+00A0), so changing one changes the word count,
 * the reveal stagger and the .word mask boxes. Keep them byte-exact.
 */

export interface NavItem {
	readonly href: string;
	readonly label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
	{ href: '#about', label: 'About' },
	{ href: '#book', label: 'Book' },
	{ href: '#contact', label: 'Contact' },
];

export const LANGUAGES: readonly string[] = ['EN', 'NL'];

export const CONTACT_EMAIL = 'hello@revisithistory.be';

export const HERO = {
	srHeading: 'Revisit History — Acces, Antwerp',
	curtainTop: 'REVISIT',
	curtainBottom: 'HISTORY',
} as const;

export const INTRO = {
	crumb: 'About',
	/** Lede tail — the sentence continues after the two-tone wordmark. */
	bodyTail: ' is a reflective concept that looks at the past to better understand the present.',
	supportFirst:
		'History is not only something that happened before us. It continues to shape the places we live in, the structures around us and the way we understand the world today. At the same time, history is something we continue to make every day.',
	/** Second support paragraph opens with the wordmark, so only its tail is copy. */
	supportSecondTail:
		' creates ways of engaging with this connection between past and present through different public and participatory formats.',
	supportThird:
		'Our approach does not rely solely on traditional historical narratives. Instead, we combine knowledge-sharing with observation, reflection and dialogue.',
} as const;

export const MANIFESTO = {
	crumb: 'Why',
	headLead: 'Revisiting history does not mean changing or rewriting it. It means ',
	headEm: 'looking back and looking again.',
	supportFirst:
		'By returning to the past, we can identify stories and perspectives that may have received less attention, recognise gaps in how history has been told, and look at what we already know from different perspectives.',
	supportSecondLead: 'At the heart of ',
	supportSecondMid:
		' is a simple idea: looking differently at the past can help us better understand our present. Currently, we apply this approach to Belgium’s colonial history through ',
	supportSecondEm: 'A Colonial Present.',
} as const;

export const SUBJECT = {
	crumb: 'The Subject',
	titleLead: 'A Colonial ',
	/** "Present", not "Presence" — a deliberate double entendre. Never "correct" it. */
	titleEm: 'Present',
	lede: 'Belgium’s colonial history is part of Belgian history. It does not define Belgium as a whole, nor does it define its history as a whole. But it is an important chapter within that history, and deserves the same space for knowledge, understanding and reflection as any other part of our shared history.',
	/** Method paragraph one carries an italic pivot mid-sentence, so it is split around it. */
	methodOneLead:
		'A Colonial Present explores this history through its connections to the world and society we live in today. History is, in many ways, ',
	methodOneEm: 'inherited.',
	methodOneTail:
		' We do not choose what came before us, but we do inherit its stories, structures, places and consequences. We can, however, choose how we engage with them.',
	methodTwo:
		'Belgium’s colonial past is therefore not approached as a history that exists somewhere far away, or as something that simply ended at a particular moment in time. Traces of it can still be found around us — sometimes visibly, sometimes less obviously.',
} as const;

/**
 * THE HORIZONTAL RAIL inside the subject panel. Antwerp opens it — it is the
 * subject's starting point, and it used to be a panel of its own — and the
 * image/text panels after it carry the rest.
 *
 * `kind` picks the layout, not the styling: every panel sits on the same flat
 * `--subject-bg` as the cover beside it, because the whole "A Colonial Present"
 * run is one uninterrupted colour field. There is no card, edge or mat around a
 * track panel and none may be added — what separates them is that they MOVE.
 *
 * THE ARRAY LENGTH IS LOAD-BEARING. The component derives both the section's
 * height (`--track-steps`) and its snap points (`data-snap-steps`) from
 * `panels.length - 1`, and the horizontal tween moves the rail by exactly that
 * many panel widths. Add a panel and all three follow automatically; hard-code
 * any one of them and the rail drifts out of step with where the page settles.
 *
 * `ord` is roman to match `.card .ord` in Formats — the same archival numbering,
 * in `--stamp-deep` because `--stamp` only reads 3.79:1 on the subject ground.
 */
export interface TrackPanelData {
	readonly ord: string;
	/**
	 * `method` carries no copy of its own: it renders SUBJECT's two method
	 * paragraphs, italic pivot and all. They used to sit in the cover on the left,
	 * and moved onto the rail when the cover was narrowed (2026-09-03, at the site
	 * owner's request: "make the left side narrower, less text"). The copy is the
	 * client's and is kept rather than cut — the rail is simply where it fits now.
	 */
	readonly kind: 'statement' | 'text' | 'image' | 'method';
	/** statement: display heading, split around its italic pivot. */
	readonly headLead?: string;
	readonly headEm?: string;
	/** statement: the short line that turns the section, held apart by scale. */
	readonly turn?: string;
	/** text: stacked paragraphs. */
	readonly paras?: readonly string[];
	/** image: full-bleed, plus the credit the photograph is owed. */
	readonly src?: string;
	readonly alt?: string;
	readonly caption?: string;
	readonly credit?: string;
}

export const SUBJECT_TRACK = {
	crumb: 'A Colonial Present · Antwerp',
	/** Shown once, on the first panel only — the rail reads left-to-right. */
	hint: 'Scroll',
	panels: [
		{
			ord: 'I',
			kind: 'statement',
			headLead: 'Antwerp as a ',
			headEm: 'starting point.',
			turn: 'The city therefore becomes part of the learning experience.',
		},
		{
			ord: 'II',
			kind: 'text',
			paras: [
				'Antwerp offers a particularly meaningful setting. The city played an important role in Belgium’s colonial history: its economic development, institutions, infrastructure and urban landscape contain numerous connections to that past.',
				'Many of those traces are still present today, even when we pass them without recognising their historical significance. What may appear to be an ordinary part of the city can reveal another layer of Belgian history once we understand what we are looking at.',
				'By moving through Antwerp, we use buildings, streets, monuments and other traces in the urban landscape as starting points for exploring larger historical developments and structures.',
			],
		},
		{
			ord: 'III',
			kind: 'image',
			/* The one photograph the project ships. It was previously referenced only
			   by a commented-out `.hero-bg` background, which is why the "Image by
			   Jonathan Ramael" credit could be dropped from the footer in 2026-08-16
			   without leaving an uncredited image on the page. Putting the photograph
			   back puts the credit back with it — that obligation travels with the
			   file, so `credit` is not optional decoration here. */
			src: '/3067e280-8af9-4025-b8d5-8890bff622b6.jpg',
			/* alt and caption describe what the file ACTUALLY is — a pale archival
			   collage, not a street photograph. They were both written from a
			   description of the image before anyone had looked at it, and were wrong.
			   The caption is editorial copy and is the client's to write; this one is
			   accurate but provisional. */
			alt: 'An archival collage: maps of central Africa layered with colonial-era postmarks, photographs, a palm tree and animals.',
			caption: 'Maps, postmarks and paperwork of a colonial administration, layered into one image.',
			credit: 'Image by Jonathan Ramael',
		},
		{
			ord: 'IV',
			kind: 'method',
		},
	] as readonly TrackPanelData[],
} as const;

/**
 * One row of a format's spec list.
 *
 * These VALUES are the same four the panel always showed; only the `k` labels
 * are new (2026-09-03). They used to be a flat row of tracked chips —
 * `2 HOURS  BIKE  PUBLIC  NL` — which reads as noise and, worse, gives you no
 * way to compare two formats that vary along exactly these axes. Keyed rows in a
 * fixed order make the comparison legible: rows 1-3 are the same question asked
 * of both formats, and row 4 is precisely where the two differ (one is a public
 * tour with a language, the other is arranged on request).
 *
 * Keep the order and the count identical between the two formats or the rows
 * stop lining up across the fields, which is the whole point of them.
 */
export interface FormatSpec {
	readonly k: string;
	readonly v: string;
}

export interface FormatCard {
	readonly ord: string;
	readonly titleLead: string;
	readonly titleEm: string;
	readonly specs: readonly FormatSpec[];
	readonly body: string;
	readonly ctaLabel: string;
	readonly ctaHref: string;
	/** True for in-page hash links, which the motion hook intercepts via [data-link]. */
	readonly ctaInPage: boolean;
}

export const FORMATS = {
	crumb: 'A Colonial Present · Public Formats',
	headLead: 'More than moving from one ',
	headEm: 'historical fact',
	headTail: ' to another.',
	lede: 'A Colonial Present is offered through tours for individual participants, private groups and organisations, as well as educational formats developed for schools.',
	cards: [
		{
			ord: 'I',
			titleLead: 'Congo – Antwerp ',
			titleEm: '(bicycle)',
			specs: [
				{ k: 'Duration', v: '2 hours' },
				{ k: 'On', v: 'Bicycle' },
				{ k: 'For', v: 'Individuals' },
				{ k: 'Language', v: 'Dutch' },
			],
			body: 'A 2-hour bicycle tour exploring visible and invisible traces of colonial infrastructure in the city. Focused on observation, layered storytelling, and spatial awareness.',
			ctaLabel: 'Book this tour',
			ctaHref: '#book',
			ctaInPage: true,
		},
		{
			ord: 'II',
			titleLead: 'A Dialogue in ',
			titleEm: 'Motion',
			specs: [
				{ k: 'Duration', v: '2 hours' },
				{ k: 'On', v: 'Foot' },
				{ k: 'For', v: 'Groups · teams' },
				{ k: 'Booking', v: 'By request' },
			],
			body: 'A 2-hour reflective walk for teams and institutions. This format fosters shared awareness and positions dialogue as a tool for collective meaning-making — tailored to stimulate internal reflection and group connection within a thematic urban setting.',
			/* Repointed to the Book panel's Groups & schools form (2026-09-01). This is
			   the same audience the form serves, and a raw mailto asks the visitor to
			   compose the enquiry themselves — the form asks the six questions we
			   actually need answered. */
			ctaLabel: 'Enquire about this format',
			ctaHref: '#book',
			ctaInPage: true,
		},
	] as readonly FormatCard[],
} as const;

export interface BookNote {
	readonly n: string;
	/** null on the note that ends in an inline mailto — composed in the component. */
	readonly text: string | null;
}

export const BOOK = {
	crumb: 'A Colonial Present · Booking',
	headLead: 'Reserve your ',
	headEm: 'place.',
	notes: [
		{ n: 'i', text: 'Group size is limited to 15 participants per guide.' },
		{ n: 'ii', text: 'Booking confirmation and practical details will be sent by email.' },
		{ n: 'iii', text: 'Tours are given in Dutch.' },
		{ n: 'iv', text: null },
	] as readonly BookNote[],
	/* Note iv used to send organisations and schools to email. That is now the
	   Groups & schools tab beside these notes, so pointing at a mailto here would
	   offer two doors to the same room. Reworded to the general question — which
	   keeps the site's one inline mailto, and with it the deliberate .inline-link
	   exception to the no-borders rule. */
	noteFourLead: 'Questions before you book? Write to ',
	noteFourTail: '.',
} as const;

/**
 * The two paths inside the Book panel.
 *
 * Individual Tour is self-service: it keeps the SimplyBook widget exactly as it
 * was. Group Tour is not bookable at all — `getStartTimeMatrix` returns zero
 * slots for service 2 every day of the month — so it becomes an enquiry that is
 * answered by a person.
 *
 * The field list is NOT invented. It is the six additional fields already
 * configured on service 2 in the SimplyBook account (titles, types, required
 * flags and the select values are copied from `getAdditionalFields("2")` — see
 * app/SIMPLYBOOK_API.md). Keep them in step: if the enquiry is ever routed
 * through the API's `book()` instead of email, these map one-to-one onto it by
 * the field hashes recorded in that file.
 */
export interface EnquiryField {
	readonly name: string;
	readonly label: string;
	readonly type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea';
	readonly required: boolean;
	readonly options?: readonly string[];
	readonly autoComplete?: string;
}

export const GROUP_ENQUIRY = {
	tabIndividual: 'Individual',
	tabGroup: 'Groups & schools',
	/** Sits above the form in place of a calendar, so the absence of one reads as intent. */
	lede: 'Group and school tours are arranged by hand — tell us what you need and we answer by email within two working days.',
	fields: [
		{ name: 'organisation', label: 'Name of organisation', type: 'text', required: true, autoComplete: 'organization' },
		{ name: 'tourType', label: 'Tour type', type: 'select', required: true, options: ['Group', 'School/Institution'] },
		{ name: 'preferredDate', label: 'Preferred tour date', type: 'date', required: true },
		{ name: 'contactName', label: 'Contact name', type: 'text', required: true, autoComplete: 'name' },
		{ name: 'contactEmail', label: 'Contact email', type: 'email', required: true, autoComplete: 'email' },
		{ name: 'extra', label: 'Extra information', type: 'textarea', required: false },
	] as readonly EnquiryField[],
	submit: 'Send enquiry',
	sending: 'Sending…',
	success: 'Thank you — your enquiry is with us. We answer by email within two working days.',
	/* The mailto fallback has NOT delivered anything: it handed the enquiry to the
	   visitor's mail app, which may not exist. Saying "thank you, it's with us"
	   there would be a straight lie, and clearing the form would destroy what they
	   typed. Different copy, and the form stays on screen. */
	handedOff:
		'Your mail app should have opened with this enquiry ready — press Send there to finish. Nothing has reached us until you do.',
	/** Shown when the POST fails; the mailto keeps the enquiry recoverable. */
	failure: 'That did not send. Please write to us directly:',
	/**
	 * Where the enquiry goes.
	 *
	 * Empty string = no endpoint configured yet, and the form falls back to
	 * opening a pre-filled mail client. That fallback is a floor, not a plan:
	 * it silently loses anyone without a mail client set up. Paste a Formspree
	 * (`https://formspree.io/f/<id>`) or Web3Forms endpoint here and the form
	 * POSTs instead — no other change needed, and nothing secret ships, since
	 * these endpoints are designed to be public.
	 */
	endpoint: '',
	subject: 'Group tour enquiry',
} as const;

export const CONTACT = {
	headLead: 'Talk with us — write ',
	meta: ['Acces vzw', 'Antwerpen, België', 'Mon — Fri', 'By appointment'],
} as const;

export const FOOTER_LINK = { href: '#top', label: 'Back to top ↑' } as const;

export const COOKIE = {
	message: 'This website uses cookies. ',
	accept: 'OK',
} as const;

export const SIMPLYBOOK_SCRIPT_SRC = '//widget.simplybook.it/v2/widget/widget.js';

/**
 * SimplyBook widget config, value-identical to the object in the original markup.
 * The widget's insides are cross-origin, so theme_settings is the only stylesheet
 * reachable for them — see the note in CLAUDE.md. Do not "tidy" these values.
 */
export const SIMPLYBOOK_CONFIG = {
	widget_type: 'iframe',
	url: 'https://revisithistory.simplybook.it',
	theme: 'skittish',
	theme_settings: {
		timeline_hide_unavailable: '1',
		hide_past_days: '0',
		timeline_show_end_time: '0',
		timeline_modern_display: 'as_slots',
		sb_base_color: '#e96a1f',
		display_item_mode: 'block',
		body_bg_color: '#fffaf5',
		sb_review_image: '',
		dark_font_color: '#474747',
		light_font_color: '#ffffff',
		btn_color_1: '#3f5666',
		sb_company_label_color: '#372515',
		hide_img_mode: '1',
		sb_busy: '#c7b3b3',
		sb_available: '#d6ebff',
	},
	timeline: 'modern',
	datepicker: 'top_calendar',
	is_rtl: false,
	app_config: {
		clear_session: 1,
		allow_switch_to_ada: 0,
		/* service '3' = Individual Tour. Locking it here is what makes the two-path
		   Book panel honest: without it the widget still lists Group Tour, whose
		   getStartTimeMatrix is empty every day of the year, so a visitor could
		   pick it and reach a calendar with nothing in it. With it the widget
		   skips its Service step and opens straight on Individual Tour's dates.
		   Verified against the live widget — `service` is the key it honours;
		   `event` and `service_id` are ignored. */
		predefined: { provider: '2', category: '2', service: '3' },
	},
} as const;
