
// RSAinn V3.2 — Calendar Development
// Public read-only calendar integration via restricted Supabase RPC functions.

// MOBILE MENU
const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');

if (menu && nav) {
  menu.addEventListener('click', () => {
    const opened = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(opened));
  });

  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
    });
  });
}

// FOOTER YEAR
const year = document.getElementById('year');
if (year) {
  year.textContent = new Date().getFullYear();
}

// SUPABASE CALENDAR CONFIGURATION
const RSAINN_CALENDAR = Object.freeze({
  enabled: true,

  supabaseUrl: 'https://xhxwjaobubxbretiqwsr.supabase.co',

  publishableKey:
    'sb_publishable_dN3KP37RRjRY-_0SFCYPkA_lsszaNoH',

  propertyId: 1,

  ratesFunction: 'website_public_rates',
  availabilityFunction: 'website_public_availability'
});

// CALENDAR
const grid = document.getElementById('calendarGrid');

if (grid) {
  const title = document.getElementById('monthTitle');
  const notice = document.getElementById('calendarNotice');
  const summary = document.getElementById('selectionSummary');
  const whatsapp = document.getElementById('whatsappQuote');

  const pad = n => String(n).padStart(2, '0');

  const dateKey = (y, m, d) =>
    `${y}-${pad(m + 1)}-${pad(d)}`;

  let view = new Date();
  view = new Date(view.getFullYear(), view.getMonth(), 1);

  let rates = new Map();
  let blocked = new Set();
  let checkIn = null;
  let checkOut = null;
  let calendarReady = false;
  let requestSequence = 0;

  const baseWhatsapp =
    'https://wa.me/27678908034?text=';

  // UPDATE SELECTED DATES
  function updateSelection() {
    if (summary) {
      summary.textContent =
        checkIn && checkOut
          ? `Check-in: ${checkIn} · Check-out: ${checkOut}`
          : checkIn
          ? `Check-in: ${checkIn} · Select check-out`
          : 'Select a check-in date and then a check-out date.';
    }

    if (whatsapp) {
      const message =
        checkIn && checkOut
          ? `Hello RSAinn, I would like a quote for Driftsands 108 from ${checkIn} to ${checkOut}.`
          : 'Hello RSAinn, I would like to request a quote for Driftsands 108.';

      whatsapp.href =
        baseWhatsapp + encodeURIComponent(message);
    }
  }

  // CHECK FOR BLOCKED NIGHTS
  function safeRange(start, end) {
    for (
      let d = new Date(`${start}T12:00:00`);
      dateKey(d.getFullYear(), d.getMonth(), d.getDate()) < end;
      d.setDate(d.getDate() + 1)
    ) {
      const key = dateKey(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      );

      if (blocked.has(key)) return false;
    }

    return true;
  }

  // DRAW CALENDAR
  function render() {
    if (title) {
      title.textContent = view.toLocaleDateString('en-ZA', {
        month: 'long',
        year: 'numeric'
      });
    }

    grid.replaceChildren();

    const offset = (view.getDay() + 6) % 7;

    for (let i = 0; i < offset; i++) {
      const blank = document.createElement('span');
      blank.className = 'cal-day blank';
      grid.append(blank);
    }

    const days = new Date(
      view.getFullYear(),
      view.getMonth() + 1,
      0
    ).getDate();

    for (let n = 1; n <= days; n++) {
      const key = dateKey(
        view.getFullYear(),
        view.getMonth(),
        n
      );

      const button = document.createElement('button');
      button.type = 'button';

      const booked = blocked.has(key);

      const active =
        RSAINN_CALENDAR.enabled &&
        calendarReady &&
        key >= dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) &&
        rates.has(key) &&
        !booked;

      button.className =
        `cal-day ${
          !RSAINN_CALENDAR.enabled || !calendarReady
            ? 'is-unavailable'
            : booked
            ? 'booked'
            : active
            ? 'available'
            : 'is-unavailable'
        }`;

      button.disabled = !active;

      const date = document.createElement('span');
      date.className = 'date';
      date.textContent = String(n);

      const rate = document.createElement('span');
      rate.className = 'rate';

      rate.textContent =
        !RSAINN_CALENDAR.enabled || !calendarReady
          ? 'Enquire'
          : booked
          ? 'Booked'
          : active
          ? `R${Number(rates.get(key)).toLocaleString('en-ZA')}`
          : 'Enquire';

      button.append(date, rate);

      if (active) {
        button.addEventListener('click', () => {
          if (!checkIn || checkOut || key <= checkIn) {
            checkIn = key;
            checkOut = null;
          } else if (safeRange(checkIn, key)) {
            checkOut = key;
          } else {
            checkIn = key;
            checkOut = null;
          }

          updateSelection();
          render();
        });
      }

     
/* Highlight the full selected date range */
if (
  checkIn &&
  (
    key === checkIn ||
    key === checkOut ||
    (checkOut && key > checkIn && key < checkOut)
  )
) {
  button.classList.add('selected');
}


      grid.append(button);
    }
  }

  // PUBLIC RPC REQUESTS: never access private tables from the website.
  async function publicRpc(functionName) {
    const response = await fetch(
      `${RSAINN_CALENDAR.supabaseUrl}/rest/v1/rpc/${functionName}`,
      {
        method: 'POST',
        headers: {
          apikey: RSAINN_CALENDAR.publishableKey,
          'Content-Type': 'application/json'
        },
        body: '{}',
        cache: 'no-store'
      }
    );
    if (!response.ok) throw new Error(`Calendar feed error (${response.status})`);
    const result = await response.json();
    if (!Array.isArray(result)) throw new Error('Unexpected calendar response');
    return result;
  }

  // LOAD RATES AND CONFIRMED BOOKED NIGHTS
  async function loadMonth() {
    const requestId = ++requestSequence;
    calendarReady = false;
    rates = new Map();
    blocked = new Set();
    if (notice) notice.textContent = 'Checking live rates and availability…';
    render();

    if (!RSAINN_CALENDAR.enabled) {
      if (notice) notice.textContent = 'Please contact RSAinn to confirm availability.';
      return;
    }

    try {
      const [bookings, rateRows] = await Promise.all([
        publicRpc(RSAINN_CALENDAR.availabilityFunction),
        publicRpc(RSAINN_CALENDAR.ratesFunction)
      ]);
      if (requestId !== requestSequence) return;

      const monthStart = dateKey(view.getFullYear(), view.getMonth(), 1);
      const monthEnd = dateKey(view.getFullYear(), view.getMonth() + 1, 1);
      const nextRates = new Map();
      const nextBlocked = new Set();

      for (const r of rateRows) {
        if (Number(r.property_id) !== RSAINN_CALENDAR.propertyId) continue;
        const date = String(r.rate_date || '').slice(0, 10);
        const price = Number(r.nightly_rate);
        if (date >= monthStart && date < monthEnd && Number.isFinite(price) && price > 0) {
          nextRates.set(date, price);
        }
      }

      for (const b of bookings) {
        if (Number(b.property_id) !== RSAINN_CALENDAR.propertyId) continue;
        const from = String(b.check_in || '').slice(0, 10);
        const until = String(b.check_out || '').slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) continue;
        const first = from > monthStart ? from : monthStart;
        const last = until < monthEnd ? until : monthEnd;
        if (first >= last) continue;
        for (let d = new Date(`${first}T12:00:00`);
             dateKey(d.getFullYear(), d.getMonth(), d.getDate()) < last;
             d.setDate(d.getDate() + 1)) {
          nextBlocked.add(dateKey(d.getFullYear(), d.getMonth(), d.getDate()));
        }
      }

      rates = nextRates;
      blocked = nextBlocked;
      calendarReady = true;
      if (checkIn && !safeRange(checkIn, checkOut || checkIn)) {
        checkIn = null;
        checkOut = null;
        updateSelection();
      }
      if (notice) notice.textContent = 'Rates and availability are indicative and subject to confirmation. Request a quote on WhatsApp.';
    } catch (error) {
      if (requestId !== requestSequence) return;
      console.error('RSAinn public calendar could not load:', error);
      rates = new Map();
      blocked = new Set();
      calendarReady = false;
      if (notice) notice.textContent = 'Live availability is temporarily unavailable. Please contact RSAinn to confirm dates and prices.';
    }
    render();
  }

  // MONTH NAVIGATION
  document.getElementById('prevMonth')
    ?.addEventListener('click', () => {
      view.setMonth(view.getMonth() - 1);
      checkIn = null; checkOut = null; updateSelection();
      loadMonth();
    });

  document.getElementById('nextMonth')
    ?.addEventListener('click', () => {
      view.setMonth(view.getMonth() + 1);
      checkIn = null; checkOut = null; updateSelection();
      loadMonth();
    });

  // CLEAR SELECTED DATES
  document.getElementById('clearDates')
    ?.addEventListener('click', () => {
      checkIn = null;
      checkOut = null;

      updateSelection();
      render();
    });

  updateSelection();
  loadMonth();
}

