import { api, clearSession, getToken, saveSession } from "./api.js";

const app = document.querySelector("#app");
const mapLibraryPromises = {};
const BAMENDA_CENTER = { lat: 5.9631, lng: 10.159 };

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value ?? "";
  return element.innerHTML;
}

function toast(message, type = "") {
  const region = document.querySelector("#toast-region");
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  region.appendChild(item);
  setTimeout(() => item.remove(), 4200);
}

function shell(title, role, content) {
  const links = role === "admin"
    ? [
        ["Overview", "#admin", "ph-squares-four"],
        ["Rider applications", "#admin/riders", "ph-motorcycle"],
        ["Users", "#admin/users", "ph-users"],
      ]
    : role === "rider"
      ? [
          ["Dashboard", "#rider", "ph-house"],
          ["Requests", "#rider/requests", "ph-bell-ringing"],
          ["Profile", "#rider/profile", "ph-user-circle"],
        ]
      : [
          ["Home", "#customer", "ph-house"],
          ["Book a ride", "#customer/book", "ph-plus-circle"],
          ["Trips", "#customer/trips", "ph-receipt"],
          ["Profile", "#customer/profile", "ph-user-circle"],
        ];
  const currentHash = (location.hash || (role === "admin" ? "#admin" : role === "rider" ? "#rider" : "#customer")).split("?")[0];
  const homeHref = role === "admin" ? "#admin" : role === "rider" ? "#rider" : "#customer";
  const linkMarkup = links.map(([label, href, icon]) => {
    const isActive = currentHash === href;
    return `<a href="${href}" class="${isActive ? "active" : ""}" ${isActive ? 'aria-current="page"' : ""}><i class="ph ${icon}" aria-hidden="true"></i><span>${label}</span></a>`;
  }).join("");

  return `
    <div class="shell workspace-shell workspace-${role}">
      <header class="workspace-topbar">
        <a class="workspace-brand" href="${homeHref}"><img class="brand-mark" src="/assets/brand-mark.svg" alt="" /><span>Afubom ride</span></a>
        <div class="workspace-topbar-actions">
          <div class="workspace-page-context"><span>${role === "admin" ? "ADMIN WORKSPACE" : role === "rider" ? "RIDER WORKSPACE" : "CUSTOMER WORKSPACE"}</span><strong>${escapeHtml(title)}</strong></div>
          <button class="button secondary workspace-logout" type="button" data-action="logout"><i class="ph ph-sign-out" aria-hidden="true"></i><span>Sign out</span></button>
        </div>
      </header>
      <div class="workspace-layout">
        <aside class="workspace-sidebar">
          <span class="workspace-nav-label">Menu</span>
          <nav class="workspace-nav" aria-label="${role === "admin" ? "Administration" : role === "rider" ? "Rider" : "Customer"} navigation">
            ${linkMarkup}
          </nav>
        </aside>
        <main class="workspace-main" id="main-content">${content}</main>
      </div>
    </div>`;
}

async function getMe() {
  const saved = localStorage.getItem("bb_user");
  if (saved) return JSON.parse(saved);
  const user = await api("/auth/me");
  localStorage.setItem("bb_user", JSON.stringify(user));
  return user;
}

