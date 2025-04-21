const priceDropdown = document.getElementById('price-dropdown');
const areaDropdown = document.getElementById('area-dropdown');
const showAll = document.getElementById('btn-all');
const bsd = document.getElementById('btn-bsd');
const gs = document.getElementById('btn-gs');
const alsut = document.getElementById('btn-alsut');
const priceContainer = document.getElementById('price-container');
const areaButton = document.getElementById('area-filter-btn');
const priceButton = document.getElementById('price-filter-btn');
const catalogue = document.getElementById('catalogue');
const filters = document.getElementById('filters');
const areaContainer = document.getElementById('area-container');
const banner = document.getElementById('banner');
const typeDropdown = document.getElementById('type-dropdown');
const bannerBottom = banner.offsetTop + banner.offsetHeight - 100;
const typeContainer = document.getElementById('type-container');
const typeButton = document.getElementById('type-filter-btn')
let selectedType = null;

// Data for houses catalogue, with placeholder names/images and price & area ranges
const data = [
  {
    category: "bsd",
    items: [
      {
        title: "Rumah 1",
        description: "Spacious luxury villa.",
        image: "https://via.placeholder.com/300x180/cccccc/000000?text=House+A",
        minPrice: 50,
        maxPrice: 75,
        minArea: 2500,
        maxArea: 3500,
        link: "example1.html",
        type: "house"
      },
      {
        title: "House B",
        description: "Modern design with pool.",
        image: "https://via.placeholder.com/300x180/cccccc/000000?text=House+B",
        minPrice: 65,
        maxPrice: 90,
        minArea: 3000,
        maxArea: 4200,
        link: "example2.html",
        type: "house"
      },
      {
        title: "House C",
        description: "Cozy hillside retreat.",
        image: "https://via.placeholder.com/300x180/cccccc/000000?text=House+C",
        minPrice: 45,
        maxPrice: null,
        minArea: 2200,
        maxArea: null,
        link: "villaC.html",
        type: "house"
      }
    ]
  },
  {
    category: "gs",
    items: [
      {
        title: "Apartment X",
        description: "City-center high-rise.",
        image: "https://via.placeholder.com/300x180/cccccc/000000?text=Apartment+X",
        minPrice: 20,
        maxPrice: 30,
        minArea: 900,
        maxArea: 1200,
        link: "apartmentX.html",
        type: "apartment"
      },
      {
        title: "Apartment Y",
        description: "Cozy studio flat.",
        image: "https://via.placeholder.com/300x180/cccccc/000000?text=Apartment+Y",
        minPrice: 15,
        maxPrice: null,
        minArea: 500,
        maxArea: null,
        link: "apartmentY.html",
        type: "apartment"
      },
      {
        title: "Apartment Z",
        description: "Luxury penthouse.",
        image: "https://via.placeholder.com/300x180/cccccc/000000?text=Apartment+Z",
        minPrice: 80,
        maxPrice: 100,
        minArea: 1800,
        maxArea: 2200,
        link: "apartmentZ.html",
        type: "apartment"
      }
    ]
  },
  {
    category: "alsut",
    items: [
      {
        title: "House 1",
        description: "Family-friendly layout.",
        image: "https://via.placeholder.com/300x180/cccccc/000000?text=House+1",
        minPrice: 30,
        maxPrice: 40,
        minArea: 1500,
        maxArea: 2000,
        link: "townhouse1.html",
        type: "house"
      },
      {
        title: "House 2",
        description: "Recently renovated.",
        image: "https://via.placeholder.com/300x180/cccccc/000000?text=House+2",
        minPrice: 35,
        maxPrice: 45,
        minArea: 1600,
        maxArea: 2100,
        link: "townhouse2.html",
        type: "house"
      },
      {
        title: "House 3",
        description: "Quiet suburban street.",
        image: "https://via.placeholder.com/300x180/cccccc/000000?text=House+3",
        minPrice: 32,
        maxPrice: null,
        minArea: 1400,
        maxArea: null,
        link: "townhouse3.html",
        type: "house"
      }
    ]
  }
];


let currentCategory = 'all';
let searchTerm = '';
let minPrice = null, maxPrice = null;
let minArea = null, maxArea = null;

