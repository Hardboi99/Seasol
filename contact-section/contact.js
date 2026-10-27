/* Seasol Maritime – Contact Section behaviour
 *
 * DEMO MODE: no backend is connected, so nothing is emailed or stored.
 * To connect a backend later, set ENDPOINT to your handler URL (e.g. "contact-handler.php").
 * The form is then POSTed as JSON and the response status decides success/error.
 */
(function () {
  "use strict";

  var ENDPOINT = ""; // empty = demo mode (no network request)

  // Scroll reveal: elements stay visible unless JS + IntersectionObserver are available.
  (function () {
    var section = document.querySelector(".seasol-contact-section");
    if (!section) return;
    var targets = section.querySelectorAll(".sc-info, .sc-card, .sc-map-card");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    try {
      section.classList.add("sc-js");
      var fired = false;
      var io = new IntersectionObserver(function (entries) {
        fired = true;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target); // animate once
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      targets.forEach(function (el) { io.observe(el); });
      // Safety net: if the observer never reports anything, show everything.
      setTimeout(function () {
        if (!fired) targets.forEach(function (el) { el.classList.add("is-revealed"); });
      }, 2000);
    } catch (e) {
      section.classList.remove("sc-js");
    }
  })();
  var form = document.getElementById("seasol-contact-form");
  if (!form) return;

  var submitBtn = document.getElementById("sc-submit");
  var label = submitBtn.querySelector(".sc-submit-label");
  var statusEl = document.getElementById("sc-status");
  var isSubmitting = false;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^[+()\-.\s\d]{7,20}$/;

  var rules = {
    name: function (v) {
      if (!v.trim()) return "Please enter your full name.";
      return "";
    },
    email: function (v) {
      if (!v.trim()) return "Please enter your business email.";
      if (!EMAIL_RE.test(v.trim())) return "Please enter a valid email address, e.g. name@company.com.";
      return "";
    },
    phone: function (v) {
      if (v.trim() && !PHONE_RE.test(v.trim())) return "Please enter a valid phone number.";
      return "";
    },
    message: function (v) {
      if (!v.trim()) return "Please tell us how we can help.";
      if (v.trim().length < 10) return "Please add a little more detail (at least 10 characters).";
      return "";
    },
    consent: function (_v, el) {
      return el.checked ? "" : "Please accept the privacy consent to continue.";
    }
  };

  function setError(el, msg) {
    var field = el.closest(".sc-field");
    var err = document.getElementById(el.id + "-error");
    if (field) field.classList.toggle("is-invalid", !!msg);
    if (msg) el.setAttribute("aria-invalid", "true");
    else el.removeAttribute("aria-invalid");
    if (err) err.textContent = msg;
  }

  function validateField(el) {
    var rule = rules[el.name];
    if (!rule) return true;
    var msg = rule(el.value, el);
    setError(el, msg);
    return !msg;
  }

  function showStatus(type, text) {
    statusEl.className = "sc-status is-" + type;
    statusEl.textContent = text;
  }

  function clearStatus() {
    statusEl.className = "sc-status";
    statusEl.textContent = "";
  }

  function setLoading(on) {
    isSubmitting = on;
    submitBtn.classList.toggle("is-loading", on);
    submitBtn.setAttribute("aria-disabled", on ? "true" : "false");
    label.textContent = on ? "Sending…" : "Send Inquiry";
  }

  // Live validation: on blur first, then on every input once a field has been flagged.
  Object.keys(rules).forEach(function (name) {
    var el = form.elements[name];
    if (!el) return;
    el.addEventListener("blur", function () { validateField(el); });
    el.addEventListener(el.type === "checkbox" ? "change" : "input", function () {
      if (el.getAttribute("aria-invalid") === "true") validateField(el);
    });
  });

  function collectData() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      data[el.name] = el.type === "checkbox" ? el.checked : el.value.trim();
    });
    return data;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (isSubmitting) return; // prevent duplicate submissions

    clearStatus();

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      if (el && !validateField(el) && !firstInvalid) firstInvalid = el;
    });

    if (firstInvalid) {
      showStatus("error", "Please correct the highlighted fields and try again.");
      firstInvalid.focus();
      return;
    }

    setLoading(true);
    var payload = collectData();

    if (!ENDPOINT) {
      // Demo mode: simulate processing only. Nothing is sent or stored.
      setTimeout(function () {
        setLoading(false);
        showStatus(
          "info",
          "Demo mode: your details passed validation, but this form is not yet connected to a mail " +
          "service or database, so no inquiry has been sent or saved. Please contact us by phone or email instead."
        );
        statusEl.focus();
      }, 900);
      return;
    }

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Request failed with status " + res.status);
        form.reset();
        showStatus("success", "Thank you. Your inquiry has been sent and our team will respond shortly.");
      })
      .catch(function () {
        showStatus("error", "Sorry, we could not send your inquiry. Please try again or contact us by phone or email.");
      })
      .then(function () {
        setLoading(false);
        statusEl.focus();
      });
  });
})();


