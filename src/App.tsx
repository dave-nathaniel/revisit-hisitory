import useSiteMotion from './hooks/useSiteMotion';
import TopBar from './components/TopBar';
import MenuOverlay from './components/MenuOverlay';
import LangToggle from './components/LangToggle';
import CookieBanner from './components/CookieBanner';
import SiteFooter from './components/SiteFooter';
import HeroPanel from './components/panels/HeroPanel';
import IntroPanel from './components/panels/IntroPanel';
import ManifestoPanel from './components/panels/ManifestoPanel';
import SubjectTrackPanel from './components/panels/SubjectTrackPanel';
import FormatsPanel from './components/panels/FormatsPanel';
import BookPanel from './components/panels/BookPanel';
import ContactPanel from './components/panels/ContactPanel';

/**
 * PINNED PANELS — every top-level section inside `.panels` is
 * `position: sticky; top: 0; height: 100vh` with an increasing z-index, so each
 * later section slides up and covers the one before it.
 *
 * THE ORDER OF THESE PANELS IS LOAD-BEARING. It is the document order that
 * buildSnapTable() walks to derive the snap offsets, and it has to stay in step
 * with three other places if it ever changes: the `z-index` ladder
 * (`.panels > section.<name>`), the sticky-section selector list, and the
 * mobile-padding rule — all in site.css. Get them out of step and panels stack
 * wrong or the snap table lands mid-transition.
 *
 * Content hierarchy, which the panel run makes visible:
 *   Acces › Revisit History › A Colonial Present › [tour content]
 * Hero, About and Why sit at the Revisit History (umbrella) level and are flat
 * white. The Subject track, Formats and Book are one uninterrupted field of
 * `--subject-bg` — you enter a colour, stay in it, then leave it, and that is
 * the felt cue that they live inside the subject. Contact stands outside the
 * umbrella entirely and is white again.
 *
 * SubjectTrackPanel is ONE section that spans several viewports of scroll: the
 * subject cover stands still on its left while a rail of panels scrubs past
 * horizontally on its right, and vertical scrolling resumes into Formats only
 * once the rail has run out. It replaced the separate Subject-cover and Antwerp
 * panels (Antwerp is now the rail's first panel). Because it is one section, the
 * ladder below it is unchanged in kind — it is simply taller than a viewport,
 * the way the hero is.
 *
 * There is no Route panel. It was removed from the markup; its CSS and its
 * ScrollTrigger block survive as dead code (see the note in useSiteMotion), and
 * both `snap_test.py` and CLAUDE.md still describe it — they predate the removal.
 */
export default function App() {
	useSiteMotion();

	return (
		<>
			<TopBar />
			<MenuOverlay />
			<LangToggle />

			<main className="panels">
				<HeroPanel />
				<IntroPanel />
				<ManifestoPanel />
				<SubjectTrackPanel />
				<FormatsPanel />
				<BookPanel />
				<ContactPanel />
			</main>

			<SiteFooter />
			<CookieBanner />
		</>
	);
}