function landingPage() {
  const whatsappNumber = "237681497411";
  const whatsappLink = (service) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello Afubom ride, I would like to request a ${service} service.`)}`;
  const benefits = [
    ["01", "Know the estimate", "See a fare estimate before you decide to confirm your booking.", "ph-receipt"],
    ["02", "Choose your locations", "Search Bamenda streets and landmarks, or set each point directly on the map.", "ph-map-pin"],
    ["03", "Ride or send a delivery", "Use one place to request a motorcycle ride, parcel, document, food, or grocery delivery.", "ph-package"],
  ];
  const faq = [
    ["Where is the service available?", "The platform is designed for Bamenda, Cameroon. Location search and map selection are centered on Bamenda."],
    ["What can I book?", "You can request a motorcycle ride or a delivery for a parcel, document, food, or groceries."],
    ["How do I get a fare estimate?", "Enter your pickup and destination, choose a service, then select “Estimate fare”. The estimate appears before you confirm."],
    ["Can I choose a location if it is not in search results?", "Yes. Choose a point on the map, use your current location with permission, or enter coordinates manually."],
    ["Do I need an account to book?", "Yes. Sign in or create an account to continue to booking and view your bookings."],
    ["How do I check a booking?", "Sign in and open Trips to see your bookings and their current status."],
  ];
  const benefitCards = benefits.map(([number, title, copy, icon]) => `
    <article class="landing-benefit reveal">
      <div class="benefit-topline"><span class="benefit-icon"><i class="ph ${icon}" aria-hidden="true"></i></span><span class="benefit-number">${number}</span></div>
      <h3 class="heading-6">${title}</h3>
      <p>${copy}</p>
    </article>`).join("");
  const questions = faq.map(([question, answer]) => `
    <details class="faq-item">
      <summary>${question}<i class="ph ph-plus" aria-hidden="true"></i></summary>
      <p>${answer}</p>
    </details>`).join("");
  const tagline = "Move across Bamenda. Send what matters.";
  const taglineWords = tagline.split(" ").map((word) => `<span class="tagline-word" aria-hidden="true">${word}</span>`).join(" ");

  app.innerHTML = `
    <div class="landing-page">
      <header class="landing-header">
        <a class="landing-brand" href="#home" aria-label="Afubom ride home">
          <img class="brand-mark" src="/assets/brand-mark.svg" alt="" />
          <span>Afubom ride</span>
        </a>
        <button class="menu-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="landing-nav">
          <span></span><span></span>
        </button>
        <nav class="landing-nav" id="landing-nav" aria-label="Main navigation">
          <a class="landing-nav-link" href="#services">Services</a>
          <a class="landing-nav-link" href="#how-it-works">How it works</a>
          <a class="landing-nav-link" href="#faq">FAQs</a>
          <a class="nav-signin" href="#auth">Sign in</a>
          <a class="button landing-nav-cta" href="#auth">Book a ride <i class="ph ph-arrow-up-right" aria-hidden="true"></i></a>
        </nav>
      </header>

      <main id="main-content">
        <section class="landing-hero" id="home">
          <div class="landing-hero-copy">
            <p class="landing-kicker">Rides and delivery, made simple</p>
            <h1 class="heading-1"><span class="hero-title-line">Get there.</span><span class="hero-title-line hero-title-accent">Send it.</span></h1>
            <p class="landing-hero-lede">Book a motorcycle ride or send a local delivery. Choose your locations and see a fare estimate before you confirm.</p>
            <div class="landing-hero-actions">
              <a class="button landing-primary" href="${whatsappLink("ride")}" target="_blank" rel="noopener">WhatsApp <i class="ph ph-whatsapp-logo" aria-hidden="true"></i></a>
              <a class="landing-text-link" href="tel:+237681497411"><i class="ph ph-phone" aria-hidden="true"></i> Call +237 681 497 411</a>
              <a class="landing-text-link" href="#how-it-works">See how it works <i class="ph ph-arrow-down-right" aria-hidden="true"></i></a>
            </div>
            <div class="landing-hero-note"><i class="ph ph-map-pin-line" aria-hidden="true"></i><span>Easy rides and local deliveries, all in one place</span></div>
          </div>
          <div class="landing-hero-visual">
            <span class="visual-label visual-label-top"><i class="ph ph-map-pin" aria-hidden="true"></i> Local rides &amp; delivery</span>
            <img class="landing-ride-art" src="/assets/Teal%20Courier%20Rider%20on%20Chrome%20Motorcycle.png" alt="Courier riding a motorcycle" fetchpriority="high" />
            <div class="visual-route-card">
              <span class="route-start"><i class="ph ph-circle" aria-hidden="true"></i></span>
              <span class="route-line"></span>
              <span class="route-end"><i class="ph ph-map-pin" aria-hidden="true"></i></span>
              <span class="route-copy"><strong>One trip, made simple</strong><small>Set a pickup. Choose where to go.</small></span>
              <i class="ph ph-arrow-up-right route-arrow" aria-hidden="true"></i>
            </div>
          </div>
          <a class="hero-scroll" href="#services" aria-label="Scroll to services"><i class="ph ph-arrow-down" aria-hidden="true"></i></a>
        </section>

        <section class="service-section landing-section" id="services">
          <div class="section-heading reveal">
            <p class="section-kicker">One place, two ways to move</p>
            <h2 class="heading-3">For the trip you need to make.</h2>
            <p>Getting across town or getting something across town, start here.</p>
          </div>
          <div class="landing-service-grid">
            <article class="landing-service ride-service reveal">
              <div class="service-art-box"><img src="/assets/ride-scene.svg" alt="Illustration of a motorcycle rider on a town road" loading="lazy" /></div>
              <div class="landing-service-copy">
                <span class="service-tag"><i class="ph ph-motorcycle" aria-hidden="true"></i> Motorcycle rides</span>
                <h3 class="heading-5">Make the city feel closer.</h3>
                <p>Set your pickup and destination, check the fare estimate, and request a ride.</p>
                <a href="${whatsappLink("ride")}" target="_blank" rel="noopener" class="service-action">Request a ride <i class="ph ph-whatsapp-logo" aria-hidden="true"></i></a>
              </div>
            </article>
            <article class="landing-service delivery-service reveal">
              <div class="service-art-box"><img src="/assets/delivery-scene.svg" alt="Illustration of a parcel ready for delivery" loading="lazy" /></div>
              <div class="landing-service-copy">
                <span class="service-tag"><i class="ph ph-package" aria-hidden="true"></i> Local delivery</span>
                <h3 class="heading-5">Send it where it needs to go.</h3>
                <p>Request delivery for parcels, documents, food, or groceries around Bamenda.</p>
                <a href="${whatsappLink("delivery")}" target="_blank" rel="noopener" class="service-action">Send a delivery <i class="ph ph-whatsapp-logo" aria-hidden="true"></i></a>
              </div>
            </article>
          </div>
        </section>

        <section class="tagline-section" aria-label="${tagline}">
          <div class="tagline-inner">
            <p class="section-kicker">Closer to what matters</p>
            <h2 class="tagline-heading heading-2">${taglineWords}</h2>
            <span class="sr-only">${tagline}</span>
            <span class="tagline-icon"><i class="ph ph-arrow-up-right" aria-hidden="true"></i></span>
          </div>
        </section>

        <section class="benefits-section landing-section">
          <div class="section-heading reveal">
            <p class="section-kicker">Designed around your journey</p>
            <h2 class="heading-3">Simple from the first tap.</h2>
            <p>Useful details are close at hand, whether you are booking a ride or a delivery.</p>
          </div>
          <div class="landing-benefit-grid">${benefitCards}</div>
        </section>

        <section class="how-section landing-section" id="how-it-works">
          <div class="how-intro reveal">
            <p class="section-kicker">How it works</p>
            <h2 class="heading-3">A few steps.<br />A clearer trip.</h2>
            <p>Make your request with the information you need to decide.</p>
            <a class="button landing-primary" href="#auth">Get started <i class="ph ph-arrow-right" aria-hidden="true"></i></a>
          </div>
          <ol class="steps-list">
            <li class="step-item reveal">
              <span class="step-index">01</span>
              <div><h3 class="title-2">Set your locations</h3><p>Search for a Bamenda street or landmark, use the map, or enter coordinates.</p></div>
              <i class="ph ph-map-trifold step-icon" aria-hidden="true"></i>
            </li>
            <li class="step-item reveal">
              <span class="step-index">02</span>
              <div><h3 class="title-2">Choose a service</h3><p>Select a ride or the type of delivery you need.</p></div>
              <i class="ph ph-path step-icon" aria-hidden="true"></i>
            </li>
            <li class="step-item reveal">
              <span class="step-index">03</span>
              <div><h3 class="title-2">Review and request</h3><p>Check the fare estimate and trip details before confirming your booking.</p></div>
              <i class="ph ph-check-circle step-icon" aria-hidden="true"></i>
            </li>
          </ol>
        </section>

        <section class="local-section landing-section">
          <div class="local-card reveal">
            <div class="local-copy">
              <p class="section-kicker">Local by design</p>
              <h2 class="heading-4">Built around Bamenda streets and landmarks.</h2>
              <p>Find a place by name, choose a point on the map, or use coordinates when an address is hard to describe.</p>
              <a class="local-link" href="#auth">Plan a route <i class="ph ph-arrow-up-right" aria-hidden="true"></i></a>
            </div>
            <div class="local-map-art" aria-hidden="true">
              <div class="map-grid"></div>
              <span class="map-road road-one"></span><span class="map-road road-two"></span><span class="map-road road-three"></span>
              <span class="map-place place-one"><i class="ph ph-map-pin" aria-hidden="true"></i></span>
              <span class="map-place place-two"><i class="ph ph-circle" aria-hidden="true"></i></span>
              <span class="map-place place-three"><i class="ph ph-map-pin" aria-hidden="true"></i></span>
              <span class="map-label label-one">Pickup</span><span class="map-label label-two">Destination</span>
              <div class="map-note"><i class="ph ph-crosshair" aria-hidden="true"></i><span><strong>Choose a point</strong><small>Search or tap the map</small></span></div>
            </div>
          </div>
        </section>

        <section class="faq-section landing-section" id="faq">
          <div class="faq-intro reveal">
            <p class="section-kicker">Good to know</p>
            <h2 class="heading-3">Questions, answered.</h2>
            <p>Details about booking, locations, and fare estimates.</p>
          </div>
          <div class="faq-list reveal">${questions}</div>
        </section>

        <section class="final-cta-section">
          <div class="final-cta reveal">
            <div><p class="section-kicker">Your next journey starts here</p><h2 class="heading-3">Where to in Bamenda?</h2><p>Sign in to book a ride or arrange a delivery.</p></div>
            <div class="final-cta-actions">
              <a class="button landing-primary" href="${whatsappLink("ride")}" target="_blank" rel="noopener">WhatsApp ride <i class="ph ph-whatsapp-logo" aria-hidden="true"></i></a>
              <a class="button landing-primary final-cta-call" href="tel:+237681497411"><i class="ph ph-phone" aria-hidden="true"></i> Call now</a>
              <img class="app-qr" id="app-qr" alt="QR code for this Afubom ride app" width="112" height="112" />
            </div>
            <span class="cta-orbit"></span>
          </div>
        </section>
      </main>

      <footer class="landing-footer">
        <div class="footer-main">
          <div class="footer-brand-col">
            <a class="landing-brand footer-brand" href="#home">
              <img class="brand-mark" src="/assets/brand-mark.svg" alt="" />
              <span>Afubom ride</span>
            </a>
            <p>Motorcycle rides and local deliveries for Bamenda.</p>
            <span class="footer-location"><i class="ph ph-map-pin" aria-hidden="true"></i> Bamenda, Cameroon</span>
          </div>
          <div class="footer-links-col"><h3>Explore</h3><a href="#services">Services</a><a href="#how-it-works">How it works</a><a href="#faq">FAQs</a></div>
          <div class="footer-links-col"><h3>Your account</h3><a href="#auth">Sign in</a><a href="#auth/register">Create an account</a><a href="#auth">Book a ride</a></div>
          <div class="footer-links-col"><h3>Service area</h3><span>Bamenda</span><span>Northwest Region</span><span>Cameroon</span></div>
        </div>
        <div class="footer-policy-grid">
          <section class="footer-policy" id="privacy-information">
            <h3>Privacy information</h3>
            <p>To create an account or booking, the app requests your name, phone number, optional email, locations, and any instructions you provide. Location searches go to the configured search provider, and pickup and destination coordinates go to the routing provider to draw the route (the default is the public OSRM demo service). Map tiles are requested from the selected map provider. Full privacy terms and data retention details are not yet published.</p>
          </section>
          <section class="footer-policy" id="terms-information">
            <h3>Service terms</h3>
            <p>Review your trip details and fare estimate before confirming a request. Service terms, payment options, and cancellation rules are still being prepared. Contact the service operator for current details before relying on a booking.</p>
          </section>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Afubom ride</span>
          <div class="footer-legal-links"><a href="#privacy-information">Privacy</a><a href="#terms-information">Terms</a></div>
          <a href="#home" class="back-to-top">Back to top <i class="ph ph-arrow-up" aria-hidden="true"></i></a>
        </div>
      </footer>
    </div>`;

  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#landing-nav");
  const closeMenu = () => {
    menuToggle.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    nav.classList.remove("nav-open");
    document.body.classList.remove("landing-menu-open");
  };
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.classList.toggle("menu-open", !isOpen);
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
    nav.classList.toggle("nav-open", !isOpen);
    document.body.classList.toggle("landing-menu-open", !isOpen);
  });
  nav.querySelectorAll("a").forEach((link, index) => {
    link.style.setProperty("--menu-order", String(Math.min(index, 6)));
    link.addEventListener("click", closeMenu);
  });
  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12 })
    : null;
  document.querySelectorAll(".reveal").forEach((section) => {
    if (revealObserver) revealObserver.observe(section);
    else section.classList.add("is-visible");
  });

  const appQr = document.querySelector("#app-qr");
  if (appQr) {
    const publicUrl = `${location.origin}${location.pathname}`;
    appQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=224x224&margin=8&data=${encodeURIComponent(publicUrl)}`;
  }

  const taglineWordsElements = document.querySelectorAll(".tagline-word");
  const taglineObserver = "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("word-lit");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.5, rootMargin: "-30% 0px -30% 0px" })
    : null;
  if (taglineObserver) taglineWordsElements.forEach((word) => taglineObserver.observe(word));
  else taglineWordsElements.forEach((word) => word.classList.add("word-lit"));
}

function authPage(showRegister = location.hash === "#auth/register") {
  app.innerHTML = `
    <main class="auth-page" id="main-content">
      <section class="card auth-card">
        <a class="brand auth-brand" href="#home"><img class="brand-mark" src="/assets/brand-mark.svg" alt="" /><span>Afubom ride</span></a>
        <div class="auth-illustration" aria-hidden="true">
          <img src="/assets/ride-scene.svg" alt="" />
          <span class="illustration-caption">Your city, closer.</span>
        </div>
        <h1 id="auth-title">Welcome back</h1>
        <p class="muted" id="auth-copy">Sign in to book a ride or manage deliveries.</p>
        <form id="auth-form">
          <div class="field register-only" hidden>
            <label for="full-name">Full name</label>
            <input id="full-name" autocomplete="name" maxlength="120" />
          </div>
          <div class="field">
            <label for="phone">Phone number</label>
            <input id="phone" autocomplete="tel" placeholder="+237 6XX XXX XXX" required />
          </div>
          <div class="field register-only" hidden>
            <label for="email">Email (optional)</label>
            <input id="email" type="email" autocomplete="email" />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" type="password" autocomplete="current-password" minlength="12" required />
          </div>
          <button class="button" id="auth-submit" type="submit">Sign in</button>
        </form>
        <p><button class="button secondary" id="auth-toggle" type="button">Create an account</button></p>
      </section>
    </main>`;

  let register = false;
  document.querySelector("#auth-toggle").addEventListener("click", () => {
    register = !register;
    document.querySelector("#auth-title").textContent = register ? "Create your account" : "Welcome back";
    document.querySelector("#auth-copy").textContent = register
      ? "Use a Cameroon phone number to get started."
      : "Sign in to book a ride or manage deliveries.";
    document.querySelector("#auth-submit").textContent = register ? "Create account" : "Sign in";
    document.querySelector("#auth-toggle").textContent = register ? "Already have an account?" : "Create an account";
    document.querySelectorAll(".register-only").forEach((field) => { field.hidden = !register; });
    document.querySelector("#full-name").required = register;
  });
  if (showRegister) document.querySelector("#auth-toggle").click();

  document.querySelector("#auth-form").addEventListener("submit", async (event) => {
    event.preventEvent?.();
  });

  document.querySelector("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = document.querySelector("#auth-submit");
    submit.disabled = true;
    try {
      const phone = document.querySelector("#phone").value.trim();
      const password = document.querySelector("#password").value;
      if (register) {
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            full_name: document.querySelector("#full-name").value.trim(),
            phone,
            email: document.querySelector("#email").value.trim() || null,
            password,
          }),
        });
        toast("Account created. Sign in to continue.");
        document.querySelector("#auth-toggle").click();
      } else {
        const session = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ phone, password }),
        });
        saveSession(session);
        const user = await getMe();
        routeByRole(user);
      }
    } catch (error) {
      toast(error.message, "error");
    } finally {
      submit.disabled = false;
    }
  });
}

async function customerDashboard() {
  app.innerHTML = shell("Customer", "customer", `
    <div class="workspace-page customer-home">
      <section class="customer-welcome">
        <div class="welcome-copy">
          <span class="badge"><i class="ph ph-map-pin" aria-hidden="true"></i> Bamenda, Cameroon</span>
          <h1>Where are you headed?</h1>
          <p>Book a motorcycle ride or send something across town. Start with a pickup and destination.</p>
          <a class="button welcome-cta" href="#customer/book">Start a booking <i class="ph ph-arrow-right" aria-hidden="true"></i></a>
        </div>
        <div class="welcome-visual">
          <img src="/assets/ride-scene.svg" alt="Motorcycle rider travelling through a town" fetchpriority="high" />
          <span class="welcome-visual-label"><i class="ph ph-navigation-arrow" aria-hidden="true"></i> Bamenda journeys</span>
        </div>
      </section>
      <section class="workspace-section">
        <div class="workspace-section-heading">
          <div><p class="workspace-eyebrow">Choose a service</p><h2>How can we help?</h2></div>
          <a class="quiet-link" href="#customer/trips">View your trips <i class="ph ph-arrow-right" aria-hidden="true"></i></a>
        </div>
        <div class="customer-service-grid">
          <a class="customer-service-card ride-service" href="#customer/book?type=ride">
            <span class="customer-service-icon"><i class="ph ph-motorcycle" aria-hidden="true"></i></span>
            <span class="customer-service-copy"><strong>Book a ride</strong><small>Get across town with a motorcycle ride.</small><span>Choose this service <i class="ph ph-arrow-up-right" aria-hidden="true"></i></span></span>
            <i class="ph ph-arrow-up-right service-card-arrow" aria-hidden="true"></i>
          </a>
          <a class="customer-service-card delivery-service" href="#customer/book?type=delivery">
            <span class="customer-service-icon"><i class="ph ph-package" aria-hidden="true"></i></span>
            <span class="customer-service-copy"><strong>Send a delivery</strong><small>Send a parcel, document, food, or groceries.</small><span>Choose this service <i class="ph ph-arrow-up-right" aria-hidden="true"></i></span></span>
            <i class="ph ph-arrow-up-right service-card-arrow" aria-hidden="true"></i>
          </a>
        </div>
      </section>
      <section class="customer-help-strip">
        <span class="help-strip-icon"><i class="ph ph-map-trifold" aria-hidden="true"></i></span>
        <div><strong>Know your route before you book</strong><p>Search local streets or set pickup and destination points on the map.</p></div>
        <a href="#customer/book" aria-label="Start a booking"><i class="ph ph-arrow-right" aria-hidden="true"></i></a>
      </section>
    </div>`);
}

async function customerBook() {
  const hash = location.hash;
  const requestedType = new URLSearchParams(hash.includes("?") ? hash.slice(hash.indexOf("?")) : "").get("type");
  const services = ["ride", "delivery"];
  const type = services.includes(requestedType) ? requestedType : "ride";
  app.innerHTML = shell("New booking", "customer", `
    <div class="workspace-page booking-page">
      <header class="workspace-page-heading booking-page-heading">
        <div><p class="workspace-eyebrow">New booking</p><h1>Plan your journey</h1><p>Choose your service and locations. Review the fare estimate before confirming.</p></div>
        <div class="booking-steps" aria-label="Booking steps">
          <span class="booking-step active"><b>01</b><span>Route</span></span><i class="ph ph-caret-right" aria-hidden="true"></i><span class="booking-step"><b>02</b><span>Review</span></span>
        </div>
      </header>
      <section class="booking-layout">
        <div class="booking-main">
          <form id="booking-form" class="booking-form">
            <section class="booking-section">
              <div class="booking-section-title"><span class="booking-section-number">01</span><div><h2>Choose a service</h2><p>What would you like to book?</p></div></div>
              <div class="field booking-service-field"><label for="booking-type">Service type</label><select id="booking-type">
                ${services.map(value => `<option ${value === type ? "selected" : ""} value="${value}">${value.charAt(0).toUpperCase() + value.slice(1)}</option>`).join("")}
              </select></div>
            </section>
            <section class="booking-section">
              <div class="booking-section-title"><span class="booking-section-number">02</span><div><h2>Set your locations</h2><p>Choose pickup and destination to trace a road route on the map.</p></div></div>
              <div class="field location-field">
                <label for="pickup">Pickup</label>
                <div class="location-input-wrap"><span class="location-marker pickup-marker" aria-hidden="true">A</span><input id="pickup" placeholder="Search a street, quarter, or landmark" autocomplete="off" required /><button class="button secondary pin-button" type="button" data-select-location="pickup"><i class="ph ph-map-pin" aria-hidden="true"></i><span>Set on map</span></button></div>
                <div class="location-suggestions" id="pickup-suggestions" role="listbox" hidden></div>
              </div>
              <div class="field location-field">
                <label for="destination">Destination</label>
                <div class="location-input-wrap"><span class="location-marker destination-marker" aria-hidden="true">B</span><input id="destination" placeholder="Where should you go?" autocomplete="off" required /><button class="button secondary pin-button" type="button" data-select-location="destination"><i class="ph ph-map-pin" aria-hidden="true"></i><span>Set on map</span></button></div>
                <div class="location-suggestions" id="destination-suggestions" role="listbox" hidden></div>
              </div>
              <div class="map-picker">
                <div class="map-toolbar">
                  <span><strong>Choose on map</strong><small id="map-selection-label">Select pickup or destination</small></span>
                  <div class="map-actions">
                    <button class="map-toggle active" type="button" data-select-location="pickup"><span class="map-toggle-letter">A</span><span>Pickup</span></button>
                    <button class="map-toggle" type="button" data-select-location="destination"><span class="map-toggle-letter">B</span><span>Destination</span></button>
                    <button class="map-location-button" type="button" id="use-my-location" aria-label="Use my current location" title="Use my current location"><i class="ph ph-crosshair" aria-hidden="true"></i></button>
                  </div>
                  <div class="map-layer-toggle" role="group" aria-label="Map view">
                    <button class="map-layer-button active" type="button" data-map-style="street" aria-pressed="true" disabled>Street</button>
                    <button class="map-layer-button" type="button" data-map-style="satellite" aria-pressed="false" disabled>Satellite</button>
                  </div>
                </div>
                <div id="booking-map" class="booking-map" role="application" aria-label="Map for choosing pickup and destination"></div>
                <div id="map-status" class="map-status" aria-live="polite">Loading map…</div>
              </div>
              <details class="manual-coordinates">
                <summary>Enter coordinates manually</summary>
                <div class="grid two coordinate-grid">
                  <div class="field"><label for="pickup-lat">Pickup latitude</label><input id="pickup-lat" type="number" step="0.000001" value="5.9597" required /></div>
                  <div class="field"><label for="pickup-lng">Pickup longitude</label><input id="pickup-lng" type="number" step="0.000001" value="10.146" required /></div>
                  <div class="field"><label for="destination-lat">Destination latitude</label><input id="destination-lat" type="number" step="0.000001" value="5.9631" required /></div>
                  <div class="field"><label for="destination-lng">Destination longitude</label><input id="destination-lng" type="number" step="0.000001" value="10.158" required /></div>
                </div>
              </details>
            </section>
            <section class="booking-section booking-instructions">
              <div class="booking-section-title"><span class="booking-section-number">03</span><div><h2>Anything the rider should know?</h2><p>Optional details for this booking.</p></div></div>
              <div class="field"><label for="instructions">Special instructions <span class="field-optional">Optional</span></label><textarea id="instructions" maxlength="1000" placeholder="Add a nearby landmark or useful detail"></textarea></div>
            </section>
            <div class="booking-actions">
              <button class="button secondary" type="button" id="estimate-button"><i class="ph ph-calculator" aria-hidden="true"></i><span>Estimate fare</span></button>
              <button class="button" type="submit" id="confirm-button" disabled><span>Confirm booking</span><i class="ph ph-arrow-right" aria-hidden="true"></i></button>
            </div>
          </form>
        </div>
        <aside class="booking-side">
          <section class="booking-summary-card">
            <div class="booking-summary-heading"><span class="summary-icon"><i class="ph ph-receipt" aria-hidden="true"></i></span><div><h2>Fare estimate</h2><span>Calculated for your route</span></div></div>
            <div id="fare-result" class="fare-result"><i class="ph ph-map-pin-line" aria-hidden="true"></i><p>Add your pickup and destination, then estimate the fare.</p></div>
            <p class="estimate-disclaimer"><i class="ph ph-info" aria-hidden="true"></i> This is an estimate. Review the booking details before confirming.</p>
          </section>
          <section class="booking-side-note"><i class="ph ph-map-trifold" aria-hidden="true"></i><div><strong>Need help with a location?</strong><p>Search a landmark, use your current location, or choose a point on the map.</p></div></section>
        </aside>
      </section>
    </div>`);

  initializeLocationPicker();
  let estimate = null;
  let estimateRevision = 0;
  const estimateButton = document.querySelector("#estimate-button");
  const confirmButton = document.querySelector("#confirm-button");
  const fareResult = document.querySelector("#fare-result");
  const resetEstimate = () => {
    const needsRefresh = Boolean(estimate)
      || fareResult.classList.contains("fare-loading")
      || fareResult.classList.contains("fare-error");
    estimateRevision += 1;
    estimate = null;
    confirmButton.disabled = true;
    estimateButton.disabled = false;
    estimateButton.querySelector("span").textContent = "Estimate fare";
    fareResult.className = "fare-result";
    fareResult.innerHTML = `<i class="ph ph-map-pin-line" aria-hidden="true"></i><p>${needsRefresh ? "Route changed. Get a new estimate before confirming." : "Add your pickup and destination, then estimate the fare."}</p>`;
  };
  document.querySelector("#booking-form").addEventListener("bookinglocationchange", resetEstimate);
  document.querySelector("#booking-type").addEventListener("change", resetEstimate);
  ["pickup", "destination", "pickup-lat", "pickup-lng", "destination-lat", "destination-lng"].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener("input", resetEstimate);
  });
  estimateButton.addEventListener("click", async () => {
    if (!document.querySelector("#booking-form").reportValidity()) return;
    const requestRevision = ++estimateRevision;
    estimate = null;
    confirmButton.disabled = true;
    estimateButton.disabled = true;
    estimateButton.querySelector("span").textContent = "Calculating…";
    fareResult.className = "fare-result fare-loading";
    fareResult.innerHTML = `<span class="loading-bar"></span><span class="loading-bar short"></span><span class="loading-caption">Calculating your route estimate</span>`;
    try {
      const body = bookingFields();
      const result = await api("/bookings/estimate", { method: "POST", body: JSON.stringify(body) });
      if (requestRevision !== estimateRevision) return;
      estimate = result;
      fareResult.className = "fare-result fare-ready";
      fareResult.innerHTML = `
        <span class="fare-total-label">Estimated total</span>
        <strong class="fare-total">${Number(estimate.total).toLocaleString()} <small>XAF</small></strong>
        <div class="fare-meta"><span><i class="ph ph-path" aria-hidden="true"></i>${escapeHtml(estimate.distance_km)} km</span><span><i class="ph ph-clock" aria-hidden="true"></i>${escapeHtml(estimate.duration_minutes)} min</span></div>
        <details class="fare-breakdown"><summary>Fare breakdown</summary><div><span>Base fare</span><strong>${Number(estimate.base_fare).toLocaleString()} XAF</strong><span>Distance</span><strong>${Number(estimate.distance_charge).toLocaleString()} XAF</strong></div></details>`;
      confirmButton.disabled = false;
      estimateButton.querySelector("span").textContent = "Update estimate";
    } catch (error) {
      if (requestRevision === estimateRevision) {
        fareResult.className = "fare-result fare-error";
        fareResult.innerHTML = `<i class="ph ph-warning-circle" aria-hidden="true"></i><p>${escapeHtml(error.message)} Try again after checking your route.</p>`;
        toast(error.message, "error");
      }
    } finally {
      if (requestRevision === estimateRevision) {
        estimateButton.disabled = false;
        if (!estimate) estimateButton.querySelector("span").textContent = "Estimate fare";
      }
    }
  });

  document.querySelector("#booking-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!estimate) return;
    confirmButton.disabled = true;
    confirmButton.querySelector("span").textContent = "Creating booking…";
    try {
      const body = {
        ...bookingFields(),
        pickup_address: document.querySelector("#pickup").value,
        destination_address: document.querySelector("#destination").value,
        special_instructions: document.querySelector("#instructions").value || null,
        idempotency_key: crypto.randomUUID(),
      };
      const booking = await api("/bookings", { method: "POST", body: JSON.stringify(body) });
      toast("Booking created.");
      location.hash = `#customer/trips?id=${booking.id}`;
    } catch (error) {
      toast(error.message, "error");
      confirmButton.disabled = false;
      confirmButton.querySelector("span").textContent = "Confirm booking";
    }
  });
}

