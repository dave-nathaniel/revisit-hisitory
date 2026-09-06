import { useLayoutEffect, useRef } from 'react';
import { SIMPLYBOOK_CONFIG, SIMPLYBOOK_SCRIPT_SRC } from '../data/siteContent';

type SimplybookWidgetCtor = (new (options: Record<string, unknown>) => unknown) & {
	prototype: { scrollToContent?: (contentPos: number) => void };
};

declare global {
	interface Window {
		SimplybookWidget?: SimplybookWidgetCtor;
	}
}

/**
 * Stops widget.js from scrolling OUR page when the booking form changes step.
 *
 * On every `stepChanged` / `scrollTo` message the widget sends itself, widget.js
 * runs `scrollToContent()`, which is this:
 *
 *   absoluteTarget = window.pageYOffset + frame.getBoundingClientRect().top + contentPos
 *   top            = max(0, absoluteTarget - _getFixedTopOffset() - 16)
 *   if (pageYOffset > top) window.scrollTo(0, top)
 *
 * Both inputs are wrong on this site, and they compound:
 *
 *   - `getBoundingClientRect().top` on the frame is the PINNED position, because
 *     the frame lives inside a `position:sticky` panel. It reports 129px no
 *     matter how far down the document Book actually starts.
 *   - `_getFixedTopOffset()` hunts for sticky/fixed elements pinned at the top and
 *     spanning at least half the viewport, and adds their height as a top offset.
 *     EVERY panel on this site is exactly that — `position:sticky; top:0;
 *     height:100vh; width:100%` — so it returns a full viewport, 900px.
 *
 * With Book pinned at 1440x900 that computes `top = 5317 + 129 - 900 - 16 = 4530`
 * against a real scroll position of 5317, so clicking a service threw the reader
 * 787px backwards, off Book entirely — and Lenis then settled them somewhere else
 * again. It reads as the page jumping to the top.
 *
 * The behaviour is pointless here even when it works: the widget is clamped
 * inside a pinned panel that is already fully in view, and it scrolls its own
 * document. So the method is replaced with a no-op.
 *
 * Patching the prototype rather than intercepting the postMessage is deliberate —
 * it does not depend on our `message` listener being registered before widget.js's
 * (listeners on the same target fire in registration order, and widget.js
 * registers its own at load), and it leaves every other message the widget sends
 * itself — `appReady`, `expandHeight`, modal bookkeeping — untouched.
 */
function silenceHostScroll(Widget: SimplybookWidgetCtor): void {
	if (typeof Widget.prototype?.scrollToContent !== 'function') return;
	Widget.prototype.scrollToContent = function noHostScroll() {};
}

/**
 * Mounts the SimplyBook booking widget into `container`.
 *
 * TWO THINGS ABOUT THIS THAT LOOK LIKE OVER-ENGINEERING AND ARE NOT:
 *
 * 1. The loader is appended imperatively rather than rendered. A <script> tag
 *    written as JSX is inert — React creates the element, the browser never
 *    executes it — so porting the original's two literal <script> tags into the
 *    markup would leave the Book panel silently empty.
 *
 * 2. `container_id` is passed even though the original config had no such key.
 *    Without a container the widget falls back to `document.write(iframeHtml)`.
 *    That worked in the original because the scripts ran during parsing, so the
 *    write landed inline. Here it runs after load, where document.write on a
 *    closed document REPLACES THE ENTIRE PAGE — the first build of this port did
 *    exactly that and rendered a body containing nothing but the booking iframe.
 *    The option is the widget's own supported path (it accepts an id string or a
 *    DOM node) and takes the `container.innerHTML = iframeHtml` branch instead,
 *    producing the same iframe in the same parent as before.
 *
 * The widget's insides are cross-origin: the theme_settings object in
 * siteContent is the only stylesheet reachable for them, and it stays
 * byte-identical to the original. Widget theme changes are cached hard — verify
 * with a cache-busting query, not a plain reload.
 */
export default function useSimplybookWidget(container: React.RefObject<HTMLElement>): void {
	// The widget itself warns on a second instance, and its loader warns if
	// widget.js is evaluated twice. This survives a double effect invocation
	// (a fast refresh, or StrictMode if it is ever switched back on).
	const built = useRef(false);

	useLayoutEffect(() => {
		const host = container.current;
		if (!host || built.current) return;
		built.current = true;

		const construct = () => {
			const Widget = window.SimplybookWidget;
			if (!Widget) return;
			silenceHostScroll(Widget);
			new Widget({ ...SIMPLYBOOK_CONFIG, container_id: host });
		};

		if (window.SimplybookWidget) {
			construct();
			return;
		}

		const existing = document.querySelector<HTMLScriptElement>(
			`script[src="${SIMPLYBOOK_SCRIPT_SRC}"]`,
		);
		if (existing) {
			existing.addEventListener('load', construct, { once: true });
			return;
		}

		const loader = document.createElement('script');
		loader.src = SIMPLYBOOK_SCRIPT_SRC;
		loader.type = 'text/javascript';
		loader.addEventListener('load', construct, { once: true });
		host.appendChild(loader);
	}, [container]);
}
