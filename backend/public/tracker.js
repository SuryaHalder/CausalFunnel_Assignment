/*!
 * Pathlight tracker
 * Add to any page:  <script src="https://YOUR-HOST/tracker.js" defer></script>
 * Optional:         data-api="https://other-host/api/v1/events" to override the endpoint.
 *
 * Sends two kinds of events to the backend: page_view and click.
 * No dependencies, ES5 syntax so it runs on old browsers too.
 */
(function () {
  "use strict";

  // Guard: if the snippet is pasted twice, don't double-count everything.
  if (window.__pathlightLoaded) return;
  window.__pathlightLoaded = true;

  // ---------- Configuration ----------
  var script =
    document.currentScript || document.querySelector('script[src*="tracker.js"]');

  var API_URL =
    (script && script.getAttribute("data-api")) ||
    (script && script.src ? new URL(script.src).origin : location.origin) +
      "/api/v1/events";

  var STORAGE_KEY = "pl_session"; // localStorage key holding {id, lastActive}
  var COOKIE_NAME = "pl_session"; // fallback when localStorage is blocked
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min of inactivity starts a new session

  // ---------- Session handling ----------
  function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID(); // only exists on https / localhost
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function readCookie() {
    var match = document.cookie.match(new RegExp("(?:^|; )" + COOKIE_NAME + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function readStored() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      raw = readCookie(); // localStorage can throw in private mode / blocked storage
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeStored(session) {
    var raw = JSON.stringify(session);
    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
    } catch (e) {
      document.cookie =
        COOKIE_NAME + "=" + encodeURIComponent(raw) + "; path=/; max-age=1800; SameSite=Lax";
    }
  }

  // Returns the current session id, creating or renewing it when needed.
  function getSessionId() {
    var now = Date.now();
    var session = readStored();
    if (!session || !session.id || now - session.lastActive > SESSION_TIMEOUT_MS) {
      session = { id: generateId(), lastActive: now };
    }
    session.lastActive = now;
    writeStored(session);
    return session.id;
  }

  // ---------- Sending ----------
  // We send Content-Type text/plain on purpose: it is a "simple" CORS request, so the
  // browser skips the extra OPTIONS preflight. The backend parses it as JSON anyway.
  function send(payload) {
    var body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        // sendBeacon survives page unloads (e.g. a click on a link that navigates away).
        var queued = navigator.sendBeacon(
          API_URL,
          new Blob([body], { type: "text/plain;charset=UTF-8" })
        );
        if (queued) return;
      }
    } catch (e) {
      /* fall through to fetch */
    }
    try {
      fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: body,
        keepalive: true,
        mode: "cors",
      }).catch(function () {});
    } catch (e) {
      /* analytics must never break the host page */
    }
  }

  function baseEvent(type) {
    return {
      session_id: getSessionId(),
      event_type: type,
      page_url: location.href,
      timestamp: new Date().toISOString(),
    };
  }

  // ---------- page_view ----------
  var lastTrackedUrl = null;

  function trackPageView() {
    if (location.href === lastTrackedUrl) return; // avoid duplicates
    lastTrackedUrl = location.href;
    send(baseEvent("page_view"));
  }

  // Single-page apps change the URL without reloading, so we also listen for that.
  function patchHistory(method) {
    var original = history[method];
    history[method] = function () {
      var result = original.apply(this, arguments);
      setTimeout(trackPageView, 0); // wait until the URL has actually changed
      return result;
    };
  }
  patchHistory("pushState");
  patchHistory("replaceState");
  window.addEventListener("popstate", trackPageView);

  // ---------- click ----------
  function documentSize() {
    var doc = document.documentElement;
    var body = document.body || doc;
    return {
      width: Math.max(doc.scrollWidth, body.scrollWidth, doc.clientWidth),
      height: Math.max(doc.scrollHeight, body.scrollHeight, doc.clientHeight),
    };
  }

  // Describe what was clicked, e.g. {tag:"button", id:"buy", text:"Buy now"}
  function describeTarget(node) {
    var el = node && node.nodeType === 1 ? node : node && node.parentElement;
    if (!el) return undefined;
    var meaningful = el.closest
      ? el.closest("a,button,input,select,textarea,label,[role=button]") || el
      : el;
    var text = (meaningful.innerText || meaningful.value || meaningful.alt || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);
    return {
      tag: meaningful.tagName.toLowerCase(),
      id: meaningful.id || undefined,
      text: text || undefined,
    };
  }

  // Capture phase (third argument true): we still see the click even if the page's
  // own code calls stopPropagation().
  document.addEventListener(
    "click",
    function (e) {
      if (!e.isTrusted) return; // ignore clicks fired by scripts (el.click())
      var size = documentSize();
      var event = baseEvent("click");
      event.x = Math.round(e.pageX); // pageX/pageY = position in the WHOLE page, not just the visible window
      event.y = Math.round(e.pageY);
      event.page_width = size.width;
      event.page_height = size.height;
      event.viewport_width = window.innerWidth;
      event.viewport_height = window.innerHeight;
      event.target = describeTarget(e.target);
      send(event);
    },
    true
  );

  // First page view of this load
  trackPageView();
})();