function bookingFields() {
  return {
    booking_type: document.querySelector("#booking-type").value,
    pickup_latitude: Number(document.querySelector("#pickup-lat").value),
    pickup_longitude: Number(document.querySelector("#pickup-lng").value),
    destination_latitude: Number(document.querySelector("#destination-lat").value),
    destination_longitude: Number(document.querySelector("#destination-lng").value),
  };
}

function loadStyleSheet(url, id) {
  if (document.getElementById(id)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = url;
    link.onload = resolve;
    link.onerror = () => reject(new Error("Map styles could not be loaded."));
    document.head.appendChild(link);
  });
}

function loadScript(url, id) {
  if (mapLibraryPromises[id]) return mapLibraryPromises[id];
  mapLibraryPromises[id] = new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      if (existing.dataset.loaded === "true") resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = url;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => {
      delete mapLibraryPromises[id];
      reject(new Error("Map library could not be loaded."));
    };
    document.head.appendChild(script);
  });
  return mapLibraryPromises[id];
}

async function initializeLocationPicker() {
  const mapElement = document.querySelector("#booking-map");
  if (!mapElement) return;

  const inputs = {
    pickup: document.querySelector("#pickup"),
    destination: document.querySelector("#destination"),
  };
  const suggestions = {
    pickup: document.querySelector("#pickup-suggestions"),
    destination: document.querySelector("#destination-suggestions"),
  };
  const coordinates = {
    pickup: [document.querySelector("#pickup-lat"), document.querySelector("#pickup-lng")],
    destination: [document.querySelector("#destination-lat"), document.querySelector("#destination-lng")],
  };
  const state = {
    active: "pickup",
    map: null,
    markers: {},
    locationSelected: { pickup: false, destination: false },
    provider: "OpenStreetMap",
    streetLayer: null,
    satelliteLayer: null,
    mapStyle: "street",
    routeLine: null,
    routeController: null,
    routeRevision: 0,
  };
  const status = document.querySelector("#map-status");
  const mapStyleButtons = [...document.querySelectorAll("[data-map-style]")];
  let searchTimer;
  let searchController;
  let routeTimer;

  const setStatus = (message) => { status.textContent = message; };
  const closeSuggestions = (type) => { suggestions[type].hidden = true; suggestions[type].replaceChildren(); };
  const mapSource = (style) => style === "satellite" && state.provider !== "Google Maps" ? "Esri" : state.provider;

  function readLocation(type) {
    const latitude = coordinates[type][0].value.trim();
    const longitude = coordinates[type][1].value.trim();
    if (!latitude || !longitude) return null;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return null;
    return { lat, lng };
  }

  function removeRouteLine() {
    if (!state.routeLine || !state.map) return;
    if (state.provider === "Google Maps") state.routeLine.setMap(null);
    else state.map.removeLayer(state.routeLine);
    state.routeLine = null;
  }

  function cancelRouteTrace() {
    clearTimeout(routeTimer);
    routeTimer = null;
    state.routeRevision += 1;
    state.routeController?.abort();
    state.routeController = null;
    removeRouteLine();
  }

  function removeMarker(type) {
    const marker = state.markers[type];
    if (!marker) return;
    if (state.provider === "Google Maps") marker.setMap(null);
    else state.map?.removeLayer(marker);
    delete state.markers[type];
  }

  function updateMarker(type, point) {
    if (!state.map || !point) return;
    if (state.provider === "Google Maps") {
      const marker = state.markers[type] || new google.maps.Marker({
        map: state.map,
        label: type === "pickup" ? "A" : "B",
        title: type === "pickup" ? "Pickup" : "Destination",
      });
      marker.setPosition(point);
      state.markers[type] = marker;
    } else if (window.L) {
      if (state.markers[type]) state.markers[type].setLatLng([point.lat, point.lng]);
      else {
        state.markers[type] = L.marker([point.lat, point.lng], {
          title: type === "pickup" ? "Pickup location" : "Destination",
          alt: type === "pickup" ? "Pickup location" : "Destination",
        }).addTo(state.map);
      }
    }
  }

  async function traceRoadRoute() {
    if (!state.map) {
      setStatus("The map is unavailable. You can still enter locations and coordinates.");
      return;
    }
    const pickup = state.locationSelected.pickup ? readLocation("pickup") : null;
    const destination = state.locationSelected.destination ? readLocation("destination") : null;
    if (pickup) updateMarker("pickup", pickup);
    if (destination) updateMarker("destination", destination);
    if (state.locationSelected.pickup && !pickup) {
      setStatus("Enter valid pickup coordinates to trace a road route.");
      return;
    }
    if (state.locationSelected.destination && !destination) {
      setStatus("Enter valid destination coordinates to trace a road route.");
      return;
    }
    if (!pickup || !destination) {
      setStatus("Select both pickup and destination to trace a road route.");
      return;
    }

    const revision = ++state.routeRevision;
    const controller = new AbortController();
    state.routeController = controller;
    setStatus("Tracing a road route…");
    const coordinatesQuery = `${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}`;
    const query = new URLSearchParams({ overview: "full", geometries: "geojson", steps: "false" });
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinatesQuery}?${query}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("The routing service is temporarily unavailable.");
      const result = await response.json();
      const route = result.routes?.[0];
      if (result.code !== "Ok" || !Array.isArray(route?.geometry?.coordinates) || route.geometry.coordinates.length < 2) {
        throw new Error("No road route was found for these locations.");
      }
      if (revision !== state.routeRevision) return;

      const path = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
      if (state.provider === "Google Maps") {
        state.routeLine = new google.maps.Polyline({
          map: state.map,
          path,
          strokeColor: "#ef9b42",
          strokeOpacity: 0.95,
          strokeWeight: 6,
          clickable: false,
          zIndex: 1,
        });
        const bounds = new google.maps.LatLngBounds();
        path.forEach((point) => bounds.extend(point));
        state.map.fitBounds(bounds, 36);
      } else {
        state.routeLine = L.polyline(path.map(({ lat, lng }) => [lat, lng]), {
          color: "#ef9b42",
          weight: 6,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
          className: "booking-route-line",
        }).addTo(state.map);
        state.map.fitBounds(state.routeLine.getBounds(), { padding: [24, 24], maxZoom: 16 });
      }
      state.routeController = null;
      const distance = (route.distance / 1000).toFixed(1);
      const duration = Math.max(1, Math.round(route.duration / 60));
      setStatus(`Road route displayed · ${distance} km · about ${duration} min (routing estimate).`);
    } catch (error) {
      if (error.name === "AbortError" || revision !== state.routeRevision) return;
      state.routeController = null;
      removeRouteLine();
      setStatus(`${error.message} Map pins are still available.`);
    }
  }

  function scheduleRouteTrace() {
    clearTimeout(routeTimer);
    routeTimer = setTimeout(() => {
      routeTimer = null;
      traceRoadRoute();
    }, 400);
  }

  function setMapStyle(style) {
    if (!state.map) return;
    if (state.provider === "Google Maps") {
      state.map.setMapTypeId(style === "satellite" ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP);
    } else {
      const currentLayer = style === "satellite" ? state.streetLayer : state.satelliteLayer;
      const nextLayer = style === "satellite" ? state.satelliteLayer : state.streetLayer;
      if (currentLayer && state.map.hasLayer(currentLayer)) state.map.removeLayer(currentLayer);
      if (nextLayer && !state.map.hasLayer(nextLayer)) nextLayer.addTo(state.map);
    }
    state.mapStyle = style;
    mapStyleButtons.forEach((button) => {
      const selected = button.dataset.mapStyle === style;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    setStatus(`${style === "satellite" ? "Satellite imagery" : "Street map"} · ${mapSource(style)}.`);
  }

  mapStyleButtons.forEach((button) => {
    button.addEventListener("click", () => setMapStyle(button.dataset.mapStyle));
  });

  function setActiveLocation(type) {
    state.active = type;
    document.querySelectorAll("[data-select-location]").forEach((button) => {
      button.classList.toggle("active", button.dataset.selectLocation === type);
    });
    document.querySelector("#map-selection-label").textContent =
      `Tap map to set ${type === "pickup" ? "pickup" : "destination"}`;
  }

  function selectLocation(type, point, label) {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
    cancelRouteTrace();
    inputs[type].value = label;
    coordinates[type][0].value = point.lat.toFixed(6);
    coordinates[type][1].value = point.lng.toFixed(6);
    state.locationSelected[type] = true;
    document.querySelector("#booking-form").dispatchEvent(new Event("bookinglocationchange"));
    closeSuggestions(type);
    const position = { lat: point.lat, lng: point.lng };
    updateMarker(type, position);
    if (state.map) {
      if (state.provider === "Google Maps") state.map.panTo(position);
      else state.map.panTo([point.lat, point.lng]);
    }
    setActiveLocation(type === "pickup" ? "destination" : "pickup");
    const mapDescription = state.mapStyle === "satellite"
      ? `Satellite imagery by ${mapSource(state.mapStyle)}`
      : `Map data by ${mapSource(state.mapStyle)}`;
    setStatus(`${type === "pickup" ? "Pickup" : "Destination"} selected. ${mapDescription}.`);
    scheduleRouteTrace();
  }

  function attachGoogleAutocomplete() {
    for (const type of ["pickup", "destination"]) {
      const autocomplete = new google.maps.places.Autocomplete(inputs[type], {
        fields: ["formatted_address", "geometry", "name"],
        componentRestrictions: { country: "cm" },
        bounds: new google.maps.LatLngBounds(
          { lat: 5.82, lng: 10.05 },
          { lat: 6.08, lng: 10.27 },
        ),
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const location = place.geometry?.location;
        if (!location) {
          setStatus("Choose a suggested street or landmark to place it on the map.");
          return;
        }
        selectLocation(type, { lat: location.lat(), lng: location.lng() }, place.formatted_address || place.name);
      });
    }
  }

  async function searchOpenStreetMap(type, query) {
    if (searchController) searchController.abort();
    searchController = new AbortController();
    const params = new URLSearchParams({
      q: `${query}, Bamenda, Cameroon`,
      lat: String(BAMENDA_CENTER.lat),
      lon: String(BAMENDA_CENTER.lng),
      limit: "6",
      lang: "en",
    });
    const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
      signal: searchController.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Street search is temporarily unavailable.");
    const data = await response.json();
    const features = (data.features || []).filter((feature) => {
      const countryCode = String(feature.properties?.countrycode || "").toLowerCase();
      const country = String(feature.properties?.country || "").toLowerCase();
      return countryCode === "cm" || country === "cameroon";
    });
    suggestions[type].replaceChildren();
    if (!features.length) {
      const empty = document.createElement("div");
      empty.className = "suggestion-empty";
      empty.textContent = "No Bamenda matches. Try a nearby landmark or pick the point on the map.";
      suggestions[type].appendChild(empty);
      suggestions[type].hidden = false;
      return;
    }
    for (const feature of features) {
      const props = feature.properties;
      const title = [props.name, props.street, props.district, props.city, props.state]
        .filter((part, index, list) => part && list.indexOf(part) === index)
        .join(", ");
      const button = document.createElement("button");
      button.className = "suggestion-item";
      button.type = "button";
      button.setAttribute("role", "option");
      button.textContent = title || "Bamenda location";
      button.addEventListener("click", () => {
        selectLocation(type, {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
        }, title || "Selected Bamenda location");
      });
      suggestions[type].appendChild(button);
    }
    suggestions[type].hidden = false;
  }

  async function reverseLookup(lat, lng) {
    try {
      const params = new URLSearchParams({ lat: String(lat), lon: String(lng), lang: "en" });
      const response = await fetch(`https://photon.komoot.io/reverse?${params}`);
      if (!response.ok) throw new Error("Reverse geocoding failed");
      const data = await response.json();
      const props = data.features?.[0]?.properties;
      return [props?.name, props?.street, props?.district, props?.city]
        .filter((part, index, list) => part && list.indexOf(part) === index)
        .join(", ") || `Pinned location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    } catch {
      return `Pinned location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    }
  }

  try {
    let config = {};
    try {
      config = await api("/public/config");
    } catch {
      setStatus("Map settings could not be loaded. Using OpenStreetMap.");
    }
    if (config.google_maps_browser_key) {
      await loadScript(
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(config.google_maps_browser_key)}&libraries=places&loading=async`,
        "google-maps-script",
      );
      if (!window.google?.maps?.places) throw new Error("Google Maps Places is unavailable.");
      state.provider = "Google Maps";
      state.map = new google.maps.Map(mapElement, {
        center: BAMENDA_CENTER,
        zoom: 14,
        clickableIcons: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        restriction: { latLngBounds: { north: 6.12, south: 5.78, east: 10.34, west: 9.99 } },
      });
      mapStyleButtons.forEach((button) => { button.disabled = false; });
      state.map.addListener("click", async (event) => {
        const type = state.active;
        const label = await reverseLookup(event.latLng.lat(), event.latLng.lng());
        selectLocation(type, { lat: event.latLng.lat(), lng: event.latLng.lng() }, label);
      });
      attachGoogleAutocomplete();
      setStatus("Google Maps · select both locations to trace a road route.");
    } else {
      await Promise.all([
        loadStyleSheet("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "leaflet-css"),
        loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", "leaflet-script"),
      ]);
      state.map = L.map(mapElement, { scrollWheelZoom: false }).setView(
        [BAMENDA_CENTER.lat, BAMENDA_CENTER.lng],
        14,
      );
      state.streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
      }).addTo(state.map);
      state.satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        },
      );
      state.satelliteLayer.on("tileerror", () => {
        setStatus("Satellite imagery could not be loaded. Switch back to Street view or try again.");
      });
      mapStyleButtons.forEach((button) => { button.disabled = false; });
      state.map.on("click", async (event) => {
        const type = state.active;
        const label = await reverseLookup(event.latlng.lat, event.latlng.lng);
        selectLocation(type, { lat: event.latlng.lat, lng: event.latlng.lng }, label);
      });
      setStatus("OpenStreetMap · select both locations to trace a road route.");
    }
  } catch {
    state.provider = "OpenStreetMap";
    setStatus("The interactive map is unavailable. You can still search Bamenda locations or enter coordinates.");
  }

  for (const type of ["pickup", "destination"]) {
    inputs[type].addEventListener("focus", () => setActiveLocation(type));
    inputs[type].addEventListener("input", () => {
      state.locationSelected[type] = false;
      cancelRouteTrace();
      removeMarker(type);
      setStatus("Select both pickup and destination to trace a road route.");
      setActiveLocation(type);
      const query = inputs[type].value.trim();
      clearTimeout(searchTimer);
      if (state.provider === "Google Maps" || query.length < 3) {
        closeSuggestions(type);
        if (state.provider !== "Google Maps" && query.length >= 3) {
          setStatus("Searching Bamenda streets and landmarks…");
        }
        return;
      }
      setStatus("Searching Bamenda streets and landmarks…");
      searchTimer = setTimeout(() => {
        searchOpenStreetMap(type, query)
          .then(() => setStatus("Choose a search result or tap the map."))
          .catch((error) => {
            if (error.name !== "AbortError") setStatus(error.message);
          });
      }, 350);
    });
    coordinates[type].forEach((input) => {
      input.addEventListener("input", () => {
        cancelRouteTrace();
        removeMarker(type);
        state.locationSelected[type] = true;
        scheduleRouteTrace();
      });
    });
  }

  document.querySelectorAll("[data-select-location]").forEach((button) => {
    button.addEventListener("click", () => {
      closeSuggestions("pickup");
      closeSuggestions("destination");
      setActiveLocation(button.dataset.selectLocation);
    });
  });

  document.querySelector("#use-my-location").addEventListener("click", () => {
    if (!navigator.geolocation) {
      setStatus("Location services are unavailable in this browser.");
      return;
    }
    setStatus("Waiting for location permission…");
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const type = state.active;
      setStatus("Finding the nearest street or landmark…");
      const label = await reverseLookup(latitude, longitude);
      selectLocation(type, { lat: latitude, lng: longitude }, label);
    }, () => {
      setStatus("Could not access your location. You can search or tap the map instead.");
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  });

}

document.addEventListener("click", (event) => {
  for (const type of ["pickup", "destination"]) {
    if (!event.target.closest(`#${type}-suggestions`) && event.target.id !== type) {
      document.querySelector(`#${type}-suggestions`)?.setAttribute("hidden", "");
    }
  }
});

