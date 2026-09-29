document.getElementById('year').textContent = new Date().getFullYear();
// Navigation is fully functional without JavaScript. This only highlights the visible section.
if ('IntersectionObserver' in window) {
  const links = [...document.querySelectorAll('nav a')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        const active = link.getAttribute('href') === '#' + entry.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
}

// Progressive enhancement: every section remains visible without JavaScript.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const running = new Set();
  const ease = 'cubic-bezier(.22,1,.36,1)';
  function animate(element, frames, options = {}) {
    if (reduced.matches || !element || !element.animate) return;
    const animation = element.animate(frames, {duration: 850, easing: ease, ...options});
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
    return animation;
  }

  // A short, staggered opening sequence; never delays access to links.
  document.querySelectorAll('.hero-copy > *').forEach((element, index) => {
    animate(element, [{opacity: 0, transform: 'translateY(22px)'}, {opacity: 1, transform: 'translateY(0)'}],
      {delay: index * 85, fill: 'backwards', duration: 950});
  });
  animate(document.querySelector('.hero-art'),
    [{opacity: 0, transform: 'translateY(28px) scale(.97)'}, {opacity: 1, transform: 'translateY(0) scale(1)'}],
    {delay: 160, fill: 'backwards', duration: 1150});

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(({target, isIntersecting}) => {
        if (!isIntersecting) return;
        reveal.unobserve(target);
        // Do not move a control while a keyboard user is interacting with it.
        if (target.contains(document.activeElement)) return;
        animate(target, [{opacity: .25, transform: 'translateY(25px)'}, {opacity: 1, transform: 'translateY(0)'}]);
        target.querySelectorAll('.chart-fill').forEach((bar, i) => {
          animate(bar, [{transform:'scaleX(0)'}, {transform:'scaleX(1)'}], {delay: 160 + i * 130, duration: 1000, fill: 'backwards'});
        });
      });
    }, {threshold: .08});
    document.querySelectorAll('.metrics > div, .section-heading, .work-card, .academic, .role, .about-layout > div, .skills > div, .contact')
      .forEach(element => reveal.observe(element));
  }

  // Native disclosure behavior is preserved for touch, keyboard and screen readers.
  document.querySelectorAll('details').forEach(details => {
    details.addEventListener('toggle', () => {
      if (details.open) animate(details.querySelector('.detail-body'),
        [{opacity: 0, transform: 'translateY(-6px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 350});
    });
  });

  const artwork = document.querySelector('.hero-art');
  let pointerFrame = 0;
  function resetArtwork() {
    cancelAnimationFrame(pointerFrame);
    if (artwork) { artwork.style.setProperty('--art-x','0deg'); artwork.style.setProperty('--art-y','0deg'); }
  }
  if (artwork) {
    artwork.addEventListener('pointermove', event => {
      if (reduced.matches || !finePointer.matches || event.pointerType === 'touch') return;
      const box = artwork.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
      cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        artwork.style.setProperty('--art-x',`${-y * 2.5}deg`);
        artwork.style.setProperty('--art-y',`${x * 3}deg`);
      });
    });
    artwork.addEventListener('pointerleave', resetArtwork);
  }

  // Reading progress uses one scheduled update per frame, without scroll interception.
  let scrollFrame = 0;
  const updateProgress = () => {
    scrollFrame = 0;
    const total = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--reading-progress', total > 0 ? Math.min(1, Math.max(0, scrollY / total)) : 0);
  };
  const queueProgress = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateProgress); };
  addEventListener('scroll', queueProgress, {passive:true});
  addEventListener('resize', queueProgress);
  updateProgress();
  reduced.addEventListener('change', () => {
    if (reduced.matches) { running.forEach(animation => animation.cancel()); resetArtwork(); }
  });
  finePointer.addEventListener('change', resetArtwork);
})();

// Optional chapter transition; the ordinary anchor remains the fallback.
(() => {
 const link = document.querySelector('.landing .primary');
 const target = document.getElementById('work');
 let busy = false;
 link.addEventListener('click', async event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0 || matchMedia('(prefers-reduced-motion: reduce)').matches || !Element.prototype.animate) return;
  event.preventDefault(); if (busy) return; busy = true;
  const curtain = document.createElement('div'); curtain.className = 'page-curtain'; curtain.setAttribute('aria-hidden','true'); curtain.textContent = 'From friction to forward.'; document.body.append(curtain);
  try {
   await curtain.animate([{transform:'translateY(100%)'},{transform:'translateY(0)'}],{duration:380,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'}).finished;
   const header = document.querySelector('.site-header').getBoundingClientRect().height;
   window.scrollTo({top:target.getBoundingClientRect().top + window.scrollY - header - 20,behavior:'instant'});
   history.replaceState(null,'','#work'); target.focus({preventScroll:true});
   await curtain.animate([{transform:'translateY(0)'},{transform:'translateY(-100%)'}],{duration:460,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'}).finished;
  } finally { curtain.remove(); busy = false; }
 });
})();

// The background is a scroll-controlled frame sequence, never an autoplaying player.
(() => {
 const video=document.querySelector('.flow-video');
 video.muted=true;
 video.pause();
 let frame=0;
 let desired=0;
 const seek=()=>{
  if(!Number.isFinite(video.duration) || video.readyState<1 || video.seeking)return;
  if(Math.abs(video.currentTime-desired)>.025)video.currentTime=desired;
 };
 const update=()=>{
  frame=0;
  const distance=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  const progress=Math.max(0,Math.min(1,scrollY/distance));
  if(Number.isFinite(video.duration))desired=.03+progress*Math.max(0,video.duration-.08);
  seek();
 };
 const queue=()=>{if(!frame)frame=requestAnimationFrame(update)};
 video.addEventListener('loadedmetadata',queue);
 video.addEventListener('loadeddata',queue);
 video.addEventListener('seeked',seek);
 addEventListener('scroll',queue,{passive:true});
 addEventListener('resize',queue);
 addEventListener('load',queue);
 if('ResizeObserver' in window)new ResizeObserver(queue).observe(document.querySelector('main'));
 update();
})();
