import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Lenis is still a CDN <script> at a pinned version and is read off the global
// scope. GSAP moved to npm (pinned to the same 3.12.5 the CDN tag served) so
// useGSAP can manage its context; Lenis has no React integration to gain from
// the same treatment, and moving it would be churn for no benefit.
declare const Lenis: new (opts: Record<string, unknown>) => LenisLike;

interface LenisLike {
	/**
	 * Lenis drops wheel and touch input while this is set, and sets it itself for
	 * the duration of a `scrollTo({ lock: true })`. It is a real accessor on the
	 * instance (get/set), not an internal — see `releaseSnap` for why we clear it
	 * by hand rather than trusting the animation to finish.
	 */
	isLocked: boolean;
	/**
	 * Clears `isLocked`, drops any in-flight scrollTo tween, and resyncs Lenis's
	 * animated/target scroll to where the window ACTUALLY is. Public API.
	 */
	reset(): void;
	raf(time: number): void;
	on(event: 'scroll', handler: (...args: unknown[]) => void): void;
	off(event: 'scroll', handler: (...args: unknown[]) => void): void;
	scrollTo(target: number | Element, opts?: Record<string, unknown>): void;
	destroy(): void;
}

declare global {
	interface Window {
		Lenis?: new (opts: Record<string, unknown>) => LenisLike;
		/**
		 * Exposed on purpose. The CDN build of ScrollTrigger set this, and
		 * parity_test.py reads `ScrollTrigger.getAll().length` through it to detect
		 * a regression in how many triggers the page registers. Now that GSAP is
		 * bundled it would otherwise be invisible from outside — to the harness and
		 * to devtools alike.
		 */
		ScrollTrigger?: typeof ScrollTrigger;
	}
}

window.ScrollTrigger = ScrollTrigger;

/**
 * How much travel off a snap point still counts as a nudge rather than a move to
 * the next panel, as a fraction of the viewport.
 *
 * RAISED 0.25 → 0.4 (2026-09-12, at the site owner's request: snapping should
 * "take a deliberate action"). At 0.25 a single trackpad flick — roughly a fifth
 * of a screen — already committed, so panels changed under the reader's hand. At
 * 0.4 you have to push most of the way to the next panel before it takes; short
 * of that you are pulled back onto the one you are on. This is also the rung
 * spacing on the two horizontal rails (their stops are one viewport apart), so it
 * governs advancing the rail by one panel as well as changing section.
 */
const COMMIT_VH = 0.4;

/**
 * The hero's free zone, and NO LONGER the same number as COMMIT_VH — the two were
 * one constant until the commit threshold was raised, and raising this with it
 * would have widened the window where you can park mid-curtain (the curtain scrub
 * runs over the first 0.85vh). "You may rest at the very top" and "you have not
 * travelled far enough to commit" stopped being the same idea at that point.
 */
const HERO_FREE_VH = 0.25;

/**
 * Deliberately shorter and harder-landing than the 620ms it replaces: a firm snap
 * reads as firm mostly in how it ARRIVES. Paired with `lock: true` on the
 * scrollTo below, which is the other half — see the note there.
 */
const SNAP_MS = 540;

/** Out-quart. Steeper approach and a flatter landing than the cubic Lenis runs
 *  for ordinary scrolling, so the panel arrives and stops rather than drifting in. */
const snapEase = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * THE TWO WIDTHS WHERE A HORIZONTAL RAIL IS PINNED AND SCRUBBING, and the one
 * band between them where it is not. There are three bands as of 2026-09-12:
 *
 *   ≥1101px        cover | rail      the original desktop layout
 *   821px–1100px   cover over rail   a plain vertical stack, no pin, no tween
 *   ≤820px         cover / rail →    the desktop mechanism, rotated (phones)
 *
 * A comma in a media query is OR, so RAIL_PINNED matches the outer two bands and
 * RAIL_STACKED matches only the middle one — together they are exhaustive and
 * cannot both match. These two strings and the 820/1101 in the stylesheet's
 * phone block are ONE set of numbers; change them together or a rail will be
 * stacked in CSS while the hook is scrubbing it, or vice versa.
 */
const RAIL_PINNED = '(min-width: 1101px), (max-width: 820px)';
const RAIL_STACKED = '(min-width: 821px) and (max-width: 1100px)';

/**
 * The whole motion layer of the site: smooth scroll, panel snapping, the curtain
 * reveal, the text reveals, and the small pieces of UI state.
 *
 * IT IS THE SOLE OWNER OF EVERY TOGGLED CLASS AND ATTRIBUTE — `.hidden` on the
 * cookie banner, `.open` on the menu overlay, `aria-pressed` on the language
 * buttons, `.compact` on the top bar, `.is-active` on nav links, `.is-incoming`
 * on panels. Every one of those is a tempting React-state refactor and every one
 * of them would desync: the in-page nav handler below reaches for `#menuOverlay`
 * by id and strips `.open`. Components render static markup with the right ids
 * and initial classes; this hook does the rest. All-imperative is correct here.
 * Mixed is broken.
 *
 * useGSAP runs it inside a gsap.context() and reverts that context on unmount,
 * so every tween and ScrollTrigger is killed and every inline style GSAP set is
 * undone. The context does NOT know about Lenis, the window listeners, the
 * timers or the snap table — those are torn down explicitly in the returned
 * cleanup. It is deliberately NOT scoped: this is one document-wide setup that
 * reaches `.bar`, `.lang` and `#cookies` outside `main.panels`, and the only
 * root that would contain all of them is a wrapper element that does not exist
 * (adding one would change the containing-block chain the sticky panels rely on).
 */
