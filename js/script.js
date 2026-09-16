// ---------- effet machine à écrire (déclenché à l'apparition à l'écran) ----------
function runTypewriter(el) {
  const cursor = el.querySelector('.cursor');
  const fullText = el.getAttribute('data-type-text') || '';
  const speed = 90; // ms entre chaque caractère

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Retire le texte statique déjà présent dans le HTML (garde le curseur)
  Array.from(el.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) el.removeChild(node);
  });

  if (reduceMotion) {
    el.insertBefore(document.createTextNode(fullText), cursor || null);
    return;
  }

  let i = 0;
  const textNode = document.createTextNode('');
  el.insertBefore(textNode, cursor || null);

  (function typeChar() {
    if (i <= fullText.length) {
      textNode.textContent = fullText.slice(0, i);
      i++;
      setTimeout(typeChar, speed);
    }
  })();
}

function initTypewriters() {
  const elements = document.querySelectorAll('.typewriter[data-type-text]');
  if (elements.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    // Navigateur trop ancien : on affiche directement, sans animation au scroll.
    elements.forEach(runTypewriter);
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      runTypewriter(entry.target);
      obs.unobserve(entry.target); // ne se déclenche qu'une fois par élément
    });
  }, { threshold: 0.4 });

  elements.forEach(el => observer.observe(el));
}

initTypewriters();

// ---------- remplissage animé des niveaux de compétences ----------
// Se déclenche au chargement si la barre est déjà visible à l'écran,
// et sinon dès qu'elle entre dans le champ de vision au scroll.
function animateSkillLevels() {
  const bars = document.querySelectorAll('.skill .lvl i[data-level]');
  if (bars.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    // Navigateur trop ancien : on remplit directement, sans animation au scroll.
    bars.forEach(bar => { bar.style.width = bar.getAttribute('data-level') + '%'; });
    return;
  }

  const barList = Array.from(bars);

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const bar = entry.target;
      const level = bar.getAttribute('data-level');
      const index = barList.indexOf(bar);
      // petit décalage entre chaque barre pour un effet de chargement séquentiel
      setTimeout(() => {
        bar.style.width = level + '%';
      }, (index % 8) * 60);
      obs.unobserve(bar); // ne se déclenche qu'une fois par barre
    });
  }, { threshold: 0.3, rootMargin: '0px 0px -40px 0px' });

  barList.forEach(bar => observer.observe(bar));
}

animateSkillLevels();

// ---------- révélation répétée au scroll (cartes projets, blocs SISR) ----------
// À chaque nouvelle entrée dans le champ de vision, l'animation est rejouée.
// On retire la classe à la sortie pour que l'élément puisse repartir de zéro.
function initCascadeReveal(containerSelector, itemSelector, staggerMs) {
  const containers = document.querySelectorAll(containerSelector);
  if (containers.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll(itemSelector).forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const items = entry.target.querySelectorAll(itemSelector);

      if (!entry.isIntersecting) {
        items.forEach(item => item.classList.remove('is-visible'));
        return;
      }

      // Repart de l'état initial à chaque entrée dans l'écran.
      items.forEach((item, i) => {
        item.classList.remove('is-visible');
        setTimeout(() => item.classList.add('is-visible'), i * staggerMs);
      });
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

  containers.forEach(c => observer.observe(c));
}

initCascadeReveal('.cards', '.card', 90);       // cascade projets 1A / 2A
initCascadeReveal('.sisr-list', '.sisr-item', 90); // apparition façon "ls -la" des blocs SISR

// ---------- effet de déchiffrement des titres de section ----------
// Le texte apparaît d'abord sous forme de caractères aléatoires, puis se
// "déchiffre" caractère par caractère de gauche à droite jusqu'au vrai mot.
const DECRYPT_CHARS = "!<>-_\\/[]{}=+*^?#01ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function runDecryptEffect(el) {
  const finalText = el.getAttribute('data-decrypt-text') || el.textContent;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    el.textContent = finalText;
    return;
  }

  const length = finalText.length;
  const framesPerChar = 3;   // vitesse de déchiffrement (plus petit = plus rapide)
  const lockDelay = 8;       // nombre de frames de "brouillage" avant de figer un caractère
  const totalFrames = length * framesPerChar + lockDelay;
  let frame = 0;

  function tick() {
    let output = "";
    for (let i = 0; i < length; i++) {
      const lockFrame = i * framesPerChar + lockDelay;
      if (finalText[i] === " ") {
        output += " ";
      } else if (frame >= lockFrame) {
        output += finalText[i];
      } else {
        output += DECRYPT_CHARS[Math.floor(Math.random() * DECRYPT_CHARS.length)];
      }
    }
    el.textContent = output;
    frame++;

    if (frame <= totalFrames) {
      setTimeout(tick, 28);
    } else {
      el.textContent = finalText; // garantit le texte exact à la fin
    }
  }

  tick();
}

function initDecryptTitles() {
  const elements = document.querySelectorAll('.decrypt-text[data-decrypt-text]');
  if (elements.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach(runDecryptEffect);
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      runDecryptEffect(entry.target);
      obs.unobserve(entry.target); // ne se déchiffre qu'une fois
    });
  }, { threshold: 0.4 });

  elements.forEach(el => observer.observe(el));
}

initDecryptTitles();