function statusClass(status) {
  return String(status || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

async function customerTrips() {
  try {
    const bookings = await api("/bookings");
    const tripCards = bookings.map((item) => {
      const created = new Date(item.created_at);
      const createdLabel = Number.isNaN(created.getTime()) ? "" : created.toLocaleString();
      const service = escapeHtml(String(item.booking_type).replaceAll("_", " "));
      const fare = Number(item.final_fare_xaf ?? item.estimated_fare_xaf).toLocaleString();
      const paymentStatus = item.payment_status || "pending";
      return `
        <article class="trip-card">
          <div class="trip-card-top">
            <span class="trip-service-icon"><i class="ph ${item.booking_type === "ride" ? "ph-motorcycle" : "ph-package"}" aria-hidden="true"></i></span>
            <div class="trip-service-copy"><strong>${service}</strong><span>${escapeHtml(createdLabel)}</span></div>
            <span class="status-badge status-${statusClass(item.status)}">${escapeHtml(String(item.status).replaceAll("_", " "))}</span>
          </div>
          <div class="trip-route">
            <div><i class="ph ph-circle" aria-hidden="true"></i><span>${escapeHtml(item.pickup_address)}</span></div>
            <span class="trip-route-line"></span>
            <div><i class="ph ph-map-pin" aria-hidden="true"></i><span>${escapeHtml(item.destination_address)}</span></div>
          </div>
          <div class="trip-card-bottom"><span>Fare</span><strong>${fare} XAF</strong><span class="trip-payment">Payment ${escapeHtml(String(paymentStatus).replaceAll("_", " "))}</span></div>
        </article>`;
    }).join("");
    app.innerHTML = shell("Your trips", "customer", `
      <div class="workspace-page">
        <header class="workspace-page-heading">
          <div><p class="workspace-eyebrow">Your activity</p><h1>Your trips</h1><p>Review your ride and delivery requests.</p></div>
          <a class="button workspace-primary" href="#customer/book"><i class="ph ph-plus" aria-hidden="true"></i> New booking</a>
        </header>
        ${bookings.length
          ? `<section class="trip-list" aria-label="Your bookings">${tripCards}</section>`
          : `<section class="workspace-empty"><span class="empty-icon"><i class="ph ph-receipt" aria-hidden="true"></i></span><h2>No trips yet</h2><p>Your bookings will appear here after you request a ride or delivery.</p><a class="button workspace-primary" href="#customer/book">Make your first booking <i class="ph ph-arrow-right" aria-hidden="true"></i></a></section>`}
      </div>`);
  } catch (error) {
    toast(error.message, "error");
  }
}

async function profilePage(role) {
  const user = await getMe();
  app.innerHTML = shell("Profile", role, `
    <div class="workspace-page">
      <header class="workspace-page-heading"><div><p class="workspace-eyebrow">Account</p><h1>Your profile</h1><p>Contact details and account information.</p></div></header>
      <section class="profile-layout">
        <article class="profile-card profile-identity">
          <span class="profile-avatar">${escapeHtml((user.full_name || "?").trim().charAt(0).toUpperCase())}</span>
          <h2>${escapeHtml(user.full_name)}</h2><p>${escapeHtml(user.phone)}</p>
          <span class="status-badge status-${statusClass(user.account_status)}">${escapeHtml(String(user.account_status).replaceAll("_", " "))}</span>
        </article>
        <article class="profile-card">
          <div class="profile-card-heading"><span class="profile-section-icon"><i class="ph ph-identification-card" aria-hidden="true"></i></span><div><h2>Account details</h2><p>Information linked to your account.</p></div></div>
          <dl class="profile-details">
            <div><dt>Full name</dt><dd>${escapeHtml(user.full_name)}</dd></div>
            <div><dt>Phone number</dt><dd>${escapeHtml(user.phone)}</dd></div>
            <div><dt>Email</dt><dd>${escapeHtml(user.email || "Not provided")}</dd></div>
            <div><dt>Account type</dt><dd>${escapeHtml(user.role)}</dd></div>
          </dl>
        </article>
      </section>
    </div>`);
}

async function riderDashboard() {
  let profile;
  try {
    profile = await api("/riders/me");
  } catch (error) {
    if (![403, 404].includes(error.status)) {
      app.innerHTML = shell("Rider dashboard", "rider", `
        <div class="workspace-page"><section class="workspace-empty"><span class="empty-icon"><i class="ph ph-warning-circle" aria-hidden="true"></i></span><h1>Rider information is unavailable</h1><p>${escapeHtml(error.message)}</p></section></div>`);
      return;
    }
    app.innerHTML = shell("Rider application", "rider", `
      <div class="workspace-page">
        <header class="workspace-page-heading"><div><p class="workspace-eyebrow">Rider registration</p><h1>Apply to ride with us</h1><p>Share your license and motorcycle details for review.</p></div></header>
        <section class="rider-application-layout">
          <form id="rider-apply" class="rider-application-form">
            <div class="booking-section-title"><span class="booking-section-number">01</span><div><h2>Your motorcycle details</h2><p>Enter the information shown on your documents.</p></div></div>
            <div class="field"><label for="license">License number</label><input id="license" autocomplete="off" required minlength="3" maxlength="60" /></div>
            <div class="grid two">
              <div class="field"><label for="make">Motorcycle make</label><input id="make" required minlength="2" maxlength="60" /></div>
              <div class="field"><label for="model">Motorcycle model</label><input id="model" required maxlength="60" /></div>
            </div>
            <div class="field"><label for="registration">Registration number</label><input id="registration" required minlength="3" maxlength="60" /></div>
            <button class="button workspace-primary" type="submit">Submit application <i class="ph ph-arrow-right" aria-hidden="true"></i></button>
          </form>
          <aside class="rider-application-note"><i class="ph ph-shield-check" aria-hidden="true"></i><h2>What happens next?</h2><p>Your application will be reviewed. You can go online after an administrator approves it.</p></aside>
        </section>
      </div>`);
    document.querySelector("#rider-apply").addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = event.currentTarget.querySelector("[type='submit']");
      submit.disabled = true;
      try {
        await api("/riders/apply", {
          method: "POST",
          body: JSON.stringify({
            license_number: document.querySelector("#license").value,
            motorcycle_make: document.querySelector("#make").value,
            motorcycle_model: document.querySelector("#model").value,
            registration_number: document.querySelector("#registration").value,
          }),
        });
        localStorage.removeItem("bb_user");
        await route();
        toast("Application submitted for review.");
      } catch (error) {
        toast(error.message, "error");
      } finally {
        submit.disabled = false;
      }
    });
    return;
  }

  app.innerHTML = shell("Rider dashboard", "rider", `
    <div class="workspace-page">
      <header class="workspace-page-heading"><div><p class="workspace-eyebrow">Rider workspace</p><h1>Good day</h1><p>Manage your availability and review your rider status.</p></div><a class="button workspace-secondary" href="#rider/requests"><i class="ph ph-bell-ringing" aria-hidden="true"></i> View requests</a></header>
      <section class="rider-status-card ${profile.is_online ? "is-online" : ""}">
        <div class="rider-status-icon"><i class="ph ${profile.is_online ? "ph-broadcast" : "ph-moon"}" aria-hidden="true"></i></div>
        <div class="rider-status-copy"><span>Availability</span><strong>${profile.is_online ? "You are online" : "You are offline"}</strong><p>${profile.is_online ? "You can receive booking requests." : "Go online when you are ready to receive requests."}</p></div>
        ${profile.verification_status === "verified"
          ? `<button class="button rider-availability-button ${profile.is_online ? "secondary" : ""}" id="availability" type="button">${profile.is_online ? "Go offline" : "Go online"} <i class="ph ph-arrow-right" aria-hidden="true"></i></button>`
          : `<span class="status-badge status-${statusClass(profile.verification_status)}">${escapeHtml(String(profile.verification_status).replaceAll("_", " "))}</span>`}
      </section>
      <section class="workspace-section">
        <div class="workspace-section-heading"><div><p class="workspace-eyebrow">Your account</p><h2>Rider overview</h2></div></div>
        <div class="rider-stat-grid">
          <article class="rider-stat-card"><span class="rider-stat-icon"><i class="ph ph-shield-check" aria-hidden="true"></i></span><span>Verification</span><strong class="status-badge status-${statusClass(profile.verification_status)}">${escapeHtml(String(profile.verification_status).replaceAll("_", " "))}</strong></article>
          <article class="rider-stat-card"><span class="rider-stat-icon"><i class="ph ph-star" aria-hidden="true"></i></span><span>Rating</span><strong>${Number(profile.rating).toFixed(1)}</strong></article>
          <article class="rider-stat-card"><span class="rider-stat-icon"><i class="ph ph-motorcycle" aria-hidden="true"></i></span><span>Motorcycle</span><strong>${escapeHtml(`${profile.motorcycle_make} ${profile.motorcycle_model}`)}</strong></article>
        </div>
      </section>
      ${profile.verification_status !== "verified" ? `<section class="rider-review-note"><i class="ph ph-hourglass" aria-hidden="true"></i><div><strong>Application under review</strong><p>You can go online after an administrator approves your application.</p></div></section>` : ""}
    </div>`);
  const button = document.querySelector("#availability");
  if (button) {
    button.addEventListener("click", async () => {
      try {
        await api("/riders/availability", {
          method: "POST",
          body: JSON.stringify({ is_online: !profile.is_online }),
        });
        toast("Availability updated.");
        riderDashboard();
      } catch (error) {
        toast(error.message, "error");
      }
    });
  }
}

