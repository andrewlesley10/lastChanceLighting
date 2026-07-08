document.addEventListener('DOMContentLoaded', function () {
  var toggleButton = document.getElementById('mobile-menu-toggle');
  var mobileMenu = document.getElementById('mobile-nav-panel');
  var icon = toggleButton ? toggleButton.querySelector('span') : null;

  if (!toggleButton || !mobileMenu) return;

  var closeMenu = function () {
    mobileMenu.classList.add('hidden');
    toggleButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mobile-nav-open');
    if (icon) icon.textContent = 'menu';
  };

  toggleButton.addEventListener('click', function () {
    var isOpen = this.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMenu();
    } else {
      mobileMenu.classList.remove('hidden');
      this.setAttribute('aria-expanded', 'true');
      document.body.classList.add('mobile-nav-open');
      if (icon) icon.textContent = 'close';
    }
  });

  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 768) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
});