// ---------- menu déroulant ----------
  const menuBtn = document.getElementById('menuBtn');
  const dropdown = document.getElementById('dropdownMenu');

  menuBtn.addEventListener('click', () => {
    const isOpen = dropdown.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', isOpen);

    // À chaque ouverture du menu, relance le déchiffrement uniquement sur
    // les titres de section actuellement visibles dans la fenêtre.
    if (isOpen) {
      document.querySelectorAll('.decrypt-text[data-decrypt-text]').forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
        if (isVisible) runDecryptEffect(el);
      });
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-wrap')) {
      dropdown.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  dropdown.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      dropdown.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // ---------- formulaire de contact ----------
  // Adresse de destination : remplace-la par ta vraie adresse email.
  const CONTACT_EMAIL = "ton-adresse@exemple.com";

  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nom = document.getElementById('nom').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();

      const subject = encodeURIComponent(`Contact portfolio — ${nom}`);
      const body = encodeURIComponent(`Nom : ${nom}\nEmail : ${email}\n\n${message}`);

      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      status.textContent = "> ouverture de ton client mail...";
    });
  }

  // ---------- flux RSS — veille PQC ----------
  // Sources de veille : ANSSI (CERT-FR), Cloudflare, NIST, IBM.
  // Flux généralistes filtrés par mots-clés PQC ci-dessous (voir PQC_KEYWORDS).
  const RSS_FEEDS = [
    // Le flux natif cert.ssi.gouv.fr/feed/ renvoie une erreur 404 depuis la refonte
    // du site ANSSI (fin 2025) : on passe par Google Actualités, filtré sur leurs domaines.
    { url: "https://news.google.com/rss/search?q=(post-quantique+OR+%22cryptographie+post-quantique%22)+(site:cyber.gouv.fr+OR+site:cert.ssi.gouv.fr)&hl=fr&gl=FR&ceid=FR:fr", label: "ANSSI" },
    { url: "https://blog.cloudflare.com/tag/post-quantum/rss", label: "Cloudflare" },
    { url: "https://www.nist.gov/news-events/cybersecurity/rss.xml", label: "NIST / CSRC" },
    { url: "https://news.google.com/rss/search?q=%22post-quantum%22+site:ibm.com&hl=fr&gl=FR&ceid=FR:fr", label: "IBM" },
  ];

  // Mots-clés utilisés pour ne garder que les articles liés à la veille PQC
  // (utile pour les flux généralistes comme celui du CERT-FR ou de NIST).
  const PQC_KEYWORDS = [
    "post-quantum", "post quantum", "postquantum", "quantum-safe", "quantum safe",
    "quantique", "pqc", "kyber", "dilithium", "ml-kem", "ml-dsa", "slh-dsa",
    "crystals", "sphincs", "cryptographie", "cryptography", "chiffrement",
    "lattice", "harvest now", "algorithme quantique", "quantum computer", "ordinateur quantique"
  ];


  async function loadRSS() {
    const container = document.getElementById('rssContainer');
    if (!container || RSS_FEEDS.length === 0) return;

    container.innerHTML = '<div class="rss-loading">$ chargement des flux...</div>';
    let allItems = [];

    for (const feed of RSS_FEEDS) {
      try {
        const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
        const res = await fetch(api);
        const data = await res.json();
        if (data.items) {
          allItems = allItems.concat(
            data.items.map(item => ({
              title: item.title,
              link: item.link,
              date: item.pubDate,
              source: feed.label
            }))
          );
        }
      } catch (err) {
        console.error('Erreur flux RSS :', feed.url, err);
      }
    }

    // Ne garder que les articles en lien avec la veille PQC
    const filtered = allItems.filter(item => {
      const haystack = (item.title || '').toLowerCase();
      return PQC_KEYWORDS.some(kw => haystack.includes(kw));
    });

    const finalItems = filtered.length > 0 ? filtered : allItems;

    if (finalItems.length === 0) {
      container.innerHTML = '<div class="rss-loading">$ aucun article récupéré — le service de conversion RSS (rss2json.com) est peut-être temporairement limité. Réessaie dans quelques minutes ou recharge la page.</div>';
      return;
    }

    finalItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    const toShow = finalItems.slice(0, 10);

    container.innerHTML = toShow.map((item, i) => `
      <div class="rss-item" style="--rss-delay:${i * 120}ms">
        <div class="rss-date">${item.date ? new Date(item.date).toLocaleDateString('fr-FR') : ''}</div>
        <div class="rss-title"><a href="${item.link}" target="_blank" rel="noopener">${item.title}</a></div>
        <div class="rss-source">${item.source}</div>
      </div>
    `).join('');
  }

  // Rejoue l'animation des articles RSS à chaque nouvelle apparition du bloc.
  function initRSSReveal() {
    const container = document.getElementById('rssContainer');
    if (!container || !('IntersectionObserver' in window)) return;

    let wasVisible = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !wasVisible) {
          const items = container.querySelectorAll('.rss-item');
          items.forEach(item => {
            item.classList.remove('rss-animate');
            // Force le navigateur à recalculer le style afin de pouvoir rejouer l'animation.
            void item.offsetWidth;
            item.classList.add('rss-animate');
          });
          wasVisible = true;
        } else if (!entry.isIntersecting) {
          wasVisible = false;
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

    observer.observe(container);
  }

  initRSSReveal();
  loadRSS();