async function riderRequests() {
  try {
    const requests = await api("/riders/requests");
    const requestCards = requests.map((item) => `
      <article class="request-card">
        <div class="request-card-heading"><span class="trip-service-icon"><i class="ph ${item.booking_type === "ride" ? "ph-motorcycle" : "ph-package"}" aria-hidden="true"></i></span><div><strong>${escapeHtml(String(item.booking_type).replaceAll("_", " "))}</strong><span>Booking request</span></div><span class="request-fare">${Number(item.estimated_fare_xaf).toLocaleString()} XAF</span></div>
        <div class="trip-route">
          <div><i class="ph ph-circle" aria-hidden="true"></i><span>${escapeHtml(item.pickup_address)}</span></div>
          <span class="trip-route-line"></span>
          <div><i class="ph ph-map-pin" aria-hidden="true"></i><span>${escapeHtml(item.destination_address)}</span></div>
        </div>
        <button class="button workspace-primary accept-request" data-id="${escapeHtml(item.id)}" type="button">Accept request <i class="ph ph-arrow-right" aria-hidden="true"></i></button>
      </article>`).join("");
    app.innerHTML = shell("Booking requests", "rider", `
      <div class="workspace-page">
        <header class="workspace-page-heading"><div><p class="workspace-eyebrow">Available bookings</p><h1>Booking requests</h1><p>Review the route and fare before accepting a request.</p></div></header>
        ${requests.length ? `<section class="request-list" aria-label="Available booking requests">${requestCards}</section>`
          : `<section class="workspace-empty"><span class="empty-icon"><i class="ph ph-bell-slash" aria-hidden="true"></i></span><h2>No requests right now</h2><p>New booking requests will appear here when available.</p></section>`}
      </div>`);
    document.querySelectorAll(".accept-request").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await api(`/riders/requests/${button.dataset.id}/accept`, { method: "POST", body: "{}" });
          toast("Booking accepted.");
          riderRequests();
        } catch (error) {
          toast(error.message, "error");
        }
      });
    });
  } catch (error) {
    app.innerHTML = shell("Incoming requests", "rider", `<div class="card"><h1>Incoming requests</h1><p class="muted">${escapeHtml(error.message)}</p></div>`);
  }
}

