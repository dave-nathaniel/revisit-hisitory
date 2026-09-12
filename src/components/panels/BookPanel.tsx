import { useRef, useState } from 'react';
import useSimplybookWidget from '../../hooks/useSimplybookWidget';
import { BOOK, GROUP_ENQUIRY } from '../../data/siteContent';
import GroupEnquiryForm from './GroupEnquiryForm';

/**
 * BOOKING — the last panel inside the A Colonial Present colour field.
 *
 * The widget is sized BY the panel, never by itself: `.book-embed` is
 * `height: 100%` and takes the whole 1fr column, so the form fills the pinned
 * panel edge to edge. It used to be a 4/5 box capped at 53vh, which left ~800px
 * of empty subject field beside it and squeezed the widget into its narrow
 * one-column fallback. Two consequences ride along:
 *   - `height: 100%` has two fallbacks (the max-width:1100px branch and the
 *     reduced-motion branch) and they must move together — the moment `.book`
 *     is `height: auto`, `height: 100%` resolves to auto and a frame whose only
 *     child is absolutely positioned collapses to 0. Never use `aspect-ratio`
 *     for that: stacked, the frame is the full column width and 4/5 of 1366px
 *     is a 1708px tower.
 *   - `.book` unpins at 1101px, not the 820px the other panels use, because the
 *     notes and the widget stack into one column there and no 100vh pin holds
 *     them. That makes Book auto-height below 1101px, which shifts every offset
 *     after it in the snap table.
 *
 * The one inline mailto on the site lives in note iv, and it is the deliberate
 * exception to the no-borders rule: a link buried mid-sentence needs a
 * non-colour cue, so `.inline-link` carries a faint ink text-decoration-color.
 *
 * TWO PATHS (added 2026-09-01). Individual Tour is self-service and keeps the
 * widget untouched; Groups & schools is an enquiry form, because SimplyBook
 * returns zero bookable slots for that service and its date is negotiated by a
 * person. Three things hold this together:
 *
 *   1. BOTH PANES STAY MOUNTED and toggle with the `hidden` attribute. The
 *      widget must never unmount: useSimplybookWidget guards on a ref so it
 *      would not rebuild, and SimplyBook's own loader warns when widget.js is
 *      evaluated twice. Conditional rendering here would also break the app's
 *      standing rule that nothing renders conditionally.
 *   2. INDIVIDUAL IS THE DEFAULT TAB so the widget is visible at mount. An
 *      iframe built inside a `display:none` parent lays out at zero height and
 *      does not recover on its own.
 *   3. THE PANE SCROLLS ITSELF (`.book-pane` is `overflow-y:auto`, and the grid
 *      rows are `auto 1fr` with `min-height:0`). Book is a pinned 100vh panel
 *      with `overflow:hidden`, so at a 618px viewport six fields plus a submit
 *      simply do not fit and would be clipped away invisibly — the same failure
 *      the widget already has at that height.
 */
export interface BookPanelProps {
	readonly id?: string;
}

export default function BookPanel({ id = 'book' }: BookPanelProps) {
	const embedRef = useRef<HTMLDivElement>(null);
	useSimplybookWidget(embedRef);
	const [path, setPath] = useState<'individual' | 'group'>('individual');

	return (
		<section className="book" id={id} data-section="book">
			<div className="subject-wrap">
				<div className="book-head">
					{/* <div className="eyebrow crumb gsap-fade">{BOOK.crumb}</div> */}
					<h2 data-split="">
						{BOOK.headLead}
						<em>{BOOK.headEm}</em>
					</h2>
					<ul className="notes" aria-label="Important notes">
						{BOOK.notes.map((note, i) => (
							<li className="gsap-fade" key={i}>
								{/* {note.text ?? (
									<>
										{BOOK.noteFourLead}
										<a href={`mailto:${CONTACT_EMAIL}`} className="inline-link">
											{CONTACT_EMAIL}
										</a>
										{BOOK.noteFourTail}
									</>
								)} */}
								{note.text}
							</li>
						))}
					</ul>
				</div>

				{/* The widget is cross-origin, so its colours can only be set through the
				    theme_settings object in siteContent — that is the stylesheet for
				    everything inside the frame, and it is tuned to the site's tokens
				    rather than left on SimplyBook's defaults. The scripts that build it
				    are injected by useSimplybookWidget: <script> written as JSX never
				    executes. */}
				<div className="book-paths gsap-fade">
					{/* A tab pair, not a nav: both panes are already in the document and
					    switching never leaves the panel. */}
					{/* Two toggle buttons, NOT ARIA tabs. role="tablist"/"tab" promises
					    arrow-key navigation and a roving tabindex; declaring the roles
					    without implementing them tells a screen-reader user these behave
					    like tabs and then breaks that promise, which is worse than no
					    roles at all. aria-pressed is also the idiom useSiteMotion already
					    uses for the language toggle. */}
					<div className="book-switch" role="group" aria-label="Booking type">
						<button
							type="button"
							aria-pressed={path === 'individual'}
							aria-controls={`${id}-pane-individual`}
							className={path === 'individual' ? 'is-on' : undefined}
							onClick={() => setPath('individual')}
						>
							{GROUP_ENQUIRY.tabIndividual}
						</button>
						<button
							type="button"
							aria-pressed={path === 'group'}
							aria-controls={`${id}-pane-group`}
							className={path === 'group' ? 'is-on' : undefined}
							onClick={() => setPath('group')}
						>
							{GROUP_ENQUIRY.tabGroup}
						</button>
					</div>

					{/* Mounted always, hidden when not selected — see note 1 above. */}
					<div
						className="book-pane"
						id={`${id}-pane-individual`}
						hidden={path !== 'individual'}
					>
						<div className="book-embed" ref={embedRef} />
					</div>

					<div
						className="book-pane"
						id={`${id}-pane-group`}
						hidden={path !== 'group'}
					>
						<GroupEnquiryForm />
					</div>
				</div>
			</div>
		</section>
	);
}
