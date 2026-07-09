document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('contact-form');
  var statusBox = document.getElementById('form-status');
  var submitBtn = document.getElementById('contact-submit');

  if (!form || !statusBox || !submitBtn) return;

  var defaultLabel = submitBtn.textContent.trim();

  function showStatus(success, message) {
    statusBox.hidden = false;
    statusBox.className = 'contact-form-feedback contact-form-feedback--' + (success ? 'success' : 'error');
    statusBox.textContent = message;
    statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideStatus() {
    statusBox.hidden = true;
    statusBox.textContent = '';
    statusBox.className = 'contact-form-feedback hidden';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    hideStatus();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    fetch('contact.php', {
      method: 'POST',
      body: new FormData(form),
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
      },
    })
      .then(function (response) {
        return response.text().then(function (text) {
          try {
            return { ok: response.ok, data: JSON.parse(text) };
          } catch (error) {
            return {
              ok: false,
              data: {
                success: false,
                message: 'Unexpected server response. Please try again.',
              },
            };
          }
        });
      })
      .then(function (result) {
        var data = result.data || {};
        var message = data.message || 'Something went wrong. Please try again.';

        showStatus(Boolean(data.success), message);

        if (data.success) {
          form.reset();
        }
      })
      .catch(function () {
        showStatus(
          false,
          'Could not send your message. Please check your connection and try again.'
        );
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = defaultLabel;
      });
  });
});