async function adminDashboard() {
  try {
    const stats = await api("/admin/dashboard");
    app.innerHTML = shell("Administration", "admin", `
      <div class="workspace-page">
        <header class="workspace-page-heading"><div><p class="workspace-eyebrow">Operations</p><h1>Platform overview</h1><p>A summary of account and booking activity.</p></div></header>
        <section class="admin-stat-grid">
          <article class="admin-stat-card"><span class="admin-stat-icon"><i class="ph ph-users" aria-hidden="true"></i></span><span>Total users</span><strong>${Number(stats.users).toLocaleString()}</strong></article>
          <article class="admin-stat-card"><span class="admin-stat-icon"><i class="ph ph-motorcycle" aria-hidden="true"></i></span><span>Riders</span><strong>${Number(stats.riders).toLocaleString()}</strong></article>
          <article class="admin-stat-card"><span class="admin-stat-icon"><i class="ph ph-hourglass" aria-hidden="true"></i></span><span>Applications to review</span><strong>${Number(stats.pending_rider_applications).toLocaleString()}</strong></article>
          <article class="admin-stat-card"><span class="admin-stat-icon"><i class="ph ph-receipt" aria-hidden="true"></i></span><span>Bookings</span><strong>${Number(stats.bookings).toLocaleString()}</strong></article>
        </section>
        <section class="admin-action-card"><div><span class="admin-stat-icon"><i class="ph ph-identification-card" aria-hidden="true"></i></span><div><h2>Review rider applications</h2><p>Check new rider details and update their verification status.</p></div></div><a class="button workspace-primary" href="#admin/riders">Review riders <i class="ph ph-arrow-right" aria-hidden="true"></i></a></section>
      </div>`);
  } catch (error) {
    toast(error.message, "error");
  }
}