// Parse free‑text query into text tokens + numeric tokens with units
function parseSearchQuery(query) {
  const tokens = query.match(/\S+/g) || [];
  const texts = [];
  const numbers = [];

  tokens.forEach(tok => {
    // area token e.g. '300m2' or '300 m2'
    const numUnit  = tok.match(/^(\d+(?:\.\d+)?)(m2|m\^2|sqm)$/i);
    // price token e.g. '30M'
    const numPrice = tok.match(/^(\d+(?:\.\d+)?)(M)$/i);
    // plain number e.g. '30'
    const numPlain = tok.match(/^\d+(?:\.\d+)?$/);

    if (numUnit) {
      // convert m² to sqft
      const val = parseFloat(numUnit[1]) * 10.7639;
      numbers.push({ value: val, field: 'area' });
    } else if (numPrice) {
      numbers.push({ value: parseFloat(numPrice[1]), field: 'price' });
    } else if (numPlain) {
      // treat bare numbers as price
      numbers.push({ value: parseFloat(tok), field: 'price' });
    } else {
      texts.push(tok.toLowerCase());
    }
  });

  return { texts, numbers };
}

// Compute relevance score (for sorting)
function computeScore(item, texts, numbers) {
  let score = 0;
  const W = {
    title: 10,        // Highest priority for exact match in the title
    category: 7,      // Category/type next
    type: 7,
    description: 4,
    link: 2
  };

  // Prioritize text matches for the title
  texts.forEach(t => {
    // Check for partial or full match in the title
    if (item.title.toLowerCase().includes(t)) {
      score += W.title;  // Add high score for title matches
    }

    // Category and Type matching
    if (item.category.toLowerCase().includes(t)) {
      score += W.category;
    }
    if ((item.type || '').toLowerCase().includes(t)) {
      score += W.type;
    }

    // Description match
    if (item.description.toLowerCase().includes(t)) {
      score += W.description;
    }

    // Link match
    if (item.link.toLowerCase().includes(t)) {
      score += W.link;
    }
  });

  // Price and area number matching (for numeric filters)
  numbers.forEach(({ value, field }) => {
    const pMin = item.minPrice, pMax = item.maxPrice ?? item.minPrice;
    const aMin = item.minArea, aMax = item.maxArea ?? item.minArea;

    if (field === 'price' && value >= pMin && value <= pMax) {
      score += 3;  // Price matching gets a slightly lower priority
    }
    if (field === 'area' && value >= aMin && value <= aMax) {
      score += 2;  // Area matching has the least priority in this setup
    }
  });

  return score;
}

