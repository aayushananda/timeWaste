/** Runs in <head> before first paint, so the overlay never flashes and no-JS
 *  visitors, crawlers and link-preview bots never see it at all.
 *
 *  Plays on every full load of the home page. Sets html[data-intro] to "play"
 *  or "skip"; CSS keys the overlay off that, which keeps React's server and
 *  client markup identical. IntroOverlay sets "done" once it closes, so a
 *  client-side return to the home page does not replay it. */
export const INTRO_SCRIPT = `(function(){var d=document.documentElement;try{var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;var home=location.pathname==='/'||location.pathname==='';d.setAttribute('data-intro',!reduce&&home?'play':'skip')}catch(e){d.setAttribute('data-intro','skip')}})();`;