async function adminRiders() {
  try {
    const riders = await api("/admin/riders");
    const riderCards = riders.map((item) => `
      <article class="admin-record-card">
        <div class="admin-record-icon"><i class="ph ph-motorcycle" aria-hidden="true"></i></div>
        <div class="admin-record-main"><h2>${escapeHtml(`${item.motorcycle_make} ${item.motorcycle_model}`)}</h2><p>Registration <strong>${escapeHtml(item.registration_number)}</strong></p><span class="status-badge status-${statusClass(item.verification_status)}">${escapeHtml(String(item.verification_status).replaceAll("_", " "))}</span></div>
        ${item.verification_status === "pending" ? `<div class="admin-record-actions"><button class="button workspace-primary approve-rider" data-id="${escapeHtml(item.id)}" type="button">Approve</button><button class="button danger reject-rider" data-id="${escapeHtml(item.id)}" type="button">Reject</button></div>` : ""}
      </article>`).join("");
    app.innerHTML = shell("Rider applications", "admin", `
      <div class="workspace-page">
        <header class="workspace-page-heading"><div><p class="workspace-eyebrow">Verification</p><h1>Rider applications</h1><p>Review motorcycle and registration information.</p></div><span class="admin-count">${riders.length} ${riders.length === 1 ? "rider" : "riders"}</span></header>
        ${riders.length ? `<section class="admin-record-list" aria-label="Rider applications">${riderCards}</section>` : `<section class="workspace-empty"><span class="empty-icon"><i class="ph ph-motorcycle" aria-hidden="true"></i></span><h2>No rider applications</h2><p>New applications will appear here for review.</p></section>`}
      </div>`);
    document.querySelectorAll(".approve-rider").forEach((button) => button.addEventListener("click", () => riderDecision(button.dataset.id, "approve")));
    document.querySelectorAll(".reject-rider").forEach((button) => button.addEventListener("click", () => riderDecision(button.dataset.id, "reject")));
  } catch (error) {
    toast(error.message, "error");
  }
}