// Render catalogue with all filters applied
function renderCatalogue() {
  catalogue.innerHTML = '';
  let items = [];

  // Category filter (attach category property)
  if (currentCategory === 'all') {
    data.forEach(sec => {
      items = items.concat(
        sec.items.map(item => ({ ...item, category: sec.category }))
      );
    });
  } else {
    const sec = data.find(s => s.category === currentCategory);
    if (sec) {
      items = sec.items.map(item => ({ ...item, category: sec.category }));
    }
  }
  if (selectedType&& selectedType !== 'all') {
    items = items.filter(item => (item.type || '').toLowerCase() === selectedType.toLowerCase());
  }
  // Multi‑field Google‑like AND‑search + original filtering logic
  let tokens = [];
  if (searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    tokens = term.split(/\s+/);
    items = items.filter(item => {
      const texts = tokens.filter(t => isNaN(parseFloat(t)));
      const numbers = tokens
        .map(t => parseFloat(t))
        .filter(n => !isNaN(n));

      const itemFields = [
        item.title.toLowerCase(),
        item.description.toLowerCase(),
        item.category.toLowerCase(),
        item.link.toLowerCase()
      ];

      const textOk = texts.every(t =>
        itemFields.some(field => field.includes(t))
      );

      const numberOk = numbers.every(num => {
        const inPriceRange = (
          item.minPrice <= num && (item.maxPrice ?? item.minPrice) >= num
        );
        const inAreaRange = (
          item.minArea <= num && (item.maxArea ?? item.minArea) >= num
        );
        return inPriceRange || inAreaRange;
      });

      return textOk && numberOk;
    });

    // Custom sorting by priority (only changes order, not filtering)
    items.forEach(item => {
      let score = 0;
      const title = item.title.toLowerCase();
      const desc = item.description.toLowerCase();
      const category = item.category.toLowerCase();
      const type = item.type?.toLowerCase?.() ?? '';
      const link = item.link.toLowerCase();

      tokens.forEach(t => {
        if (title === t) score += 50;
        else if (title.includes(t)) score += 40;
        if (category.includes(t)) score += 30;
        if (type.includes(t)) score += 30;
        if (desc.includes(t)) score += 20;
        if (link.includes(t)) score += 10;
      });

      item._score = score;
    });

    items.sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
  }

  // Price filters
  if (minPrice !== null || maxPrice !== null) {
    items = items.filter(i => {
      const itemMin = i.minPrice;
      const itemMax = i.maxPrice != null ? i.maxPrice : i.minPrice;
      const fMin = minPrice != null ? minPrice : -Infinity;
      const fMax = maxPrice != null ? maxPrice : Infinity;
      return itemMax >= fMin && itemMin <= fMax;
    });
  }

  // Area filters
  if (minArea !== null || maxArea !== null) {
    items = items.filter(i => {
      const itemMin = i.minArea;
      const itemMax = i.maxArea != null ? i.maxArea : i.minArea;
      const fMin = minArea != null ? minArea : -Infinity;
      const fMax = maxArea != null ? maxArea : Infinity;
      return itemMax >= fMin && itemMin <= fMax;
    });
  }

  // Final fallback alphabetical sort (only if no search term)
  if (!searchTerm) {
    items.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Render cards
  items.forEach(item => {
    const link = document.createElement("a");
    link.className = "card";
    link.href = item.link;
    link.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div class="card-body">
        <div class="card-title">${item.title}</div>
        <div class="card-desc">${item.description}</div>
        <div class="card-price">
          Rp. ${item.minPrice}M${item.maxPrice ? ` - Rp. ${item.maxPrice}M` : ''}
        </div>
        <div class="card-area">
          ${item.minArea} sqft${item.maxArea ? ` - ${item.maxArea} sqft` : ''}
        </div>
      </div>
    `;
    catalogue.appendChild(link);
  });
}


// Category buttons
function filterCategory(category) {
  currentCategory = category;
  updateActiveButton();
  renderCatalogue();
  updateClearButton();
}
function selectType(type) {
  selectedType = type;
  typeDropdown.classList.remove('show');
  renderCatalogue();
  if (window.innerWidth <= 768) {
    showAll.classList.remove('hide');
    bsd.classList.remove('hide');
    gs.classList.remove('hide');
    alsut.classList.remove('hide');
    areaContainer.style.display = 'block';
    priceContainer.style.display = 'block';
    typeButton.innerHTML = '🔽 type';
    catalogue.style.marginTop = window.scrollY > bannerBottom ? "120px" : "0";
  }
  filters.scrollLeft = filters.scrollWidth;
}

// Highlight active category
function updateActiveButton() {
  document.querySelectorAll('.filters button').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`button[onclick="filterCategory('${currentCategory}')"]`)
          ?.classList.add('active');
}

// Show/hide the clear-search button
function updateClearButton() {
  const btn = document.getElementById('clear-search');
  btn.style.display = searchTerm.length ? 'block' : 'none';
}

// Search handlers
function searchItems() {
  searchTerm = document.getElementById("search").value;
  const scrollTarget = banner.offsetHeight ;
    window.scrollTo({
      top: scrollTarget,
      behavior: 'smooth'
    });
  updateClearButton();
  renderCatalogue();
}
function clearSearch() {
  document.getElementById('search').value = '';
  searchTerm = '';
  updateClearButton();
  renderCatalogue();
}

// Price dropdown toggle and handlers
function togglePriceDropdown() {
  areaDropdown.classList.remove('show');
  typeDropdown.classList.remove('show')
  priceDropdown.classList.toggle('show');
  if (window.innerWidth <= 768) {
    showAll.classList.toggle('hide');
    bsd.classList.toggle('hide');
    gs.classList.toggle('hide');
    alsut.classList.toggle('hide');
    if (areaContainer.style.display === 'block' || areaContainer.style.display === '') {
      priceButton.innerHTML = 'X';
      areaContainer.style.display = 'none';
      typeContainer.style.display = 'none';
      filters.scrollIntoView({ behavior: 'smooth', block: 'start' });
      catalogue.style.marginTop = "300px";
    } else {
      areaContainer.style.display = 'block';
      typeContainer.style.display = 'block';
      priceButton.innerHTML = '🔽 Price';
      catalogue.style.marginTop = window.scrollY > bannerBottom ? "120px" : "0";
    }
    filters.scrollLeft = filters.scrollWidth;
  }
}

function applyPriceFilter() {
  const min = parseFloat(document.getElementById('min-price').value);
  const max = parseFloat(document.getElementById('max-price').value);
  minPrice = isNaN(min) ? null : min;
  maxPrice = isNaN(max) ? null : max;
  renderCatalogue();
}
function clearPriceFilter() {
  document.getElementById('min-price').value = '';
  document.getElementById('max-price').value = '';
  minPrice = null;
  maxPrice = null;
  priceDropdown.classList.remove('show');
  renderCatalogue();
  if (window.innerWidth <= 768) {
    showAll.classList.remove('hide');
    bsd.classList.remove('hide');
    gs.classList.remove('hide');
    alsut.classList.remove('hide');
    areaContainer.style.display = 'block';
    typeContainer.style.display = 'block';
    priceButton.innerHTML = '🔽 Price';
    catalogue.style.marginTop = window.scrollY > bannerBottom ? "120px" : "0";
  }
  filters.scrollLeft = filters.scrollWidth;
}

// Area dropdown toggle and handlers
function toggleAreaDropdown() {
  priceDropdown.classList.remove('show');
  typeDropdown.classList.remove('show');
  areaDropdown.classList.toggle('show');
  if (window.innerWidth <= 768) {
    showAll.classList.toggle('hide');
    bsd.classList.toggle('hide');
    gs.classList.toggle('hide');
    alsut.classList.toggle('hide');
    if (priceContainer.style.display === 'block' || priceContainer.style.display === '') {
      areaButton.innerHTML = 'X';
      priceContainer.style.display = 'none';
      typeContainer.style.display = 'none';
      filters.scrollIntoView({ behavior: 'smooth', block: 'start' });
      catalogue.style.marginTop = "300px";
    } else {
      priceContainer.style.display = 'block';
      typeContainer.style.display = 'block';
      areaButton.innerHTML = '🔽 Area';
      catalogue.style.marginTop = window.scrollY > bannerBottom ? "120px" : "0";
    }
    filters.scrollLeft = filters.scrollWidth;
  }
}

function applyAreaFilter() {
  const min = parseFloat(document.getElementById('min-area').value);
  const max = parseFloat(document.getElementById('max-area').value);
  minArea = isNaN(min) ? null : min;
  maxArea = isNaN(max) ? null : max;
  renderCatalogue();
}
function clearAreaFilter() {
  document.getElementById('min-area').value = '';
  document.getElementById('max-area').value = '';
  minArea = null;
  maxArea = null;
  areaDropdown.classList.remove('show');
  renderCatalogue();
  if (window.innerWidth <= 768) {
    showAll.classList.remove('hide');
    bsd.classList.remove('hide');
    gs.classList.remove('hide');
    alsut.classList.remove('hide');
    priceContainer.style.display = 'block';
    typeContainer.style.display = 'block';
    areaButton.innerHTML = '🔽 Area';
    catalogue.style.marginTop = window.scrollY > bannerBottom ? "120px" : "0";
  }
  filters.scrollLeft = filters.scrollWidth;
}

function toggleTypeDropdown() {
  typeDropdown.classList.toggle('show');
  areaDropdown.classList.remove('show');
  priceDropdown.classList.remove('show');
  if (window.innerWidth <= 768) {
    showAll.classList.toggle('hide');
    bsd.classList.toggle('hide');
    gs.classList.toggle('hide');
    alsut.classList.toggle('hide');
    if (areaContainer.style.display === 'block' || areaContainer.style.display === '') {
      typeButton.innerHTML = 'X';
      areaContainer.style.display = 'none';
      priceContainer.style.display = 'none';
      filters.scrollIntoView({ behavior: 'smooth', block: 'start' });
      catalogue.style.marginTop = "300px";
    } else {
      areaContainer.style.display = 'block';
      priceContainer.style.display = 'block';
      typeButton.innerHTML = '🔽 type';
      catalogue.style.marginTop = window.scrollY > bannerBottom ? "120px" : "0";
    }
    filters.scrollLeft = filters.scrollWidth;
  }
}
// Sticky header/filters on scroll
window.addEventListener("scroll", function () {
  const searchBar = document.getElementById("search-bar");
  const filters = document.getElementById("filters");
  const catalogue = document.getElementById("catalogue");
  const searchBottom = searchBar.offsetTop + searchBar.offsetHeight;
  const priceDropdown = document.getElementById('price-dropdown');
  const areaDropdown = document.getElementById('area-dropdown');

  if (window.scrollY > searchBottom) {
    searchBar.classList.add("fixed");
  } else {
    searchBar.classList.remove("fixed");
  }

  if (window.scrollY > bannerBottom) {
    if (priceDropdown.classList.contains('show') || areaDropdown.classList.contains('show') || typeDropdown.classList.contains('show')) {
      catalogue.style.marginTop = "300px";
    } else {
      catalogue.style.marginTop = "120px";
    }
    filters.classList.add("fixed");
    searchBar.classList.add("fill");
  } else {
    catalogue.style.marginTop = "0";
    filters.classList.remove("fixed");
    searchBar.classList.remove("fill");
  }
});

// Initial setup
updateActiveButton();
renderCatalogue();
updateClearButton();