/* RSAinn Gallery Lightbox Navigation */
(() => {
  const links = [...document.querySelectorAll(
    '.gallery-card[href]'
  )];

  const viewer = document.getElementById('galleryLightbox');
  if (!viewer || !links.length) return;

  const image = document.getElementById('lightboxImage');
  const counter = document.getElementById('lightboxCounter');

  let current = 0;
  let startX = 0;
  let previousFocus = null;

  function show(index) {
    current = (index + links.length) % links.length;
    image.src = links[current].href;
    image.alt = links[current].querySelector('img')?.alt
      || 'RSAinn gallery photo';
    counter.textContent = `${current + 1} / ${links.length}`;
  }

  function close() {
    viewer.hidden = true;
    document.body.style.overflow = '';
    previousFocus?.focus();
  }

  links.forEach((link, index) => {
    link.addEventListener('click', event => {
      event.preventDefault();
      previousFocus = document.activeElement;
      viewer.hidden = false;
      document.body.style.overflow = 'hidden';
      show(index);
      viewer.querySelector('.lightbox-close').focus();
    });
  });

  viewer.querySelector('.lightbox-close')
    .addEventListener('click', close);

  viewer.querySelector('.lightbox-prev')
    .addEventListener('click', () => show(current - 1));

  viewer.querySelector('.lightbox-next')
    .addEventListener('click', () => show(current + 1));

  viewer.addEventListener('click', event => {
    if (event.target === viewer) close();
  });

  document.addEventListener('keydown', event => {
    if (viewer.hidden) return;

    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });

  viewer.addEventListener('touchstart', event => {
    startX = event.changedTouches[0].screenX;
  }, { passive: true });

  viewer.addEventListener('touchend', event => {
    const difference =
      event.changedTouches[0].screenX - startX;

    if (Math.abs(difference) > 50) {
      show(current + (difference < 0 ? 1 : -1));
    }
  }, { passive: true });
})();