export default function useSiteMotion(): void {
	useGSAP(() => {
		// ─── Split text into word-spans (for "data-split" elements) ───
		// Wraps each word in <span class="word"><span class="w-inner">word</span></span>
		// so we can animate transform/opacity per word without a paid SplitText plugin.
		// NOT undone by the context revert — it is a DOM rewrite, not a tween — but it
		// is idempotent, guarded by the data-split-done flag.
		const splitWords = (el: HTMLElement) => {
			if (el.dataset.splitDone) return;
			// Tokenize by spaces, but preserve <br>, <span>, <em>, <a>… as opaque units.
			// Simple strategy: walk text nodes only.
			const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
			const textNodes: Node[] = [];
			while (walker.nextNode()) textNodes.push(walker.currentNode);
			textNodes.forEach((node) => {
				const parts = (node.nodeValue ?? '').split(/(\s+)/);
				const frag = document.createDocumentFragment();
				parts.forEach((part) => {
					if (!part) return;
					if (/^\s+$/.test(part)) {
						frag.appendChild(document.createTextNode(part));
					} else {
						const word = document.createElement('span');
						word.className = 'word';
						const inner = document.createElement('span');
						inner.className = 'w-inner';
						inner.textContent = part;
						word.appendChild(inner);
						frag.appendChild(word);
					}
				});
				node.parentNode?.replaceChild(frag, node);
			});
			el.dataset.splitDone = '1';
		};

		document.querySelectorAll<HTMLElement>('[data-split], [data-scrollread]').forEach(splitWords);

		// ─── Lenis smooth scroll ───
		// Deliberately NOT gated on prefers-reduced-motion (changed 2026-09-01).
		// It used to be, and the consequence was not "less motion" but "no scroll
		// design at all": snapOn() requires a Lenis instance, so with reduced motion
		// the snap engine was inert at every viewport width and the sections never
		// settled. One code path now serves everyone, which also means the one path
		// this site actually ships is the one the test harness covers.
		// The reduced-motion concession lives in the stylesheet instead, where it
		// belongs: the word reveals and fade-ups are forced to their finished state
		// and never animate.
		let lenis: LenisLike | null = null;
		if (window.Lenis) {
			lenis = new Lenis({
				duration: 0.9,
				easing: (t: number) => 1 - Math.pow(1 - t, 3),
				smoothWheel: true,
				wheelMultiplier: 1,
				touchMultiplier: 1.4,
			});
		}

		// ─── PANEL SNAP ───
		// Every section is a sticky 100vh panel, so the scroll positions where exactly
		// one panel sits settled under the viewport are the sections' STATIC document
		// offsets. Those cannot be read from getBoundingClientRect() or offsetTop once a
		// panel is stuck — both report the shifted position, so the table would change
		// depending on where the reader already is. It is built instead by walking
		// offsetHeight (unaffected by sticky) down from the top of <main>.
		//
		// Panels taller than the viewport hold a scrubbed animation, and the span while
		// they are pinned is a FREE ZONE. Such a panel gets a second snap point at the
		// END of its zone: the animation has played, the next panel is at the bottom
		// edge, and that is a legitimate place to come to rest.
		//
		// THE HERO IS THE EXCEPTION AND ITS RULE CHANGED (2026-09-01).
		// It still has NO snap point of its own — you are never yanked backwards into
		// the curtain, and scrolling up out of About still free-falls into it. But its
		// free zone used to run the full 0.95vh of the curtain scrub, which meant
		// stopping anywhere in the first viewport left you parked mid-reveal with the
		// curtain half open: 9 of the 12 resting positions that landed between panels
		// were in here. The zone is now one HERO_FREE_VH — stop within a nudge of the top
		// and you stay at the top; stop past that and you carry on to About. The
		// curtain still scrubs freely while you are actually moving, because a settle
		// only fires 140ms after scrolling stops.
		let snapPts: number[] = []; // document offsets a settle can land on
		let snapFree: [number, number][] = []; // [from, to] spans where scrubbed motion plays
		let snapIds: Record<string, number> = {}; // section id → its static offset (shared with nav)
		let snapping = false; // true while we are driving the scroll ourselves
		let snapTimer = 0;
		let snapSafety = 0;
		let snapResize = 0;
		let snapLastY = window.scrollY;
		let snapDir = 1;
		/**
		 * The rung the reader last came to rest on, and the thing a settle is allowed
		 * to move exactly one step from — see the long note in settle(). null means
		 * "no rung established yet" (first load, or a rebuild), and the clamp simply
		 * does not apply until the first settle records one.
		 */
		let snapAnchor: number | null = null;

		// Snapping is on wherever the rails are pinned — desktop AND phones — and off
		// in the tablet band between them, where the rails unroll into a plain
		// vertical stack and snapping auto-height sections is wrong. Same one query
		// the rail tweens use, so the two can never disagree about a width.
		const snapOn = () => !!lenis && matchMedia(RAIL_PINNED).matches;

		/**
		 * How tall ONE pinned screen of a section is — which is not always
		 * `window.innerHeight`. On a phone the stage is sized in `svh` (the small
		 * viewport, URL bar showing) so its bottom is never cut off, while
		 * innerHeight follows the bar up and down; taking innerHeight there would put
		 * every rung of the ladder a few dozen pixels off and leave the rail resting
		 * between panels. The stage is the thing that is actually pinned, so measure
		 * it. On desktop it is exactly 100vh and this returns innerHeight anyway.
		 */
		const pinnedHeightOf = (sec: HTMLElement) =>
			(sec.firstElementChild as HTMLElement | null)?.offsetHeight || window.innerHeight;

		const buildSnapTable = () => {
			snapPts = [];
			snapFree = [];
			snapIds = {};
			const main = document.querySelector<HTMLElement>('main.panels');
			if (!main) return;
			const secs = Array.from(main.children).filter(
				(el): el is HTMLElement => el.tagName === 'SECTION',
			);
			const vh = window.innerHeight;
			let top = main.offsetTop;
			secs.forEach((sec, i) => {
				const start = Math.round(top);
				// A railed section's overshoot is measured against its PINNED STAGE, not
				// the window — see pinnedHeightOf. Everything else is a plain 100vh panel
				// and the two numbers are the same.
				const railed = Number(sec.dataset.snapSteps ?? 0) > 0;
				const over = Math.round(sec.offsetHeight - (railed ? pinnedHeightOf(sec) : vh));
				// A section that declares `data-snap-steps` divides its own overshoot into
				// that many equal stops instead of asking for a free zone. The subject
				// track is the one that does: its extra height is N viewports of scroll
				// that advance a horizontal rail one panel at a time, and each of those
				// panels is a place the reader should come to rest — the same "settle on
				// one panel" rule the vertical stack follows, applied sideways. A free
				// zone would be exactly wrong here: it would let the rail stop halfway
				// between two panels.
				// Only while the rail is actually horizontal. Below the breakpoint the
				// track unpins and its panels stack, so its extra height is stacked copy
				// rather than scroll room for a rail — dividing it into stops would invent
				// places to settle that correspond to nothing. (Snapping is off entirely at
				// those widths, so this keeps the TABLE honest rather than fixing a bug.)
				const steps = snapOn() ? Number(sec.dataset.snapSteps ?? 0) : 0;
				if (sec.id) snapIds[sec.id] = start;
				if (i === 0) {
					snapFree.push([0, Math.round(vh * HERO_FREE_VH)]);
				} else {
					snapPts.push(start);
					if (steps > 0 && over > 4) {
						for (let k = 1; k <= steps; k++) {
							snapPts.push(start + Math.round((over * k) / steps));
						}
					} else if (over > 4) {
						snapFree.push([start + 2, start + over]);
						snapPts.push(start + over);
					}
				}
				top += sec.offsetHeight;
			});
			snapPts.sort((a, b) => a - b);
		};

		/**
		 * A section's STATIC document offset — where its panel begins, as opposed to
		 * where the sticky rule has parked it. Same walk buildSnapTable does, and for
		 * the same reason: `getBoundingClientRect()` and `offsetTop` both report the
		 * shifted position once a panel is pinned, so a ScrollTrigger that measured a
		 * mid-page sticky section through them would place its start wherever the
		 * reader happened to be when the last refresh ran. The hero gets away with
		 * `start: 'top top'` only because its offset is 0.
		 */
		const staticTopOf = (target: HTMLElement) => {
			const main = document.querySelector<HTMLElement>('main.panels');
			if (!main) return 0;
			let top = main.offsetTop;
			for (const el of Array.from(main.children)) {
				if (el === target) break;
				if (el.tagName === 'SECTION') top += (el as HTMLElement).offsetHeight;
			}
			return Math.round(top);
		};

		const inFreeZone = (y: number) => snapFree.some(([a, b]) => y >= a && y <= b);

		// Direction-aware nearest-point settle. Travelling less than COMMIT_VH off a
		// point counts as a nudge and returns you to it; more than that commits to the
		// next one. Without the direction test a nudge in either direction would
		// resolve the same way, and a small scroll up out of a panel would advance you.
		// Clearing the flag always re-arms a settle: on a clean landing the re-armed
		// pass is a no-op (the target is where we already are), and on an interrupted
		// one it is the only thing that finishes the job.
		const releaseSnap = () => {
			snapping = false;
			// UNLOCK BY HAND, ALWAYS. Lenis sets `isLocked` when a `lock: true`
			// scrollTo STARTS and clears it when that animation reports completion —
			// so an animation that never completes leaves the page permanently
			// unscrollable, wheel and touch both. It does not complete if its rAF
			// stops advancing mid-tween: a backgrounded tab, a long main-thread stall,
			// a screenshot/print pass. That is not theoretical — it was reproduced
			// here on the first locked build, and the page froze solid for the rest of
			// the session. releaseSnap is on both the onComplete and the safety-timer
			// path, so this covers the completion that never arrives.
			//
			// reset(), not `isLocked = false`: unlocking alone leaves the abandoned
			// tween alive, still creeping toward a target the reader has already left,
			// and the settle we are about to re-arm would then be fighting it for the
			// scroll position. reset() drops the tween AND resyncs Lenis to where the
			// window actually is, which is the only honest starting point for the next
			// settle. On the normal onComplete path it is a no-op by definition —
			// animated, target and actual scroll are already the same number.
			lenis?.reset();
			clearTimeout(snapTimer);
			snapTimer = window.setTimeout(settle, 140);
		};

		function settle() {
			if (snapping || !snapOn() || !lenis || !snapPts.length) return;
			const y = Math.round(window.scrollY);
			if (inFreeZone(y)) return;
			const commit = window.innerHeight * COMMIT_VH;
			let prev: number | null = null;
			let next: number | null = null;
			for (const p of snapPts) {
				if (p <= y) prev = p;
				else {
					next = p;
					break;
				}
			}
			// Past the last point and still heading down is the footer, which sits below
			// the final panel in normal flow. Without this the nudge rule would read the
			// short scroll past Contact as an overshoot and drag you back onto it, making
			// the footer unreachable.
			if (next === null && snapDir > 0) return;
			let target =
				snapDir > 0
					? prev !== null && y - prev < commit
						? prev
						: next
					: next !== null && next - y < commit
						? next
						: prev;
			// target === null means there is nowhere to go in that direction — above the
			// first point, i.e. the hero, which has no point of its own by design.
			if (target === null) return;

			// ─── ONE RUNG PER GESTURE (2026-09-12) ───
			// The commit rule above decides WHICH point to settle on, but nothing stopped
			// a single hard flick from carrying the reader clean over one. Measured at
			// 1440×900: a 1400px flick from 2475 landed on 4275, jumping the subject
			// track's own start at 3375 — a whole section never seen. It bites hardest
			// coming off a horizontal rail, where advancing the rail one panel per flick
			// trains a big gesture, and the very next flick uses that same force against
			// a section that is only one rung deep. Book was the one the site owner
			// noticed, because it sits directly under the gallery rail.
			//
			// So a settle may move at most one rung from the rung the reader was resting
			// on. It does NOT change which direction they go or make the page slower to
			// travel — a second flick still advances a second rung — it only takes away
			// the ability to skip one by accident.
			//
			// THE DISTANCE GUARD IS WHAT KEEPS THIS HONEST. Clamping unconditionally
			// would also hijack a deliberate scrollbar drag from the top of the page to
			// the bottom and yank it back one rung, which would be far worse than the
			// bug. Two and a half viewports is past any plausible flick (a two-rung
			// overshoot is ~1.8) and nowhere near a drag across the document, so beyond
			// it the reader is taken at their word and the plain commit rule applies.
			if (snapAnchor !== null && Math.abs(y - snapAnchor) <= window.innerHeight * 2.5) {
				const ai = snapPts.indexOf(snapAnchor);
				const ti = snapPts.indexOf(target);
				if (ai !== -1 && ti !== -1 && Math.abs(ti - ai) > 1) {
					target = snapPts[ai + (ti > ai ? 1 : -1)];
				}
			}

			if (Math.abs(target - y) < 2) {
				// Already there. Still record it: this is the pass that establishes the
				// anchor after a nav jump or a rebuild, and without it the next flick has
				// nothing to be measured against and may skip freely.
				snapAnchor = target;
				return;
			}
			snapAnchor = target;
			snapping = true;
			lenis.scrollTo(target, {
				duration: SNAP_MS / 1000,
				easing: snapEase,
				force: true,
				// LOCK IS THE OTHER HALF OF "FIRM" (2026-09-12). Without it a flick
				// landing mid-tween CANCELS the scrollTo, and the reader ends up parked
				// between two half panels until the re-armed settle drags them somewhere
				// — the exact state snapping exists to prevent, arrived at by accident
				// roughly every other time you scrolled quickly. With it the 540ms
				// landing is committed: input during the tween is dropped rather than
				// fighting it, and the settle that re-arms afterwards acts on where the
				// reader actually IS. Short enough that it never reads as an unresponsive
				// page; long enough that a panel change feels like a decision.
				lock: true,
				onComplete: releaseSnap,
			});
			// Safety net regardless: `lock` stops WHEEL input, not every route into the
			// scroll position (a keyboard Home/End, a programmatic jump, a resize
			// mid-tween). Both paths must go through releaseSnap — clearing the flag
			// alone would leave nobody to re-arm the settle.
			clearTimeout(snapSafety);
			// Generous by 240ms rather than 140: the backstop must not abort a snap that
			// is merely running a few frames late, only one that has genuinely stalled.
			snapSafety = window.setTimeout(releaseSnap, SNAP_MS + 240);
		}

		const onSnapScroll = () => {
			const y = window.scrollY;
			const d = y - snapLastY;
			if (Math.abs(d) > 0.5) snapDir = d > 0 ? 1 : -1;
			snapLastY = y;
			if (snapping) return;
			clearTimeout(snapTimer);
			snapTimer = window.setTimeout(settle, 140);
		};

		// Every offset is derived from vh, so the table is stale the moment the viewport
		// changes — including the mobile URL-bar resize.
		const onResize = () => {
			clearTimeout(snapResize);
			snapResize = window.setTimeout(buildSnapTable, 180);
		};
		const onLoadRebuild = () => {
			buildSnapTable();
			runInitialNav();
		};
		addEventListener('resize', onResize);
		addEventListener('load', onLoadRebuild);
		// This hook runs from a deferred module script. If anything (a warm cache, a
		// fast refresh) lets the window finish loading first, that listener would never
		// fire and the table would keep the pre-font, pre-image layout. Re-run it once
		// in that case; the call is idempotent. runInitialNav rides along for the same
		// reason: a deep link needs the same settled-layout snap table the rebuild does.
		if (document.readyState === 'complete') requestAnimationFrame(onLoadRebuild);
		buildSnapTable();

		// Bridge Lenis ↔ GSAP. The ticker drives Lenis's rAF, and Lenis tells
		// ScrollTrigger to update. Both are unwound in the cleanup below.
		const tick = (time: number) => lenis?.raf(time * 1000);
		if (lenis) {
			lenis.on('scroll', onSnapScroll);
			lenis.on('scroll', ScrollTrigger.update);
			gsap.ticker.add(tick);
			gsap.ticker.lagSmoothing(0);
		} else {
			addEventListener('scroll', onSnapScroll, { passive: true });
		}

		// ─── Text reveals ───
		// Generic fade-in for elements scrolled into view. The hero's own fades run on
		// load rather than on scroll, since it is already in view.
		gsap.utils.toArray<HTMLElement>('.hero .gsap-fade').forEach((el, i) => {
			gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.8 + i * 0.12 });
		});

		// Elements parked on the horizontal rail are EXCLUDED from both generic loops
		// and re-registered further down against the rail's own tween. A vertical
		// trigger cannot see them: all four rail panels sit at the same vertical
		// position, so `top 85%` is satisfied for every one of them the moment the
		// track pins, and the whole rail would reveal itself at once.
		gsap.utils.toArray<HTMLElement>('.gsap-fade').forEach((el) => {
			if (el.closest('.hero') || el.closest('.track-rail') || el.closest('.gallery-rail')) return;
			gsap.fromTo(
				el,
				{ opacity: 0, y: 18 },
				{
					opacity: 1,
					y: 0,
					duration: 1,
					ease: 'power3.out',
					scrollTrigger: { trigger: el, start: 'top 85%', once: true },
				},
			);
		});

		// Section heading word reveal
		gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
			if (el.closest('.hero') || el.closest('.track-rail') || el.closest('.gallery-rail')) return;
			const words = el.querySelectorAll('.w-inner');
			if (!words.length) return;
			gsap.fromTo(
				words,
				// 150% clears the enlarged .word mask — keep in sync with the CSS.
				{ y: '150%', opacity: 0 },
				{
					y: 0,
					opacity: 1,
					duration: 1,
					ease: 'expo.out',
					stagger: 0.035,
					scrollTrigger: { trigger: el, start: 'top 80%', once: true },
				},
			);
		});

		// SCROLL-READ: words tint from faded to full as the paragraph scrolls through
		gsap.utils.toArray<HTMLElement>('[data-scrollread]').forEach((el) => {
			const words = el.querySelectorAll('.w-inner');
			if (!words.length) return;
			gsap.set(words, { opacity: 0.18, y: 0 });
			gsap.to(words, {
				opacity: 1,
				stagger: { each: 0.05, from: 'start' },
				ease: 'none',
				scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 55%', scrub: true },
			});
		});

		// ─── Top bar ───
		// The bar starts invisible and fades to .compact only once the curtain has
		// opened (~45% of the hero panel's scroll).
		const bar = document.querySelector('.bar');
		const heroEl = document.querySelector('.hero');
		if (bar && heroEl) {
			const sync = (self: { progress: number }) => {
				if (self.progress > 0.45) bar.classList.add('compact');
				else bar.classList.remove('compact');
			};
			ScrollTrigger.create({
				trigger: heroEl,
				start: 'top top',
				end: 'bottom top',
				onUpdate: sync,
				onLeave: () => bar.classList.add('compact'),
				onEnterBack: sync,
			});
		}

		// ─── CURTAIN REVEAL: REVISIT slides up, HISTORY slides down ───
		// The hero is 175vh tall so it acts as its own pinned scene: the first ~0.85vh
		// of scroll plays the curtain out, and the rest of the page sits beyond it.
		const cRevisit = document.getElementById('curtainRevisit');
		const cHistory = document.getElementById('curtainHistory');
		if (cRevisit && cHistory && heroEl) {
			gsap.set([cRevisit, cHistory], { willChange: 'transform' });
			const curtain = (el: HTMLElement, yPercent: number) =>
				gsap.to(el, {
					yPercent,
					ease: 'none',
					scrollTrigger: {
						trigger: heroEl,
						start: 'top top',
						end: () => '+=' + window.innerHeight * 0.85,
						scrub: 0.4,
						invalidateOnRefresh: true,
					},
				});
			curtain(cRevisit, -110);
			curtain(cHistory, 110);
		}

		// ─── SUBJECT TRACK: the horizontal rail ───
		// Modelled on GreenSock's horizontal-scroll pens (codepen YzygYvM and WNjaxKp)
		// with two deliberate departures.
		//
		// 1. THE PIN IS NOT ScrollTrigger'S. Both pens use `pin: true`, which wraps the
		//    pinned element in a spacer <div>. buildSnapTable() derives the whole snap
		//    ladder by walking `main.panels`'s children filtering for SECTION, so a
		//    wrapped section drops out of that walk and every offset below it shifts.
		//    The pin comes from the same `position: sticky` rule as every other panel
		//    here, and only the TWEEN is borrowed.
		// 2. THE SNAPPING IS NOT GSAP'S EITHER. The first pen snaps with ScrollTrigger's
		//    own `snap: 1 / (n - 1)`, which fights the Lenis settle engine — the two
		//    drive the scroll position on alternate frames and jitter against each
		//    other, the same way CSS `scroll-snap-type` does. The rail's stops are
		//    ordinary rows in the snap table instead (see `data-snap-steps`), which is
		//    also the only option available: the second pen notes outright that a
		//    ScrollTrigger with a `containerAnimation` can neither pin nor snap.
		const mm = gsap.matchMedia();
		const trackSec = document.querySelector<HTMLElement>('.subject-track');
		if (trackSec) {
			const railPanels = gsap.utils.toArray<HTMLElement>('.track-rail .track-panel');
			const steps = railPanels.length - 1;

			// Gated on the same query as snapOn() and the stylesheet's own bands — the
			// rail is pinned and scrubbing on desktop AND on phones, and only unrolls
			// into a vertical stack in the tablet band between them, where there is
			// nothing to scrub. matchMedia reverts a branch's tweens and triggers by
			// itself when its query stops matching, which is the whole reason for using
			// it here, and it is what makes a rotate-to-landscape across 820px switch
			// cleanly between the two branches instead of running both.
			mm.add(RAIL_PINNED, () => {
				if (steps < 1) return;
				const railTween = gsap.to(railPanels, {
					// Each panel is `flex: 0 0 100%` of the rail — exactly the width of the
					// window it slides through — so this is one panel-width per step.
					xPercent: -100 * steps,
					// MUST stay linear. containerAnimation maps a trigger's horizontal
					// position back through this tween, and any easing makes that mapping
					// lie. Both pens flag it as the one non-negotiable.
					ease: 'none',
					scrollTrigger: {
						trigger: trackSec,
						// ABSOLUTE scroll positions, not 'top top'. The trigger is a sticky
						// section halfway down the document: measured through its own rect it
						// reports wherever the sticky rule had parked it when the last refresh
						// ran, so a refresh mid-track would move the start to the reader's
						// feet. The hero gets away with 'top top' only because its offset is 0.
						start: () => staticTopOf(trackSec),
						// One PINNED STAGE per step, not one window per step — the two differ
						// on a phone, where the stage is sized in svh. See pinnedHeightOf.
						end: () => staticTopOf(trackSec) + pinnedHeightOf(trackSec) * steps,
						scrub: 0.3,
						invalidateOnRefresh: true,
					},
				});

				// Reveals keyed to HORIZONTAL position — a ScrollTrigger inside a
				// ScrollTrigger, which is what the second pen exists to demonstrate.
				// `start: 'left 80%'` now reads "this element's left edge has reached 80%
				// across the window", and start/end land in the rail tween's TIME domain
				// rather than in scroll pixels.
				//
				// THE FIRST PANEL IS THE EXCEPTION, and it has to be. ScrollTrigger does
				// not fire onEnter for a trigger that is ALREADY ACTIVE when it is
				// created — it adopts the state silently — and panel I is flush in the
				// window from the instant the track pins, so it is past its own horizontal
				// start before the rail has moved at all. Registered like the others its
				// content simply stayed at opacity 0 forever. It reveals on the section
				// arriving instead, which is the same concession the hero already makes
				// (`.hero .gsap-fade` fades on load, since it too is in view from the
				// start). Panels II onward genuinely cross their start as the rail runs.
				const firstPanel = railPanels[0];
				const enteringSection = () => ({
					// Numeric, for the reason the rail tween's own start is numeric: the
					// section is sticky, so its rect cannot be trusted after a mid-page
					// refresh. This is the scroll position at which the section's top
					// reaches 85% of the way down the viewport.
					trigger: trackSec,
					start: () => staticTopOf(trackSec) - window.innerHeight * 0.85,
					end: () => staticTopOf(trackSec),
					once: true,
				});
				const revealTrigger = (el: HTMLElement, start: string) =>
					firstPanel?.contains(el)
						? enteringSection()
						: { trigger: el, containerAnimation: railTween, start, once: true };

				trackSec.querySelectorAll<HTMLElement>('.track-rail [data-split]').forEach((el) => {
					const words = el.querySelectorAll('.w-inner');
					if (!words.length) return;
					gsap.fromTo(
						words,
						// 150% clears the enlarged .word mask — keep in sync with the CSS.
						{ y: '150%', opacity: 0 },
						{
							y: 0,
							opacity: 1,
							duration: 1,
							ease: 'expo.out',
							stagger: 0.035,
							scrollTrigger: revealTrigger(el, 'left 80%'),
						},
					);
				});

				trackSec.querySelectorAll<HTMLElement>('.track-rail .gsap-fade').forEach((el) => {
					gsap.fromTo(
						el,
						{ opacity: 0, y: 18 },
						{
							opacity: 1,
							y: 0,
							duration: 1,
							ease: 'power3.out',
							scrollTrigger: revealTrigger(el, 'left 85%'),
						},
					);
				});
			});

			// In the tablet band ONLY the rail is a plain vertical stack, so its content
			// reveals on vertical position like the rest of the page. Phones fall under
			// RAIL_PINNED above with the desktop branch, not here.
			mm.add(RAIL_STACKED, () => {
				trackSec.querySelectorAll<HTMLElement>('.track-rail [data-split]').forEach((el) => {
					const words = el.querySelectorAll('.w-inner');
					if (!words.length) return;
					gsap.fromTo(
						words,
						{ y: '150%', opacity: 0 },
						{
							y: 0,
							opacity: 1,
							duration: 1,
							ease: 'expo.out',
							stagger: 0.035,
							scrollTrigger: { trigger: el, start: 'top 80%', once: true },
						},
					);
				});
				trackSec.querySelectorAll<HTMLElement>('.track-rail .gsap-fade').forEach((el) => {
					gsap.fromTo(
						el,
						{ opacity: 0, y: 18 },
						{
							opacity: 1,
							y: 0,
							duration: 1,
							ease: 'power3.out',
							scrollTrigger: { trigger: el, start: 'top 85%', once: true },
						},
					);
				});
			});
		}

		// ─── FORMATS GALLERY: a second horizontal rail ───
		// Deliberately a near-duplicate of the subject track block above rather than
		// a shared helper reaching for both — see the note on FormatsPanel.tsx/
		// site.css for why the two rails are kept independent. Every mechanism note
		// on the subject track block applies here unchanged: sticky pin (not
		// ScrollTrigger's), snap-table steps (not GSAP's own snap), absolute
		// scroll-position triggers via staticTopOf, and the first-panel reveal
		// exception.
		const gallerySec = document.querySelector<HTMLElement>('.formats');
		if (gallerySec) {
			const galleryPanels = gsap.utils.toArray<HTMLElement>('.gallery-rail .gallery-panel');
			const gallerySteps = galleryPanels.length - 1;

			mm.add(RAIL_PINNED, () => {
				if (gallerySteps < 1) return;
				const galleryTween = gsap.to(galleryPanels, {
					xPercent: -100 * gallerySteps,
					ease: 'none',
					scrollTrigger: {
						trigger: gallerySec,
						start: () => staticTopOf(gallerySec),
						// One pinned stage per step — see the same note on the track's tween.
						end: () => staticTopOf(gallerySec) + pinnedHeightOf(gallerySec) * gallerySteps,
						scrub: 0.3,
						invalidateOnRefresh: true,
					},
				});

				const firstGalleryPanel = galleryPanels[0];
				const enteringGallerySection = () => ({
					trigger: gallerySec,
					start: () => staticTopOf(gallerySec) - window.innerHeight * 0.85,
					end: () => staticTopOf(gallerySec),
					once: true,
				});
				const revealGalleryTrigger = (el: HTMLElement, start: string) =>
					firstGalleryPanel?.contains(el)
						? enteringGallerySection()
						: { trigger: el, containerAnimation: galleryTween, start, once: true };

				gallerySec.querySelectorAll<HTMLElement>('.gallery-rail [data-split]').forEach((el) => {
					const words = el.querySelectorAll('.w-inner');
					if (!words.length) return;
					gsap.fromTo(
						words,
						{ y: '150%', opacity: 0 },
						{
							y: 0,
							opacity: 1,
							duration: 1,
							ease: 'expo.out',
							stagger: 0.035,
							scrollTrigger: revealGalleryTrigger(el, 'left 80%'),
						},
					);
				});

				gallerySec.querySelectorAll<HTMLElement>('.gallery-rail .gsap-fade').forEach((el) => {
					gsap.fromTo(
						el,
						{ opacity: 0, y: 18 },
						{
							opacity: 1,
							y: 0,
							duration: 1,
							ease: 'power3.out',
							scrollTrigger: revealGalleryTrigger(el, 'left 85%'),
						},
					);
				});
			});

			// In the tablet band only — phones use the pinned branch above.
			mm.add(RAIL_STACKED, () => {
				gallerySec.querySelectorAll<HTMLElement>('.gallery-rail .gsap-fade').forEach((el) => {
					gsap.fromTo(
						el,
						{ opacity: 0, y: 18 },
						{
							opacity: 1,
							y: 0,
							duration: 1,
							ease: 'power3.out',
							scrollTrigger: { trigger: el, start: 'top 85%', once: true },
						},
					);
				});
			});
		}

		// ─── PINNED PANELS: active section tracking + incoming-edge shadow ───
		// Each section is sticky; the "active" one is the one currently filling the
		// viewport (its top has hit the top of the viewport).
		const panels = gsap.utils.toArray<HTMLElement>('.panels > section');
		const navLinks = Array.from(document.querySelectorAll(".nav-list a[href^='#']"));
		const setActiveSection = (id: string) => {
			navLinks.forEach((a) => a.classList.remove('is-active'));
			navLinks.find((a) => a.getAttribute('href') === '#' + id)?.classList.add('is-active');
		};

		panels.forEach((panel, i) => {
			const next = panels[i + 1];

			ScrollTrigger.create({
				trigger: panel,
				start: 'top top',
				end: () => (next ? '+=' + window.innerHeight : 'bottom bottom'),
				onEnter: () => setActiveSection(panel.id),
				onEnterBack: () => setActiveSection(panel.id),
			});

			// When the NEXT panel is about to slide up over this one, mark the incoming
			// panel so its top-edge shadow fades in.
			if (next) {
				ScrollTrigger.create({
					trigger: next,
					start: 'top bottom', // next's top hits viewport bottom
					end: 'top top', // next's top hits viewport top
					onEnter: () => next.classList.add('is-incoming'),
					onLeave: () => next.classList.remove('is-incoming'),
					onEnterBack: () => next.classList.add('is-incoming'),
					onLeaveBack: () => next.classList.remove('is-incoming'),
				});
			}
		});

		if (panels[0]) setActiveSection(panels[0].id);

		// ─── In-page links → Lenis ───
		// NAV_ITEMS now hrefs real paths ('/about', '/book', '/contact') rather than
		// hashes, so a direct visit to one of those URLs lands on its section — see
		// runInitialNav / onPopState below. Clicking still scrolls in-page rather
		// than reloading; it just also updates the URL via pushState, so the two
		// entry points (click vs. direct load) stay in sync. The footer's '#top'
		// link is untouched — it is not a menu item and was never asked to become a
		// real path.
		const onNavClick = (e: Event) => {
			const a = e.currentTarget as HTMLAnchorElement;
			const href = a.getAttribute('href');
			if (!href || !(href.startsWith('#') || href.startsWith('/'))) return;
			const t = href.startsWith('#') ? document.querySelector(href) : null;
			if (href.startsWith('#') && !t) return;
			e.preventDefault();
			// Resolve through the snap table, not the element: a target section is
			// sticky, so its rect reports where it is parked, not where its panel
			// starts. Nav and snap have to agree on that number or a jump lands
			// mid-transition and the settle immediately drags it somewhere else.
			const navId = href.slice(1);
			const navTop = navId === 'top' ? 0 : snapIds[navId];
			if (lenis) {
				snapping = true;
				// A nav jump is a deliberate move to a named section, so it sets the
				// one-rung anchor to where it is going. Left pointing at the rung the
				// reader came FROM, the settle that re-arms on arrival would measure the
				// whole jump against it and could drag them back a rung.
				if (navTop !== undefined) snapAnchor = navTop;
				// Locked for the same reason the settle is: a nav jump crosses several
				// panels, and a wheel touch halfway through used to abandon it between
				// two of them.
				lenis.scrollTo(navTop !== undefined ? navTop : (t ?? 0), {
					offset: 0,
					duration: 1.0,
					easing: snapEase,
					lock: true,
					onComplete: releaseSnap,
				});
				// Backstop for the lock, same reasoning as the settle's — see releaseSnap.
				window.setTimeout(releaseSnap, 1140);
			} else if (t) t.scrollIntoView({ behavior: 'smooth' });
			if (href.startsWith('/') && navTop !== undefined) history.pushState(null, '', href);
			document.getElementById('menuOverlay')?.classList.remove('open');
		};
		const navAnchors = Array.from(document.querySelectorAll('a[data-link]'));
		navAnchors.forEach((a) => a.addEventListener('click', onNavClick));

		// ─── Deep links: /about, /book, /contact land straight on their section ───
		// Runs once, off the same 'load'-timed calls that (re)build the snap table —
		// snapIds is only trustworthy once layout (fonts, images) has settled, which
		// is also why this is not attempted from the very first synchronous
		// buildSnapTable() call below.
		const routeSectionIds = new Set(['about', 'book', 'contact']);
		let initialNavDone = false;
		const runInitialNav = () => {
			if (initialNavDone) return;
			const id = window.location.pathname.replace(/^\/+|\/+$/g, '');
			if (!routeSectionIds.has(id)) {
				initialNavDone = true;
				return;
			}
			const target = snapIds[id];
			if (target === undefined) return; // table not ready yet — try again next call
			initialNavDone = true;
			snapAnchor = target; // landing straight on a section establishes the rung
			if (lenis) lenis.scrollTo(target, { immediate: true });
			else window.scrollTo(0, target);
		};

		// Browser back/forward between those same paths, so the pin holds both ways.
		const onPopState = () => {
			const id = window.location.pathname.replace(/^\/+|\/+$/g, '');
			if (!routeSectionIds.has(id)) return;
			const target = snapIds[id];
			if (target === undefined) return;
			if (lenis) {
				snapping = true;
				snapAnchor = target; // same reason as the nav click above
				lenis.scrollTo(target, {
					duration: 1.0,
					easing: snapEase,
					lock: true,
					onComplete: releaseSnap,
				});
				window.setTimeout(releaseSnap, 1140);
			} else window.scrollTo(0, target);
		};
		addEventListener('popstate', onPopState);

		ScrollTrigger.refresh();
		buildSnapTable();

		// ─── Cookies ───
		const cookies = document.getElementById('cookies');
		const cookieOk = document.getElementById('cookieOk');
		const onCookieOk = () => {
			cookies?.classList.add('hidden');
			try {
				localStorage.setItem('rh-cookies', '1');
			} catch {
				/* private mode / storage disabled */
			}
		};
		cookieOk?.addEventListener('click', onCookieOk);
		try {
			if (localStorage.getItem('rh-cookies')) cookies?.classList.add('hidden');
		} catch {
			/* private mode / storage disabled */
		}

		// ─── Mobile menu ───
		const overlay = document.getElementById('menuOverlay');
		const menuBtn = document.getElementById('menuBtn');
		const menuClose = document.getElementById('menuClose');
		const openMenu = () => overlay?.classList.add('open');
		const closeMenu = () => overlay?.classList.remove('open');
		const onOverlayClick = (e: Event) => {
			if ((e.target as HTMLElement).tagName === 'A') closeMenu();
		};
		menuBtn?.addEventListener('click', openMenu);
		menuClose?.addEventListener('click', closeMenu);
		overlay?.addEventListener('click', onOverlayClick);

		// ─── Language toggle (visual only) ───
		const langButtons = Array.from(document.querySelectorAll('.lang button'));
		const onLangClick = (e: Event) => {
			const btn = e.currentTarget;
			langButtons.forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
		};
		langButtons.forEach((b) => b.addEventListener('click', onLangClick));

		// ─── Teardown ───
		// useGSAP's context reverts every tween and ScrollTrigger above. Everything
		// here is what the context does not know about: Lenis, the GSAP ticker
		// callback, the window and element listeners, and the pending timers. Without
		// this, a remount would leave a second Lenis instance fighting the first and
		// two settle timers racing each other.
		return () => {
			clearTimeout(snapTimer);
			clearTimeout(snapSafety);
			clearTimeout(snapResize);
			// The matchMedia instance is not part of the useGSAP context, so its
			// branches' tweens and triggers survive a context revert unless killed here.
			mm.kill();
			removeEventListener('resize', onResize);
			removeEventListener('load', onLoadRebuild);
			removeEventListener('popstate', onPopState);
			if (lenis) {
				gsap.ticker.remove(tick);
				lenis.off('scroll', onSnapScroll);
				lenis.off('scroll', ScrollTrigger.update);
				lenis.destroy();
			} else {
				removeEventListener('scroll', onSnapScroll);
			}
			navAnchors.forEach((a) => a.removeEventListener('click', onNavClick));
			cookieOk?.removeEventListener('click', onCookieOk);
			menuBtn?.removeEventListener('click', openMenu);
			menuClose?.removeEventListener('click', closeMenu);
			overlay?.removeEventListener('click', onOverlayClick);
			langButtons.forEach((b) => b.removeEventListener('click', onLangClick));
		};
	});
}
