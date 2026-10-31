// Rules for showing and hiding an add-on's home-screen rows inside a Stremio
// account's add-on collection (used by the Lineup page).
//
// Stremio's home board only shows catalogs with no required "extra". Rows
// that can search are hidden by marking their search extra as required: they
// leave the home screen (and Discover) but keep answering searches, the same
// pattern Stremio's own YouTube add-on uses for its search-only catalog.
// Rows that can't search are simply removed from the stored manifest.

export const CINEMETA = 'com.linvo.cinemeta';

const clone = (x) => JSON.parse(JSON.stringify(x));

/**
 * Where `cat` sits in `list`. Catalogs are identified by type + id, so a row
 * an add-on has since renamed still matches; the name only breaks ties when
 * an add-on reuses one id for several rows.
 */
export function findIndex(list, cat) {
  const hits = [];
  list.forEach((c, i) => { if (c.type === cat.type && c.id === cat.id) hits.push(i); });
  if (hits.length <= 1) return hits.length ? hits[0] : -1;
  return hits.find((i) => (list[i].name || '') === (cat.name || '')) ?? hits[0];
}

export function onBoard(c) {
  return !(c.extraRequired || []).length && !(c.extra || []).some((e) => e.isRequired);
}

export function canSearch(c) {
  return (c.extra || []).some((e) => e.name === 'search') || (c.extraSupported || []).includes('search');
}

function searchOnly(c) {
  const copy = clone(c);
  if (Array.isArray(copy.extra) && copy.extra.some((e) => e.name === 'search')) {
    copy.extra = copy.extra.map((e) => (e.name === 'search' ? { ...e, isRequired: true } : e));
  } else {
    copy.extraRequired = [...new Set([...(copy.extraRequired || []), 'search'])];
  }
  return copy;
}

/**
 * The rows an add-on can put on the home screen, judged against its full
 * (reference) catalog list, with whether each one is currently shown.
 */
export function boardRows(current = [], reference = []) {
  const ref = (reference.length ? reference : current).filter(onBoard);
  return ref.map((catalog) => {
    const now = current[findIndex(current, catalog)];
    return { catalog, shown: Boolean(now && onBoard(now)), keepsSearch: canSearch(catalog) };
  });
}

/** A new catalog list with `catalog` shown or hidden; everything else untouched. */
export function setRow(current = [], reference = [], catalog, show) {
  const ref = reference.length ? reference : current;
  const def = ref[findIndex(ref, catalog)] || catalog;
  const next = current.map(clone);
  const at = findIndex(next, catalog);
  if (show) {
    if (at !== -1) next[at] = clone(def);
    else {
      // Put it back in the add-on's own order.
      const refIdx = findIndex(ref, catalog);
      let insert = next.length;
      for (let i = 0; i < next.length; i++) {
        if (findIndex(ref, next[i]) > refIdx) { insert = i; break; }
      }
      next.splice(insert, 0, clone(def));
    }
  } else if (at !== -1) {
    if (canSearch(def)) next[at] = searchOnly(def);
    else next.splice(at, 1);
  }
  return next;
}
