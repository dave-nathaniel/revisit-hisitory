import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/site.css';

// StrictMode is ON, and that is a real assertion rather than a default.
//
// It double-invokes effects in development: mount → cleanup → mount. The motion
// layer used to have no teardown at all (it was ported from an inline script
// that ran once for the life of the document), so a second pass built a second
// Lenis instance, registered every ScrollTrigger twice and doubled every
// listener — StrictMode had to be off to hide that. useSiteMotion now runs
// inside useGSAP's context and returns an explicit cleanup for everything the
// context does not own, so the double-invoke settles back to exactly one of
// each: verified at 64 ScrollTriggers (not 128), 58 word spans and one booking
// iframe. (52 before the subject track added its rail tween and its horizontal
// reveals; 56 before the Formats rebuild replaced two card fades with ten
// field-part fades.)
//
// Leaving it on means every dev load re-checks that teardown. If you ever see
// the trigger count double, the cleanup has regressed — don't switch this off
// to make the symptom go away.
const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
