// app.js
document.addEventListener('DOMContentLoaded', async () => {
    // Load JSON data from <script>
    const raw = document.getElementById('page-data').textContent;
    const pageData = JSON.parse(raw);
    const sections = pageData.sections || {};
    const keys = Object.keys(sections);
  
    const content = document.getElementById('content');
  
    // Load external template.html
    const html = await fetch('template.html').then(r => r.text());
    const tplDoc = new DOMParser().parseFromString(html, 'text/html');
    const tpl = tplDoc.getElementById('page-template');
  
    function renderSection(key) {
      const data = sections[key];
      const clone = tpl.content.cloneNode(true);
  
      // title & description
      clone.querySelector('.page-title').textContent = data.title;
      clone.querySelector('.page-description').textContent = data.description;
  
      // carousel images
      const slides = clone.querySelector('.carousel-slides');
      slides.innerHTML = '';
      data.images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        slides.appendChild(img);
      });
  
      // prev/next buttons
      let idx = 0;
      const total = data.images.length;
      const prevBtn = clone.querySelector('.prev');
      const nextBtn = clone.querySelector('.next');
  
      const update = () => {
        slides.style.transform = `translateX(${-idx * 100}%)`;
        prevBtn.style.visibility = idx === 0 ? 'hidden' : 'visible';
        nextBtn.style.visibility = idx === total - 1 ? 'hidden' : 'visible';
      };
  
      prevBtn.onclick = () => {
        if (idx > 0) {
          idx--;
          update();
        }
      };
      nextBtn.onclick = () => {
        if (idx < total - 1) {
          idx++;
          update();
        }
      };
  
      // dropdown
      const select = clone.querySelector('#section-select');
      select.innerHTML = '';
      keys.forEach(k => {
        const o = document.createElement('option');
        o.value = k;
        o.textContent = sections[k].title;
        if (k === key) o.selected = true;
        select.appendChild(o);
      });
      select.onchange = () => renderSection(select.value);
  
      // inject
      content.innerHTML = '';
      content.appendChild(clone);
      update();
    }
  
    // Kick off with the first section
    if (keys.length) renderSection(keys[0]);
  });
  