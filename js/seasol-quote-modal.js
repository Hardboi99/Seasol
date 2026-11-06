/**
 * Seasol Maritime - "Request A Quote" Pop-Up Modal Controller
 * Handles modal injection, trigger interception, animated transitions, validation, and AJAX SMTP delivery.
 */
(function () {
  'use strict';

  var MODAL_HTML = [
    '<div class="sq-modal-backdrop" id="seasol-quote-modal" role="dialog" aria-modal="true" aria-labelledby="sq-title" aria-hidden="true">',
    '  <div class="sq-modal-card">',
    '    <button type="button" class="sq-modal-close" id="sq-close-btn" aria-label="Close modal">&times;</button>',
    '    <div class="sq-modal-header">',
    '      <h2 class="sq-modal-title" id="sq-title">Send an Inquiry</h2>',
    '      <p class="sq-modal-subtitle">Fields marked <span class="sq-req">*</span> are required.</p>',
    '    </div>',
    '    <form id="sq-modal-form" novalidate>',
    '      <div class="sq-form-grid">',
    '        <div class="sq-field" id="sq-field-name">',
    '          <label for="sq-name">Full Name <span class="sq-req">*</span></label>',
    '          <input type="text" id="sq-name" name="name" placeholder="Your full name" required autocomplete="name">',
    '          <span class="sq-error-text">Please enter your name</span>',
    '        </div>',
    '        <div class="sq-field" id="sq-field-email">',
    '          <label for="sq-email">Business Email <span class="sq-req">*</span></label>',
    '          <input type="email" id="sq-email" name="email" placeholder="you@company.com" required autocomplete="email">',
    '          <span class="sq-error-text">Please enter a valid email address</span>',
    '        </div>',
    '        <div class="sq-field" id="sq-field-phone">',
    '          <label for="sq-phone">Phone Number</label>',
    '          <input type="tel" id="sq-phone" name="phone" placeholder="+91 98765 43210" autocomplete="tel">',
    '        </div>',
    '        <div class="sq-field" id="sq-field-company">',
    '          <label for="sq-company">Company Name</label>',
    '          <input type="text" id="sq-company" name="company" placeholder="Your company" autocomplete="organization">',
    '        </div>',
    '        <div class="sq-field" id="sq-field-service">',
    '          <label for="sq-service">Service Required</label>',
    '          <select id="sq-service" name="service">',
    '            <option value="">Select a service</option>',
    '            <option value="Ocean Freight">Ocean Freight</option>',
    '            <option value="Air Freight">Air Freight</option>',
    '            <option value="Breakbulk & Special Equipment">Breakbulk &amp; Special Equipment</option>',
    '            <option value="NVOCC & ISO Tanks">NVOCC &amp; ISO Tanks</option>',
    '            <option value="Customs Brokerage">Customs Brokerage</option>',
    '            <option value="Warehousing & 3PL">Warehousing &amp; 3PL</option>',
    '            <option value="Other Logistics Services">Other Logistics Services</option>',
    '          </select>',
    '        </div>',
    '        <div class="sq-field" id="sq-field-subject">',
    '          <label for="sq-subject">Subject</label>',
    '          <input type="text" id="sq-subject" name="subject" placeholder="How can we help?">',
    '        </div>',
    '        <div class="sq-field sq-full" id="sq-field-message">',
    '          <label for="sq-message">Message <span class="sq-req">*</span></label>',
    '          <textarea id="sq-message" name="message" rows="4" placeholder="Tell us about your cargo, route and timelines" required></textarea>',
    '          <span class="sq-error-text">Please enter your message or cargo requirements</span>',
    '        </div>',
    '        <div class="sq-field sq-full sq-consent" id="sq-field-consent">',
    '          <label class="sq-consent-label" for="sq-consent">',
    '            <input type="checkbox" id="sq-consent" name="consent" required>',
    '            <span>I agree to the processing of my details to respond to this inquiry, in line with the privacy policy. <span class="sq-req">*</span></span>',
    '          </label>',
    '          <span class="sq-error-text">Please accept the consent checkbox to proceed</span>',
    '        </div>',
    '      </div>',
    '      <button type="submit" class="sq-submit-btn" id="sq-submit-btn">',
    '        <span class="sq-btn-spinner" aria-hidden="true"></span>',
    '        <span class="sq-btn-text">Send Inquiry</span>',
    '      </button>',
    '      <div class="sq-status-box" id="sq-status-box" role="status" aria-live="polite"></div>',
    '    </form>',
    '  </div>',
    '</div>'
  ].join('\n');

  function initQuoteModal() {
    // Inject modal into DOM if missing
    var modalEl = document.getElementById('seasol-quote-modal');
    if (!modalEl) {
      var wrapper = document.createElement('div');
      wrapper.innerHTML = MODAL_HTML;
      document.body.appendChild(wrapper.firstElementChild);
      modalEl = document.getElementById('seasol-quote-modal');
    }

    var cardEl = modalEl.querySelector('.sq-modal-card');
    var closeBtn = document.getElementById('sq-close-btn');
    var formEl = document.getElementById('sq-modal-form');
    var submitBtn = document.getElementById('sq-submit-btn');
    var statusBox = document.getElementById('sq-status-box');
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var autoCloseTimer = null;

    // Detect service based on current URL path
    function detectCurrentService() {
      var path = window.location.pathname.toLowerCase();
      if (path.indexOf('ocean') !== -1) return 'Ocean Freight';
      if (path.indexOf('air') !== -1) return 'Air Freight';
      if (path.indexOf('breakbulk') !== -1) return 'Breakbulk & Special Equipment';
      if (path.indexOf('nvocc') !== -1) return 'NVOCC & ISO Tanks';
      if (path.indexOf('customs') !== -1) return 'Customs Brokerage';
      if (path.indexOf('other') !== -1) return 'Warehousing & 3PL';
      return '';
    }

    function openModal(defaultService) {
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
      clearErrors();
      statusBox.className = 'sq-status-box';
      statusBox.style.display = 'none';
      statusBox.textContent = '';

      var serviceSelect = document.getElementById('sq-service');
      var svc = defaultService || detectCurrentService();
      if (svc && serviceSelect) {
        serviceSelect.value = svc;
      }

      modalEl.classList.add('is-open');
      modalEl.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Autofocus first input after animation starts
      setTimeout(function () {
        var firstInput = document.getElementById('sq-name');
        if (firstInput) firstInput.focus();
      }, 150);
    }

    function closeModal() {
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
      modalEl.classList.remove('is-open');
      modalEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function clearErrors() {
      var errorFields = modalEl.querySelectorAll('.sq-field.has-error');
      Array.prototype.forEach.call(errorFields, function (f) {
        f.classList.remove('has-error');
      });
    }

    // Close on backdrop click outside card
    modalEl.addEventListener('click', function (e) {
      if (!cardEl.contains(e.target)) {
        closeModal();
      }
    });

    // Close on X button
    closeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      closeModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl.classList.contains('is-open')) {
        closeModal();
      }
    });

    // Form Submission
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();

      var nameInput = document.getElementById('sq-name');
      var emailInput = document.getElementById('sq-email');
      var phoneInput = document.getElementById('sq-phone');
      var companyInput = document.getElementById('sq-company');
      var serviceSelect = document.getElementById('sq-service');
      var subjectInput = document.getElementById('sq-subject');
      var messageInput = document.getElementById('sq-message');
      var consentCheckbox = document.getElementById('sq-consent');

      var hasError = false;

      if (!nameInput.value.trim()) {
        document.getElementById('sq-field-name').classList.add('has-error');
        hasError = true;
      }
      if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
        document.getElementById('sq-field-email').classList.add('has-error');
        hasError = true;
      }
      if (!messageInput.value.trim()) {
        document.getElementById('sq-field-message').classList.add('has-error');
        hasError = true;
      }
      if (!consentCheckbox.checked) {
        document.getElementById('sq-field-consent').classList.add('has-error');
        hasError = true;
      }

      if (hasError) {
        var firstError = modalEl.querySelector('.sq-field.has-error input, .sq-field.has-error textarea');
        if (firstError) firstError.focus();
        return;
      }

      // Payload preparation
      var payload = {
        form_type: 'quote_modal',
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        company: companyInput.value.trim(),
        service: serviceSelect.value || 'General Quote Request',
        subject: subjectInput.value.trim() || ('Quote Request: ' + (serviceSelect.value || 'Freight Services')),
        message: messageInput.value.trim(),
        consent: consentCheckbox.checked
      };

      // Loading state
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;
      statusBox.style.display = 'none';

      fetch('contact-handler.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.message || 'Server error');
          return data;
        });
      })
      .then(function (data) {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        formEl.reset();

        statusBox.className = 'sq-status-box is-success';
        statusBox.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' +
          (data.message || 'Thank you! Your quote inquiry has been sent to cs2@seasolmaritime.com. Our team will contact you shortly.');

        autoCloseTimer = setTimeout(function () {
          closeModal();
        }, 3200);
      })
      .catch(function (err) {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;

        statusBox.className = 'sq-status-box is-error';
        statusBox.textContent = err.message || 'Sorry, could not send your request right now. Please email cs2@seasolmaritime.com.';
      });
    });

    // Global trigger interception for all "Request A Quote" buttons
    document.addEventListener('click', function (e) {
      var target = e.target.closest('a, button');
      if (!target) return;

      var text = (target.textContent || '').trim().toLowerCase();
      var href = (target.getAttribute('href') || '').toLowerCase();
      var isQuoteBtn =
        text.indexOf('request a quote') !== -1 ||
        target.classList.contains('open-quote-modal') ||
        href === '#quote-modal' ||
        href.indexOf('quote%20request') !== -1 ||
        (target.classList.contains('theme-btn') && target.closest('.outer-box'));

      if (isQuoteBtn) {
        // If on contact page and clicking on-page contact link, we can still show the modal or scroll
        // Providing the popup provides the requested experience!
        e.preventDefault();
        e.stopPropagation();

        // Check if button specifies service in parent card or data attribute
        var serviceAttr = target.getAttribute('data-service');
        openModal(serviceAttr);
      }
    });

    // Expose global helper
    window.SeasolQuoteModal = {
      open: openModal,
      close: closeModal
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuoteModal);
  } else {
    initQuoteModal();
  }
})();

