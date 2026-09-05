/** Keep the native project index in sync with the reading position. */
export function mountWorkIndex(root, Observer = IntersectionObserver, navigate = null) {
  const scenes = [...root.querySelectorAll('[data-work-project]')];
  const links = [...root.querySelectorAll('[data-work-index]')];
  const count = root.querySelector('[data-work-count]');
  const visible = new Set();
  let disposed = false;

  function select(scene) {
    if (disposed) return;
    const index = scenes.indexOf(scene);
    if (index < 0) return;
    links.forEach(link => {
      if (link.getAttribute('href') === `#${scene.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (count) count.textContent = String(index + 1).padStart(2, '0');
  }

  const observer = new Observer(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    const current = [...visible].sort((a, b) => (
      Math.abs(a.getBoundingClientRect().top) - Math.abs(b.getBoundingClientRect().top)
    ))[0];
    if (current) select(current);
  }, { rootMargin: '-20% 0px -40% 0px', threshold: 0 });

  function onFocus(event) {
    const scene = event.target.closest?.('[data-work-project]');
    if (scene) select(scene);
  }

  function onClick(event) {
    if (!navigate || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('[data-work-index]');
    if (!links.includes(link)) return;
    const scene = scenes.find(item => `#${item.id}` === link.getAttribute('href'));
    if (!scene) return;
    // Handle this anchor before the router and the page-wide smooth-scroll listener.
    event.preventDefault();
    event.stopPropagation();
    navigate(scene);
  }

  scenes.forEach(scene => observer.observe(scene));
  select(scenes[0]);
  root.addEventListener('focusin', onFocus);
  root.addEventListener('click', onClick);

  return () => {
    disposed = true;
    observer.disconnect();
    visible.clear();
    root.removeEventListener('focusin', onFocus);
    root.removeEventListener('click', onClick);
    links.forEach(link => link.removeAttribute('aria-current'));
  };
}
