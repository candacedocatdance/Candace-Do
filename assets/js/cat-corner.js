(function () {
  var data = window.CAT_CORNER_DATA || [];
  if (!data.length) return;

  var root = document.getElementById('cat-corner-root');
  var toggleBtn = document.getElementById('cat-corner-toggle');
  if (!root) return;

  var rip = data.filter(function (c) { return c.rip; });
  var alive = data.filter(function (c) { return !c.rip; });

  var FUR_COLORS = ['#E8A23D', '#E88D5D', '#C97B5A', '#D9A441', '#B98356'];

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function esc(str) { return String(str).replace(/"/g, '&quot;'); }

  function buildSprite(cat, kind, index) {
    var holder = document.createElement('div');
    holder.className = 'cat-sprite ' + (kind === 'astro' ? 'kind-astro' : 'kind-runner');
    holder.title = cat.title + ' (click 3 lần để xem hồ sơ)';

    // Vị trí "nhà" của từng bé, offset âm tính từ góc phải-dưới màn hình.
    var hx, hy;
    if (kind === 'astro') {
      hx = -(50 + index * 52 + rand(-8, 8));
      hy = -(170 + (index % 3) * 42 + rand(-10, 10));
    } else {
      hx = -(40 + index * 58 + rand(-8, 8));
      hy = -(36 + rand(0, 16));
    }
    holder.dataset.hx = hx;
    holder.dataset.hy = hy;
    holder.style.transform = 'translate(' + hx + 'px,' + hy + 'px)';

    var wander = document.createElement('div');
    wander.className = kind === 'astro' ? 'cs-wander astro' : 'cs-wander';
    wander.style.setProperty('--wdur', (kind === 'astro' ? rand(3.2, 4.2) : rand(4.2, 5.6)).toFixed(2) + 's');
    wander.style.setProperty('--wdelay', rand(0, 2.5).toFixed(2) + 's');

    var limp = document.createElement('div');
    limp.className = 'cs-limp';

    if (kind === 'astro') {
      limp.innerHTML =
        '<div class="suit">' +
          '<div class="helmet"><img src="' + esc(cat.image) + '" alt="' + esc(cat.title) + '" style="object-position:' + esc(cat.avatarPosition) + '" loading="lazy"></div>' +
          '<div class="body-suit"></div>' +
          '<span class="sparkle s1">✦</span><span class="sparkle s2">✦</span>' +
        '</div>';
    } else {
      var fur = FUR_COLORS[index % FUR_COLORS.length];
      limp.style.setProperty('--fur', fur);
      limp.innerHTML =
        '<div class="cat-runner">' +
          '<div class="cat-tail"></div>' +
          '<div class="cat-body"></div>' +
          '<div class="cat-legs">' +
            '<span class="leg leg1"></span><span class="leg leg2"></span>' +
            '<span class="leg leg3"></span><span class="leg leg4"></span>' +
          '</div>' +
          '<div class="cat-head">' +
            '<span class="ear ear-l"></span><span class="ear ear-r"></span>' +
            '<img class="cat-face" src="' + esc(cat.image) + '" alt="' + esc(cat.title) + '" style="object-position:' + esc(cat.avatarPosition) + '" loading="lazy">' +
          '</div>' +
        '</div>';
    }

    wander.appendChild(limp);
    holder.appendChild(wander);
    attachDrag(holder, limp, cat);
    return holder;
  }

  var spriteEntries = [];
  rip.forEach(function (cat, i) {
    var el = buildSprite(cat, 'astro', i);
    root.appendChild(el);
    spriteEntries.push({ cat: cat, el: el });
  });
  alive.forEach(function (cat, i) {
    var el = buildSprite(cat, 'runner', i);
    root.appendChild(el);
    spriteEntries.push({ cat: cat, el: el });
  });

  function attachDrag(el, limpEl, cat) {
    var dragging = false;
    var startX = 0, startY = 0, baseX = 0, baseY = 0, lastX = 0, lastY = 0;
    var moved = 0;
    var clickCount = 0, clickTimer = null;

    el.addEventListener('pointerdown', function (e) {
      dragging = true;
      moved = 0;
      el.classList.add('dragging');
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      var match = el.style.transform.match(/-?\d+\.?\d*/g) || [0, 0];
      baseX = parseFloat(match[0]) || 0;
      baseY = parseFloat(match[1]) || 0;
    });

    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      moved += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
      lastX = e.clientX;
      lastY = e.clientY;
      el.style.transform = 'translate(' + (baseX + dx) + 'px,' + (baseY + dy) + 'px)';

      // hiệu ứng "sụi lơ" - thân đung đưa theo hướng kéo, như mèo thật bị xách lên
      var swing = clamp(dx * 0.25, -26, 26);
      limpEl.style.transform = 'rotate(' + swing + 'deg)';
    });

    function release() {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      limpEl.style.transform = 'rotate(0deg)';
      // Ép trình duyệt chốt lại trạng thái "hết kéo" trước khi đổi vị trí,
      // nếu không 2 thay đổi sẽ bị gộp làm một và mất hẳn hiệu ứng chuyển động mượt.
      void el.offsetWidth;
      // Bò/bay từ từ về đúng chỗ cũ.
      el.style.transform = 'translate(' + el.dataset.hx + 'px,' + el.dataset.hy + 'px)';
    }

    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);

    // click 3 lần liên tiếp -> đi tới bài viết của bé đó
    el.addEventListener('click', function () {
      if (moved > 8) { moved = 0; return; }
      clickCount++;
      clearTimeout(clickTimer);
      if (clickCount >= 3) {
        clickCount = 0;
        if (cat.url) window.location.href = cat.url;
      } else {
        clickTimer = setTimeout(function () { clickCount = 0; }, 550);
      }
    });
  }

  var GREET_PHRASES = [
    'Tui đó tui đó meooooo~',
    'Đúng chuẩn tui nè, không lộn đâu!',
    'Ngầu chưa, đó là tui á 😼',
    'Ê nhìn kỹ đi, tui nè tui nè!',
    'Chính chủ xuất hiện nè~',
    'Xinh vậy đó, là tui luôn á!',
    'Meooo~ hồ sơ của tui nè!'
  ];

  function throttleRaf(fn) {
    var ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { fn(); ticking = false; });
    };
  }

  function initSelfGreeting() {
    var selfUrl = window.CAT_CORNER_SELF_URL;
    if (!selfUrl) return;

    var entry = null;
    for (var i = 0; i < spriteEntries.length; i++) {
      if (spriteEntries[i].cat.url === selfUrl) { entry = spriteEntries[i]; break; }
    }
    if (!entry) return;

    var avatarEl = document.getElementById('cat-self-avatar');
    if (!avatarEl) return;

    setTimeout(function () { runGreeting(entry, avatarEl); }, 700);
  }

  function runGreeting(entry, avatarEl) {
    var el = entry.el;
    var wanderEl = el.querySelector('.cs-wander');
    var phrase = GREET_PHRASES[Math.floor(Math.random() * GREET_PHRASES.length)];

    el.classList.add('greeting');
    if (wanderEl) wanderEl.style.animationPlayState = 'paused';

    var bubble = document.createElement('div');
    bubble.className = 'cat-speech-bubble';
    bubble.textContent = phrase;
    el.appendChild(bubble);

    var pointer = document.createElement('div');
    pointer.className = 'cat-self-pointer';
    pointer.textContent = '👉';
    document.body.appendChild(pointer);

    var spriteWidth = el.getBoundingClientRect().width || 60;

    function positionNearAvatar() {
      var rect = avatarEl.getBoundingClientRect();

      var desiredRight = Math.min(rect.right + spriteWidth + 14, window.innerWidth - 10);
      var desiredBottom = Math.min(Math.max(rect.bottom - 4, 70), window.innerHeight - 10);
      var tx = desiredRight - window.innerWidth;
      var ty = desiredBottom - window.innerHeight;
      el.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';

      pointer.style.left = (rect.right + 4) + 'px';
      pointer.style.top = (rect.top + rect.height / 2 - 14) + 'px';
    }
    positionNearAvatar();

    var onScroll = throttleRaf(positionNearAvatar);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onScroll);

    setTimeout(function () {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      pointer.remove();
      bubble.classList.add('fade-out');
      setTimeout(function () { bubble.remove(); }, 400);
      el.classList.remove('greeting');
      if (wanderEl) wanderEl.style.animationPlayState = '';
      el.style.transform = 'translate(' + el.dataset.hx + 'px,' + el.dataset.hy + 'px)';
    }, 4800);
  }

  initSelfGreeting();

  if (toggleBtn) {
    var hidden = false;
    try { hidden = localStorage.getItem('cat-corner-hidden') === '1'; } catch (err) {}
    if (hidden) root.classList.add('is-hidden');

    toggleBtn.addEventListener('click', function () {
      root.classList.toggle('is-hidden');
      try {
        localStorage.setItem('cat-corner-hidden', root.classList.contains('is-hidden') ? '1' : '0');
      } catch (err) {}
    });
  }
})();
