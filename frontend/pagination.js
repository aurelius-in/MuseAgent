export function paginate(items, page=1, perPage=8){
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * perPage;
  const end = start + perPage;
  return { page: p, pages, total, slice: items.slice(start, end) };
}

export function renderPager(container, state, onPage){
  if (!container) return;
  const buttons = [];
  if (state.page > 1) buttons.push(`<button data-p="${state.page-1}">Prev</button>`);
  buttons.push(`<span class="muted">Page ${state.page} / ${state.pages}</span>`);
  if (state.page < state.pages) buttons.push(`<button data-p="${state.page+1}">Next</button>`);
  container.innerHTML = buttons.join(' ');
  container.querySelectorAll('button').forEach(b => b.addEventListener('click', (e)=>{
    const p = Number(e.currentTarget.getAttribute('data-p'));
    onPage(p);
  }));
}


