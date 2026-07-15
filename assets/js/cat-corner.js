(function () {
  var data = window.CAT_CORNER_DATA || [];
  if (!data.length) return;

  var root = document.getElementById('cat-corner-root');
  var toggleBtn = document.getElementById('cat-corner-toggle');
  if (!root) return;

  var rip = data.filter(function (c) { return c.rip; });
  var alive = data.filter(function (c) { return !c.rip; });

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

  function buildSprite(cat, kind, index) {
    var holder = document.createElement('div');
    holder.className = 'cat-sprite';
    holder.title = cat.title;

    // Vị trí "nhà" (home) của từng bé, tính offset âm từ góc phải-dưới màn hình.
    var hx, hy;
    if (kind === 'astro') {
      hx = -(46 + index * 50 + rand(-8, 8));
      hy = -(160 + (index % 3) * 40 + rand(-10, 10));
    } else {
      hx = -(34 + index * 54 + rand(-8, 8));
      hy = -(34 + rand(0, 16));
    }

    holder.dataset.hx = hx;
    holder.dataset.hy = hy;
    holder.style.transform = 'translate(' + hx + 'px,' + hy + 'px)';

    var idle = document.createElement('div');
    idle.style.animationDelay = rand(0, 3).toFixed(2) + 's';

    if (kind === 'astro') {
      idle.className = 'sprite-idle astro-idle';
      idle.style.animationDuration = rand(4.5, 6.5).toFixed(2) + 's';
      idle.innerHTML =
        '<div class="suit">' +
          '<div class="helmet"><img src="' + escapeAttr(cat.image) + '" alt="' + escapeAttr(cat.title) + '" style="object-position:' + escapeAttr(cat.avatarPosition) + '" loading="lazy"></div>' +
          '<div class="body-suit"></div>' +
          '<span class="sparkle s1">✦</span><span class="sparkle s2">✦</span>' +
        '</div>';
    } else {
      idle.className = 'sprite-idle runner-idle';
      idle.style.animationDuration = rand(2.6, 3.6).toFixed(2) + 's';
      idle.innerHTML =
        '<div class="runner"><img src="' + escapeAttr(cat.image) + '" alt="' + escapeAttr(cat.title) + '" style="object-position:' + escapeAttr(cat.avatarPosition) + '" loading="lazy"></div>';
    }

    holder.appendChild(idle);
    attachDrag(holder);
    return holder;
  }

  rip.forEach(function (cat, i) { root.appendChild(buildSprite(cat, 'astro', i)); });
  alive.forEach(function (cat, i) { root.appendChild(buildSprite(cat, 'runner', i)); });

  function attachDrag(el) {
    var dragging = false;
    var startX = 0, startY = 0, baseX = 0, baseY = 0;

    el.addEventListener('pointerdown', function (e) {
      dragging = true;
      el.classList.add('dragging');
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      startX = e.clientX;
      startY = e.clientY;
      var match = el.style.transform.match(/-?\d+\.?\d*/g) || [0, 0];
      baseX = parseFloat(match[0]) || 0;
      baseY = parseFloat(match[1]) || 0;
    });

    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      el.style.transform = 'translate(' + (baseX + dx) + 'px,' + (baseY + dy) + 'px)';
    });

    function release() {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      // Bò/bay từ từ về đúng chỗ cũ.
      el.style.transform = 'translate(' + el.dataset.hx + 'px,' + el.dataset.hy + 'px)';
    }

    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

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
