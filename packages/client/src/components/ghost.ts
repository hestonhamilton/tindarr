// Centre logo for the Halloween lobby's invite QR ("Ghost" style, self-made, no licence needed).
// Drawn over excavated modules, so the QR needs error level H to stay readable.
const GHOST_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="20" fill="#251d32"/><g fill="#fff3e8"><ellipse cx="50" cy="38" rx="26" ry="24"/><rect x="24" y="38" width="52" height="40"/><ellipse cx="30.5" cy="78" rx="6.5" ry="8"/><ellipse cx="43.5" cy="78" rx="6.5" ry="8"/><ellipse cx="56.5" cy="78" rx="6.5" ry="8"/><ellipse cx="69.5" cy="78" rx="6.5" ry="8"/></g><g fill="#251d32"><ellipse cx="40.5" cy="40" rx="4.5" ry="6"/><ellipse cx="59.5" cy="40" rx="4.5" ry="6"/><ellipse cx="50" cy="58" rx="5" ry="6"/></g></svg>';

export const GHOST_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(GHOST_SVG)}`;