async function riderDecision(id, decision) {
  try {
    await api(`/admin/riders/${id}/${decision}`, { method: "POST", body: "{}" });
    toast(`Rider ${decision}d.`);
    adminRiders();
  } catch (error) {
    toast(error.message, "error");
  }
}

async function adminUsers() {
  try {
    const users = await api("/admin/users");
    const userCards = users.map((item) => `
      <article class="admin-user-card">
        <span class="profile-avatar">${escapeHtml((item.full_name || "?").trim().charAt(0).toUpperCase())}</span>
        <div class="admin-user-details"><strong>${escapeHtml(item.full_name)}</strong><span>${escapeHtml(item.phone)}</span></div>
        <span class="user-role">${escapeHtml(item.role)}</span>
        <span class="status-badge status-${statusClass(item.account_status)}">${escapeHtml(String(item.account_status).replaceAll("_", " "))}</span>
      </article>`).join("");
    app.innerHTML = shell("Users", "admin", `
      <div class="workspace-page">
        <header class="workspace-page-heading"><div><p class="workspace-eyebrow">Directory</p><h1>Users</h1><p>Customer and rider accounts on the platform.</p></div><span class="admin-count">${users.length} ${users.length === 1 ? "account" : "accounts"}</span></header>
        ${users.length ? `<section class="admin-user-list" aria-label="Platform users">${userCards}</section>` : `<section class="workspace-empty"><span class="empty-icon"><i class="ph ph-users" aria-hidden="true"></i></span><h2>No users to show</h2></section>`}
      </div>`);
  } catch (error) {
    toast(error.message, "error");
  }
}

function routeByRole(user) {
  localStorage.setItem("bb_user", JSON.stringify(user));
  if (user.role === "admin") location.hash = "#admin";
  else if (user.role === "rider") location.hash = "#rider";
  else location.hash = "#customer";
}

async function route() {
  if (!getToken()) {
    if (location.hash.startsWith("#auth")) {
      authPage();
      return;
    }
    if (!app.querySelector(".landing-page")) landingPage();
    return;
  }
  window.scrollTo(0, 0);
  let user;
  try {
    user = await getMe();
  } catch {
    clearSession();
    authPage();
    return;
  }
  const hash = location.hash;
  if (user.role === "admin") {
    if (hash === "#admin/riders") return adminRiders();
    if (hash === "#admin/users") return adminUsers();
    return adminDashboard();
  }
  if (user.role === "rider") {
    if (hash === "#rider/requests") return riderRequests();
    if (hash === "#rider/profile") return profilePage("rider");
    return riderDashboard();
  }
  const routeHash = hash.split("?")[0];
  if (routeHash === "#customer/book") return customerBook();
  if (routeHash === "#customer/trips") return customerTrips();
  if (hash === "#customer/profile") return profilePage("customer");
  return customerDashboard();
}

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-action='logout']")) {
    clearSession();
    location.hash = "";
    authPage();
  }
});

document.addEventListener("keydown", (event) => {
  const nav = document.querySelector("#landing-nav");
  if (event.key === "Escape" && nav?.classList.contains("nav-open")) {
    nav.classList.remove("nav-open");
    document.body.classList.remove("landing-menu-open");
    const menuToggle = document.querySelector(".menu-toggle");
    menuToggle.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    menuToggle.focus();
  }
});

window.addEventListener("hashchange", route);
route();
