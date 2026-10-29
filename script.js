const menu=document.querySelector('.menu');const nav=document.querySelector('#nav');menu.addEventListener('click',()=>{const opened=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(opened))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));document.getElementById('year').textContent=new Date().getFullYear();


// Availability is intentionally disabled until a verified public, read-only feed is configured.
// Do not expose Supabase service-role keys or private booking/customer tables.
const grid=document.getElementById('calendarGrid');
if(grid){let view=new Date();view=new Date(view.getFullYear(),view.getMonth(),1);const title=document.getElementById('monthTitle');const pad=n=>String(n).padStart(2,'0');function render(){title.textContent=view.toLocaleDateString('en-ZA',{month:'long',year:'numeric'});grid.innerHTML='';const offset=(view.getDay()+6)%7;for(let i=0;i<offset;i++){const blank=document.createElement('span');blank.className='cal-day blank';grid.append(blank)}const days=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();for(let n=1;n<=days;n++){const b=document.createElement('button');b.className='cal-day is-unavailable';b.disabled=true;b.innerHTML='<span class="date">'+n+'</span><span class="rate">Enquire</span>';b.title='Live availability pending';grid.append(b)}}document.getElementById('prevMonth').addEventListener('click',()=>{view.setMonth(view.getMonth()-1);render()});document.getElementById('nextMonth').addEventListener('click',()=>{view.setMonth(view.getMonth()+1);render()});document.getElementById('clearDates').addEventListener('click',()=>render());document.getElementById('selectionSummary').textContent='Contact RSAinn to confirm your preferred dates.';render();}


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
