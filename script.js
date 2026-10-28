
// RSAinn V3.2 — Calendar Development
// Live integration DISABLED pending security verification.

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
  enabled: false, // DO NOT CHANGE YET

  supabaseUrl: 'https://xhxwjaobubxbretiqwsr.supabase.co',

  publishableKey:
    'sb_publishable_dN3KP37RRjRY-_0SFCYPkA_lsszaNoH',

  propertyId: 1,

  ratesTable: 'website_rates',
  availabilityTable: 'website_availability'
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
        rates.has(key) &&
        !booked;

      button.className =
        `cal-day ${
          !RSAINN_CALENDAR.enabled
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
        !RSAINN_CALENDAR.enabled
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

      if (key === checkIn || key === checkOut) {
        button.classList.add('selected');
      }

      grid.append(button);
    }
  }

  // LOAD AVAILABILITY
  async function loadMonth() {
    rates = new Map();
    blocked = new Set();

    if (!RSAINN_CALENDAR.enabled) {
      if (notice) {
        notice.textContent =
          'Availability sync is not yet configured. Dates and rates are hidden to avoid misleading guests. Please contact RSAinn to check dates.';
      }

      render();
      return;
    }

    // Future verified public read-only feed goes here.
    // No requests to private booking/customer tables.

    if (notice) {
      notice.textContent =
        'Calendar feed requires verification. Please contact RSAinn to confirm dates.';
    }

    render();
  }

  // MONTH NAVIGATION
  document.getElementById('prevMonth')
    ?.addEventListener('click', () => {
      view.setMonth(view.getMonth() - 1);
      loadMonth();
    });

  document.getElementById('nextMonth')
    ?.addEventListener('click', () => {
      view.setMonth(view.getMonth() + 1);
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
