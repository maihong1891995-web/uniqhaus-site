/* ═══════════════════════════════════════════════════════════════════════════
   UniqHaus — JavaScript
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

const analyticsPage = document.body?.dataset.page || 'unknown';
const trackedScrollMilestones = new Set();

/* ─── FORM ENDPOINT CONFIG (Web3Forms) ──────────────────────────────────────
   Get a FREE access key at https://web3forms.com — enter info@theuniqhaus.com,
   confirm the email, then paste the key below. Leads will be emailed there.
   IMPORTANT: until a real key is set, forms run in PREVIEW-ONLY mode and the
   submission is NOT delivered (a warning is logged to the console).            */
const WEB3FORMS_ACCESS_KEY = '236c6650-bfc3-4fec-bc28-acfe81be012a';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

async function submitToWeb3Forms(formEl, extra = {}) {
  if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY') {
    console.warn('[UniqHaus] Form NOT connected: set WEB3FORMS_ACCESS_KEY in script.js. This submission was NOT delivered.');
    await new Promise((r) => setTimeout(r, 900));
    return true; // optimistic UI for local preview only
  }
  try {
    const formData = new FormData(formEl);
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('from_name', 'UniqHaus Website');
    formData.append('page_path', window.location.pathname);
    Object.entries(extra).forEach(([k, v]) => formData.append(k, v));

    const res = await fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data.success === true;
  } catch (err) {
    console.error('[UniqHaus] Form submission failed:', err);
    return false;
  }
}

const normalizeTrackingText = (value) => (value || '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 120);

const getTrackingPlacement = (element) => {
  const container = element?.closest('[id], section, nav, footer, form');
  if (!container) return 'page';
  return container.id || container.tagName.toLowerCase();
};

const trackEvent = (eventName, params = {}) => {
  const payload = {
    page_type: analyticsPage,
    page_path: window.location.pathname,
    page_title: document.title,
    ...params,
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...payload });

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload);
  }

  document.dispatchEvent(new CustomEvent('uniqhaus:track', {
    detail: { eventName, payload },
  }));
};

window.uniqhausTrack = trackEvent;

document.addEventListener('click', (event) => {
  const target = event.target.closest('a, button');
  if (!target) return;

  const href = target.getAttribute('href') || '';
  const clickText = normalizeTrackingText(target.textContent || target.getAttribute('aria-label'));
  const placement = getTrackingPlacement(target);

  if (href.startsWith('tel:')) {
    trackEvent('click_phone', {
      click_text: clickText,
      placement,
      destination: href,
    });
    return;
  }

  if (href.startsWith('mailto:')) {
    trackEvent('click_email', {
      click_text: clickText,
      placement,
      destination: href,
    });
    return;
  }

  if (target.matches('a[href*="contact.html"], .nav-cta, .mobile-sticky-cta')) {
    trackEvent('click_cta_contact', {
      click_text: clickText,
      placement,
      destination: href || 'contact.html',
    });
    return;
  }

  if (target.matches('.btn, .link-arrow')) {
    trackEvent('click_cta', {
      click_text: clickText,
      placement,
      destination: href || 'button',
    });
  }
});

let __docHeight = document.documentElement.scrollHeight - window.innerHeight;
window.addEventListener('resize', () => { __docHeight = document.documentElement.scrollHeight - window.innerHeight; }, { passive: true });
window.addEventListener('scroll', () => {
  if (__docHeight <= 0) return;

  const scrollPercent = Math.round((window.scrollY / __docHeight) * 100);

  [50, 90].forEach((milestone) => {
    if (scrollPercent >= milestone && !trackedScrollMilestones.has(milestone)) {
      trackedScrollMilestones.add(milestone);
      trackEvent(`scroll_${milestone}`, { scroll_percent: milestone });
    }
  });
}, { passive: true });

// ─── NAVBAR SCROLL EFFECT ─────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');

if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
}

// ─── MOBILE NAV TOGGLE ────────────────────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

const closeNavMenu = () => {
  if (!navLinks || !navToggle) return;

  navLinks.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';

  const spans = navToggle.querySelectorAll('span');
  spans[0].style.transform = '';
  spans[1].style.opacity   = '';
  spans[2].style.transform = '';
};

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';

    const spans = navToggle.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(4.5px, 4.5px)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(4.5px, -4.5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity   = '';
      spans[2].style.transform = '';
    }
  });
}

// Close nav when a link is clicked
if (navLinks) {
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeNavMenu();
    });
  });
}

// ─── ACTIVE NAV LINK HIGHLIGHTING ─────────────────────────────────────────────
const currentPage = document.body.dataset.page;
const navPageLinks = document.querySelectorAll('.nav-links a[data-page]');

if (currentPage && navPageLinks.length) {
  navPageLinks.forEach(link => {
    const isActive = link.dataset.page === currentPage;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

const sections    = document.querySelectorAll('section[id]');
const navAnchors  = document.querySelectorAll('.nav-links a[href^="#"]');

let __sectionOffsets = [];
const measureSections = () => {
  __sectionOffsets = Array.from(sections).map(s => ({ id: s.getAttribute('id'), top: s.offsetTop, bottom: s.offsetTop + s.offsetHeight }));
};

const activateNavLink = () => {
  if (!__sectionOffsets.length || !navAnchors.length) return;

  const scrollPos = window.scrollY + 100;
  __sectionOffsets.forEach(s => {
    if (scrollPos >= s.top && scrollPos < s.bottom) {
      navAnchors.forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href') === `#${s.id}`) {
          a.classList.add('active');
        }
      });
    }
  });
};

if (sections.length && navAnchors.length) {
  measureSections();
  window.addEventListener('resize', measureSections, { passive: true });
  window.addEventListener('load', measureSections);
  window.addEventListener('scroll', activateNavLink, { passive: true });
  activateNavLink();
}

// ─── SERVICES FLOW TOGGLE (Services page) ───────────────────────────────────
const flowButtons = document.querySelectorAll('.flow-main-btn[data-flow-target]');
const flowPanels = document.querySelectorAll('.flow-panel');
const flowPanelsWrap = document.getElementById('serviceFlowPanels');

if (flowButtons.length && flowPanels.length) {
  const activateFlowPanel = (targetId) => {
    const hasActiveTarget = Boolean(targetId);

    if (flowPanelsWrap) {
      flowPanelsWrap.classList.toggle('is-open', hasActiveTarget);
    }

    flowButtons.forEach((button) => {
      const isActive = button.dataset.flowTarget === targetId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-expanded', String(isActive));
    });

    flowPanels.forEach((panel) => {
      const isActive = panel.id === targetId;
      panel.classList.toggle('is-active', isActive);
    });
  };

  flowButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const isAlreadyActive = button.classList.contains('is-active');
      const nextTarget = isAlreadyActive ? '' : button.dataset.flowTarget;
      activateFlowPanel(nextTarget);

      if (nextTarget) {
        trackEvent('view_service_track', {
          service_track: nextTarget,
          click_text: normalizeTrackingText(button.textContent),
          placement: getTrackingPlacement(button),
        });
      }
    });
  });

  activateFlowPanel('');
}

const flowDetailData = {
  'design-2d': {
    title: 'Process Architecture (12 Weeks)',
    summary: 'End-to-end architecture and permitting workflow from customer intake to final permit document handover.',
    bullets: [],
    timelineTitle: 'Process Timeline by Week (12 Weeks)',
    gantt: {
      weeks: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
      groups: [
        {
          label: 'Step 1 - Customer Intake (Sales)',
          tasks: [
            { name: 'Receive inquiries and initial consultation', on: [1] },
            { name: 'Complete Customer Questionnaire', on: [1, 2] },
            { name: 'Collect documents and sign contract', on: [2, 3] },
          ],
        },
        {
          label: 'Step 2 - Transfer Info to Architecture Team',
          tasks: [
            { name: 'Send documents and kick-off email', on: [3, 4] },
            { name: 'Provide zoning and legal requirements', on: [4] },
          ],
        },
        {
          label: 'Step 3 - Design Process',
          tasks: [
            { name: 'Preliminary 3D and 2D drawings', on: [5, 6] },
            { name: 'Collaborate with engineers', on: [6, 7] },
            { name: 'Design revisions and adjustments', on: [7, 8] },
          ],
        },
        {
          label: 'Step 4 - Prepare and Apply for Building Permit',
          tasks: [
            { name: 'Finalize drawings and technical documents', on: [8, 9] },
            { name: 'Submit permit application to city', on: [9] },
            { name: 'Monitor approval status', on: [10, 11] },
          ],
        },
        {
          label: 'Step 5 - Finalize and Deliver Documentation',
          tasks: [
            { name: 'Receive permit and compile full file', on: [11] },
            { name: 'Deliver documents to customer', on: [12] },
            { name: 'Post-delivery support (as needed)', on: [12] },
          ],
        },
      ],
    },
  },
  'design-3d': {
    title: '3D Design',
    summary: 'Visual storytelling of the approved concept so proportion, mood, and material hierarchy are clear before execution.',
    bullets: [],
    timelineTitle: 'Process Timeline by Week (6 Weeks)',
    gantt: {
      weeks: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
      groups: [
        {
          label: 'Step 1 - Base Modeling',
          tasks: [
            { name: 'Build 3D model from approved layout', on: [1, 2] },
            { name: 'Set camera angles and scene framing', on: [2] },
          ],
        },
        {
          label: 'Step 2 - Look Development',
          tasks: [
            { name: 'Apply material palette and textures', on: [2, 3] },
            { name: 'Set lighting mood and atmosphere', on: [3, 4] },
          ],
        },
        {
          label: 'Step 3 - Review and Refinement',
          tasks: [
            { name: 'Client review cycle and revisions', on: [4, 5] },
            { name: 'Detail adjustments and viewpoint cleanup', on: [5] },
          ],
        },
        {
          label: 'Step 4 - Final Render Delivery',
          tasks: [
            { name: 'Export final visualization package', on: [6] },
            { name: 'Prepare presentation-ready image set', on: [6] },
          ],
        },
      ],
    },
  },
  'design-materials': {
    title: 'Materials',
    summary: 'Curated material direction that balances aesthetics, durability, availability, and budget intent.',
    bullets: [],
    timelineTitle: 'Process Timeline by Week (4 Weeks)',
    gantt: {
      weeks: ['W1', 'W2', 'W3', 'W4'],
      groups: [
        {
          label: 'Step 1 - Palette Direction',
          tasks: [
            { name: 'Confirm color, texture, and finish strategy', on: [1] },
            { name: 'Build moodboard and sample direction', on: [1, 2] },
          ],
        },
        {
          label: 'Step 2 - Sample Review',
          tasks: [
            { name: 'Compare shortlisted samples and alternates', on: [2] },
            { name: 'Validate fixtures and hardware options', on: [2, 3] },
          ],
        },
        {
          label: 'Step 3 - Specification',
          tasks: [
            { name: 'Lock performance and sourcing checks', on: [3] },
            { name: 'Prepare finish schedule and notes', on: [3, 4] },
          ],
        },
        {
          label: 'Step 4 - Material Schedule Delivery',
          tasks: [
            { name: 'Issue final material schedule', on: [4] },
            { name: 'Share procurement and maintenance notes', on: [4] },
          ],
        },
      ],
    },
  },
  'build-interior': {
    title: 'Pre-Construction Coordination',
    summary: 'This service covers the alignment work that happens before major field activity starts, including team kickoff, client communication, schedule setup, and site readiness planning.',
    bullets: [
      'Internal meeting to review scope, rough materials, and the construction schedule.',
      'Weekly client update cadence and daily Co-Construct schedule management are established upfront.',
      'Project budget, profit analysis, and trade kickoff expectations are aligned before field work begins.',
    ],
    timelineTitle: 'Phase Milestones (Weeks 1-2)',
    gantt: {
      weeks: ['W1', 'W2'],
      groups: [
        {
          label: 'Step 1 - Internal Alignment',
          tasks: [
            { name: 'Review scope of work and create construction schedule', on: [1] },
            { name: 'Set project budget and profit analysis', on: [1] },
          ],
        },
        {
          label: 'Step 2 - Client and Site Preparation',
          tasks: [
            { name: 'Notify client to prepare the house and schedule walkthroughs', on: [1, 2] },
            { name: 'Coordinate the construction team or subs onsite', on: [2] },
          ],
        },
        {
          label: 'Step 3 - Ongoing Controls',
          tasks: [
            { name: 'Update Co-Construct daily and run twice-weekly operations meetings', on: [1, 2] },
            { name: 'Keep communication centralized across the full team', on: [1, 2] },
          ],
        },
      ],
    },
  },
  'build-remodel': {
    title: 'Demolition and Site Prep',
    summary: 'This service prepares the jobsite for active construction through selective demolition, protection planning, utility checks, and access control.',
    bullets: [
      'Pre-demo walkthrough confirms client keep-items, site access, and material sizing for early finish orders.',
      'Utilities, asbestos or lead checks, staking, and main-panel coordination are reviewed before teardown.',
      'Protection measures, dumpster, fence, lockbox, and site controls are set to keep work organized and safe.',
    ],
    timelineTitle: 'Phase Milestones (Weeks 2-4)',
    gantt: {
      weeks: ['W2', 'W3', 'W4'],
      groups: [
        {
          label: 'Step 1 - Pre-Demo Walkthrough',
          tasks: [
            { name: 'Verify with the client what will be kept and protected', on: [1] },
            { name: 'Confirm finish material sizes for ordering', on: [1, 2] },
          ],
        },
        {
          label: 'Step 2 - Utility and Compliance Checks',
          tasks: [
            { name: 'Call 811, coordinate PG&E, and review asbestos or lead testing', on: [1, 2] },
            { name: 'Schedule survey or staking if needed', on: [2] },
          ],
        },
        {
          label: 'Step 3 - Site Protection Setup',
          tasks: [
            { name: 'Install lockbox, signage, fencing, dumpster, and site protection', on: [2, 3] },
            { name: 'Set corrosion control and landscape tree protection as needed', on: [3] },
          ],
        },
      ],
    },
  },
  'build-residential': {
    title: 'Structural Shell and Framing',
    summary: 'This service moves the project from excavation and foundation work into framing, dry-in, and the exterior shell that prepares the building for systems and finishes.',
    bullets: [
      'Excavation and underground work are coordinated with plumbing and electrical trenching requirements.',
      'Foundation layout, forms, inspections, and concrete placement are verified against plan before pour.',
      'Framing, exterior openings, lath, and roofing are sequenced to dry-in the structure with inspection control.',
    ],
    timelineTitle: 'Phase Milestones (Weeks 3-6)',
    gantt: {
      weeks: ['W3', 'W4', 'W5', 'W6'],
      groups: [
        {
          label: 'Step 1 - Excavation and Foundation Base',
          tasks: [
            { name: 'Excavate, verify depth, and coordinate underground utilities', on: [1] },
            { name: 'Check forms, anchors, hold-downs, and concrete pour readiness', on: [1, 2] },
          ],
        },
        {
          label: 'Step 2 - Framing Progression',
          tasks: [
            { name: 'Complete underfloor framing, plumbing checks, and subfloor installation', on: [2, 3] },
            { name: 'Run crawl space, shear wall, and roof deck inspection checkpoints', on: [3] },
          ],
        },
        {
          label: 'Step 3 - Exterior Shell',
          tasks: [
            { name: 'Install windows and exterior doors with flashing and sealant checks', on: [3] },
            { name: 'Install lath, roofing, waterproofing, and edge flashing', on: [4] },
          ],
        },
      ],
    },
  },
  'build-commercial': {
    title: 'Plumbing, HVAC, and Electrical',
    summary: 'This service coordinates the rough building systems that must be installed, inspected, and tested before the finish phase can proceed.',
    bullets: [
      'Rough plumbing is coordinated by fixture location, drain sizing, hot and cold supply, and wet-area testing requirements.',
      'HVAC scope includes furnace or mini-split planning, duct routing, venting, condenser placement, and code clearances.',
      'Electrical rough-in covers dedicated circuits, lighting, low-voltage, smoke detection, and room-by-room device planning.',
    ],
    timelineTitle: 'Phase Milestones (Weeks 6-8)',
    gantt: {
      weeks: ['W6', 'W7', 'W8'],
      groups: [
        {
          label: 'Step 1 - Rough Plumbing',
          tasks: [
            { name: 'Install kitchen, bath, laundry, and gas rough plumbing lines', on: [1] },
            { name: 'Complete pan, valve, and wet-area testing checkpoints', on: [1, 2] },
          ],
        },
        {
          label: 'Step 2 - Rough Mechanical',
          tasks: [
            { name: 'Install furnace, condenser, ducting, vents, and related clearances', on: [2] },
            { name: 'Coordinate access, platform, and service-zone requirements', on: [2] },
          ],
        },
        {
          label: 'Step 3 - Rough Electrical',
          tasks: [
            { name: 'Install dedicated circuits, lighting, outlets, switches, and low-voltage routing', on: [2, 3] },
            { name: 'Prepare systems for inspection and finish-stage connections', on: [3] },
          ],
        },
      ],
    },
  },
  'build-coordination': {
    title: 'Finishes and Turnover',
    summary: 'This service carries the project through insulation, drywall, paint, cabinetry, fixtures, system startup, and final client-ready completion.',
    bullets: [
      'Insulation, drywall, stucco, and paint are coordinated after framing and dry-in are ready.',
      'Finish kitchens, baths, lighting, outlets, HVAC startup, and other final fixtures are installed before handoff.',
      'Testing, touchups, and room-by-room completion bring the project to final delivery condition.',
    ],
    timelineTitle: 'Phase Milestones (Weeks 7-10)',
    gantt: {
      weeks: ['W7', 'W8', 'W9', 'W10'],
      groups: [
        {
          label: 'Step 1 - Rough MEP Installation',
          tasks: [
            { name: 'Install rough plumbing, mechanical, and electrical systems', on: [1, 2] },
            { name: 'Run required inspections and testing for rough-in work', on: [2] },
          ],
        },
        {
          label: 'Step 2 - Insulation and Drywall',
          tasks: [
            { name: 'Install insulation, schedule HERS or related checks, and prep drywall', on: [2, 3] },
            { name: 'Complete drywall, texture, and stucco coordination', on: [3] },
          ],
        },
        {
          label: 'Step 3 - Interior and Exterior Finishes',
          tasks: [
            { name: 'Install doors, trim, paint, cabinetry, countertops, and bath finishes', on: [3, 4] },
            { name: 'Coordinate finish materials onsite and complete touchups', on: [4] },
          ],
        },
        {
          label: 'Step 4 - Systems Finish and Turnover',
          tasks: [
            { name: 'Install final lights, outlets, switches, breakers, HVAC components, and system labels', on: [4] },
            { name: 'Test hot and cold water, HVAC performance, and final room readiness for client handoff', on: [4] },
          ],
        },
      ],
    },
  },
};

const flowDetailContainers = document.querySelectorAll('.flow-detail');

const getTaskWeekRange = (task) => {
  if (typeof task.start === 'number' && typeof task.end === 'number') {
    return { start: task.start, end: task.end };
  }

  const weeks = Array.isArray(task.on) ? task.on.filter((week) => Number.isInteger(week)) : [];
  if (!weeks.length) return null;

  return {
    start: Math.min(...weeks),
    end: Math.max(...weeks) + 1,
  };
};

const renderFlowDetail = (container, detail) => {
  const bulletsHtml = (detail.bullets || []).map((item) => `<li>${item}</li>`).join('');
  const timelineHtml = detail.gantt
    ? (() => {
        const weeks = detail.gantt.weeks || [];
        const weekHeadHtml = weeks.map((week) => `<span class="flow-gantt-week">${week}</span>`).join('');

        const groupHtml = (detail.gantt.groups || []).map((group) => {
          const taskRanges = (group.tasks || [])
            .map((task) => getTaskWeekRange(task))
            .filter(Boolean);

          const combinedRange = taskRanges.length
            ? {
                start: Math.min(...taskRanges.map((range) => range.start)),
                end: Math.max(...taskRanges.map((range) => range.end)),
              }
            : null;

          const trackHtml = combinedRange
            ? `<div class="flow-gantt-track" style="--gantt-start: ${combinedRange.start}; --gantt-end: ${combinedRange.end};"><span class="flow-gantt-bar"></span></div>`
            : '<div class="flow-gantt-track flow-gantt-track--empty" aria-hidden="true"></div>';

          return `
            <section class="flow-gantt-group">
              <div class="flow-gantt-step-row">
                <div class="flow-gantt-step-label">${group.label}</div>
                ${trackHtml}
              </div>
            </section>`;
        }).join('');

        return `
          <div class="flow-gantt-wrap">
            <div class="flow-gantt-grid" role="table" aria-label="Architecture gantt timeline">
              <div class="flow-gantt-head" role="row">
                <div class="flow-gantt-col-title">Phase / Task</div>
                <div class="flow-gantt-week-track">${weekHeadHtml}</div>
              </div>
              ${groupHtml}
            </div>
          </div>`;
      })()
    : detail.timeline.map((item) => {
        const styleVars = [
          item.shift ? `--step-shift: ${item.shift};` : '',
          item.width ? `--step-width: ${item.width};` : '',
          item.color ? `--step-color: ${item.color};` : '',
          item.bg ? `--step-bg: ${item.bg};` : '',
        ].filter(Boolean).join(' ');

        return `
        <article class="flow-timeline-item" style="${styleVars}">
          <div class="flow-step-badges">
            <span class="flow-badge flow-badge--step">${item.step}</span>
            <span class="flow-badge flow-badge--duration">${item.duration}</span>
          </div>
          <h5>${item.title}</h5>
          <p>${item.desc}</p>
        </article>`;
      }).join('');

  if (detail.gantt) {
    container.innerHTML = `
      <div class="flow-detail-inner flow-detail-inner--timeline-only">
        <div class="flow-detail-right">
          <h4>${detail.timelineTitle}</h4>
          <div class="flow-timeline">${timelineHtml}</div>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="flow-detail-inner">
      <div class="flow-detail-left">
        <h3>${detail.title}</h3>
        <p>${detail.summary}</p>
        ${bulletsHtml ? `<ul class="flow-detail-bullets">${bulletsHtml}</ul>` : ''}
      </div>
      <div class="flow-detail-right">
        <h4>${detail.timelineTitle}</h4>
        <div class="flow-timeline">${timelineHtml}</div>
      </div>
    </div>`;
};

document.querySelectorAll('.flow-panel').forEach((panel) => {
  const miniCards = panel.querySelectorAll('.flow-mini-card[data-flow-detail]');
  const detailContainer = panel.querySelector('.flow-detail');
  if (!miniCards.length || !detailContainer) return;

  const setActiveMiniCard = (selectedCard) => {
    miniCards.forEach((card) => {
      const active = card === selectedCard;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-expanded', String(active));
    });

    const detailKey = selectedCard?.dataset.flowDetail;
    const detailData = detailKey ? flowDetailData[detailKey] : null;

    if (!detailData) {
      detailContainer.hidden = true;
      detailContainer.innerHTML = '';
      return;
    }

    trackEvent('view_service_detail', {
      service_detail: detailKey,
      click_text: normalizeTrackingText(selectedCard.textContent),
      placement: getTrackingPlacement(selectedCard),
    });

    renderFlowDetail(detailContainer, detailData);
    detailContainer.hidden = false;
  };

  miniCards.forEach((card) => {
    card.addEventListener('click', () => {
      const isActive = card.classList.contains('is-active');
      setActiveMiniCard(isActive ? null : card);
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      const isActive = card.classList.contains('is-active');
      setActiveMiniCard(isActive ? null : card);
    });
  });
});

// ─── SCROLL REVEAL ─────────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

// Apply reveal class to key elements
const revealSelectors = [
  '.service-card',
  '.process-step',
  '.project-card',
  '.testimonial-card',
  '.home-quick-card',
  '.svc-icon-card',
  '.acronym-item',
  '.compare-item',
  '.about-side-panel',
  '.about-side-visual',
  '.about-principles-inline',
  '.blog-card',
  '.faq-item',
  '.intro-content-col',
  'blockquote',
  '.why-card',
  '.scope-card',
  '.timeline-card',
  '.theme-card',
  '.next-step-card',
  '.case-card',
  '.case-image',
  '.vs-stats',
  '.vs-row',
  '.source-card',
  '.timeline-band',
  '.checklist-wrap',
  '.event-overview-grid',
  '.event-calendar-shell',
];

revealSelectors.forEach(selector => {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add('reveal');
    const delay = Math.min(i % 4, 3);
    if (delay > 0) el.classList.add(`reveal-delay-${delay}`);
    revealObserver.observe(el);
  });
});

// ─── COUNT-UP NUMBERS (Why UniqHaus stat block, etc.) ───────────────────────
const countEls = document.querySelectorAll('[data-count]');
if (countEls.length) {
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = 1200;
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const value = Math.round(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = value + (p >= 1 ? suffix : '');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  countEls.forEach((el) => countObserver.observe(el));
}

// ─── COMPARISON HOVER PAIRING (Why UniqHaus, variant C) ─────────────────────
const vsTable = document.querySelector('.vs-table');
if (vsTable) {
  vsTable.querySelectorAll('.vs-row').forEach((row) => {
    row.addEventListener('mouseenter', () => {
      row.classList.add('is-active');
      vsTable.classList.add('is-dimmed');
    });
    row.addEventListener('mouseleave', () => {
      row.classList.remove('is-active');
      vsTable.classList.remove('is-dimmed');
    });
  });
}

// ─── CONTACT FORM ──────────────────────────────────────────────────────────────
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    const serviceField = contactForm.querySelector('#service');
    const phoneField = contactForm.querySelector('#phone');

    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const ok = await submitToWeb3Forms(contactForm, {
      subject: 'New Contact Inquiry — UniqHaus Website',
    });

    if (ok) {
      trackEvent('submit_contact_form', {
        form_id: 'contactForm',
        service_interest: serviceField?.value || 'unspecified',
        has_phone: Boolean(phoneField?.value?.trim()),
      });
      submitBtn.textContent = '✓ Message Sent!';
      submitBtn.style.background = '#4caf50';
      contactForm.reset();
    } else {
      submitBtn.textContent = 'Could not send — please call us';
      submitBtn.style.background = '#c0392b';
    }

    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.style.background = '';
      submitBtn.disabled = false;
    }, ok ? 3000 : 4500);
  });
}

const checklistForm = document.getElementById('checklistForm');

if (checklistForm) {
  checklistForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = checklistForm.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    const scopeField = checklistForm.querySelector('#checklistScope');

    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const ok = await submitToWeb3Forms(checklistForm, {
      subject: 'New Checklist Request — UniqHaus Website',
    });

    if (ok) {
      trackEvent('submit_checklist_form', {
        form_id: 'checklistForm',
        project_type: scopeField?.value || 'unspecified',
      });
      submitBtn.textContent = 'Request Received';
      submitBtn.style.background = '#4caf50';
      checklistForm.reset();
    } else {
      submitBtn.textContent = 'Please try again';
      submitBtn.style.background = '#c0392b';
    }

    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.style.background = '';
      submitBtn.disabled = false;
    }, ok ? 2500 : 4000);
  });
}

// ─── SMOOTH SCROLL FOR ANCHOR LINKS ───────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  const href = anchor.getAttribute('href');
  if (!href || href === '#') return;

  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ─── PROJECT CARD PARALLAX (subtle) ───────────────────────────────────────────
const projectCards = document.querySelectorAll('.project-card');

projectCards.forEach(card => {
  const img = card.querySelector('.project-img');
  if (!img) return;

  let rect = null;
  card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); });
  card.addEventListener('mousemove', (e) => {
    if (!rect) rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    img.style.transform = `scale(1.06) translate(${x * -8}px, ${y * -8}px)`;
  });

  card.addEventListener('mouseleave', () => {
    img.style.transform = '';
    rect = null;
  });
});

// ─── FAQ SEARCH FILTER (About page) ──────────────────────────────────────────
const faqSearchInput = document.getElementById('faqSearch');

if (faqSearchInput) {
  const faqGroups = document.querySelectorAll('.faq-group');

  const filterFaq = () => {
    const query = faqSearchInput.value.trim().toLowerCase();

    faqGroups.forEach(group => {
      const items = group.querySelectorAll('.faq-item');
      let visibleCount = 0;

      items.forEach(item => {
        const summary = item.querySelector('summary')?.textContent.toLowerCase() || '';
        const answer = item.querySelector('p')?.textContent.toLowerCase() || '';
        const matches = !query || summary.includes(query) || answer.includes(query);

        item.style.display = matches ? '' : 'none';
        if (matches) visibleCount += 1;
      });

      group.style.display = visibleCount > 0 ? '' : 'none';
    });
  };

  faqSearchInput.addEventListener('input', filterFaq);
}

// ─── PROJECT FILTERS (Projects page) ────────────────────────────────────────
const filterButtons = document.querySelectorAll('.filter-btn');
const filterCards = document.querySelectorAll('[data-project-category]');

if (filterButtons.length && filterCards.length) {
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.filter || 'all';

      filterButtons.forEach(btn => btn.classList.remove('is-active'));
      button.classList.add('is-active');

      filterCards.forEach(card => {
        const category = card.dataset.projectCategory || 'all';
        const show = selected === 'all' || category === selected;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });
}

// Per-project "Title Deed" data for the portfolio hover card.
// Only fields present here are shown; missing fields are hidden automatically.
// Flip projects show before -> after size/bed-bath plus financials.
const projectDeeds = {
  'curtiss': { name: '1285 Curtiss Ave, San Jose', type: 'New Construction', bedBath: '2+1 → 5+4.5', size: '1,200 → 4,000', purchase: '$800,000', cost: '$800,000', sold: '$2,800,000', profit: '$1,200,000', date: 'Completed: Feb 2019' },
  'bird': { name: '1440 Bird Ave, San Jose', type: 'Addition', bedBath: '2+1 → 4+3', size: '1,046 → 2,207', purchase: '$865,000', cost: '$500,000', sold: '$2,154,300', profit: '$789,300', date: 'Completed: July 2021' },
  'blair': { name: '1055 Blair Ave, Sunnyvale', type: 'Remodel & Addition', bedBath: '3+1 → 4+3.5', size: '1,518 → 1,918', purchase: '$1,200,000', cost: '$500,000', sold: '$2,900,000', profit: '$1,200,000', date: 'Completed: 2024' },
  'hawthorne-ave': { name: '665 Hawthorne Ave, Campbell', type: 'Remodel & Addition', bedBath: '3+1 → 5+5', size: '1,700 → 3,117', purchase: '$1,783,000', cost: '$700,000', sold: '$3,000,000', profit: '$516,999', date: 'Completed: 2025' },
  '100-unit-co-living': { type: 'Co-living development', date: 'Under construction' },
  'ncm-cafe': { type: 'Cafe interior concept', date: 'Under construction' },
  'castro-court': { type: 'Custom home', date: 'Under construction' },
  'antonio': { type: 'Custom home', date: 'Under construction' },
  'calado-ave': { type: 'Custom home', date: 'Under construction' },
  'glen-dell': {},
  'angelica-way': { type: 'Kitchen remodel', date: 'Completed: 2025' },
  'james': { type: 'Full rehab', date: 'Completed: 2025' },
  'san-francisco': { type: 'Interior remodel', date: 'Completed: 2024' },
  'willow-glen': { type: 'Home rehab', date: 'Completed: 2024' },
  'contra-costa': { type: 'Interior renovation', date: 'Completed: 2024' },
  '19-ivy': { type: 'Kitchen and baths', date: 'Completed: 2024' },
  'san-jose': { type: 'Home remodel', date: 'Completed: 2024' },
  'frostwood': { type: 'Home rehabilitation', date: 'Completed: 2024' },
  'delvin': { type: 'Home rehabilitation', date: 'Completed: 2024' },
  'belblossom': { type: 'Home rehabilitation', date: 'Completed: 2025' },
};

const portfolioBoardBrand = document.getElementById('portfolioBoardBrand');
const portfolioBoardDefault = document.getElementById('portfolioBoardDefault');
const portfolioBoardHover = document.getElementById('portfolioBoardHover');
const portfolioHoverTitle = document.getElementById('portfolioHoverTitle');
const boardCards = document.querySelectorAll('.projects-grid--board .project-card[data-project-id]');

if (portfolioBoardBrand && portfolioBoardDefault && portfolioBoardHover && portfolioHoverTitle && boardCards.length) {
  const resetPortfolioBoard = () => {
    portfolioBoardBrand.classList.remove('is-flipped');
    portfolioHoverTitle.textContent = 'Project Name';
  };

  // Show a single line element only if it has a value, otherwise hide it.
  const setDeedLine = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (val) { el.textContent = val; el.style.display = ''; }
    else { el.textContent = ''; el.style.display = 'none'; }
  };

  // Spec rows rendered in order; only the keys present on a project are shown.
  const deedSpecsOrder = [
    ['bedBath', 'Bed / Bath'],
    ['size', 'Size (sq ft)'],
    ['purchase', 'Purchase Price'],
    ['cost', 'Cost to Flip'],
    ['sold', 'Sold For'],
    ['profit', 'Profit'],
    ['lot', 'Lot Size (sq ft)'],
    ['porch', 'Porch (sq ft)'],
    ['patio', 'Patio (sq ft)'],
    ['garage', 'Garage (sq ft)'],
  ];

  const showPortfolioBoard = (card) => {
    const title = card.querySelector('.project-info h3')?.textContent?.trim() || 'Project Name';
    portfolioHoverTitle.textContent = title;
    const d = projectDeeds[card.dataset.projectId] || {};

    // Title Deed header (hide whole header if no address/name)
    const nameEl = document.getElementById('deedName');
    const headEl = document.getElementById('deedHead');
    if (nameEl) nameEl.textContent = d.name || '';
    if (headEl) headEl.style.display = d.name ? '' : 'none';

    setDeedLine('deedType', d.type);

    const specsEl = document.getElementById('deedSpecs');
    if (specsEl) {
      const rows = deedSpecsOrder
        .filter(([k]) => d[k])
        .map(([k, label]) => `<div><dt>${label}</dt><dd>${d[k]}</dd></div>`)
        .join('');
      specsEl.innerHTML = rows;
      specsEl.style.display = rows ? '' : 'none';
    }

    setDeedLine('deedResidence', d.residence);
    setDeedLine('deedDate', d.date);
    portfolioBoardBrand.classList.add('is-flipped');
  };

  boardCards.forEach((card) => {
    card.addEventListener('mouseenter', () => showPortfolioBoard(card));
    card.addEventListener('focus', () => showPortfolioBoard(card));
    card.addEventListener('mouseleave', resetPortfolioBoard);
    card.addEventListener('blur', resetPortfolioBoard);
  });

  resetPortfolioBoard();
}

// ─── PROJECT DETAIL MODAL (Projects page) ───────────────────────────────────
const projectModal = document.getElementById('projectModal');

if (projectModal) {
  const projectCardsForModal = document.querySelectorAll('.project-card[data-project-id]');
  const modalCloseBtn = document.getElementById('projectModalClose');
  const modalHero = document.getElementById('projectModalHero');
  const modalTitle = document.getElementById('projectModalTitle');
  const modalLocation = document.getElementById('projectModalLocation');
  const modalSummary = document.getElementById('projectModalSummary');
  const modalMeta = document.getElementById('projectModalMeta');
  const modalGallery = document.getElementById('projectModalGallery');
  const projectLightbox = document.getElementById('projectLightbox');
  const projectLightboxImage = document.getElementById('projectLightboxImage');
  const projectLightboxCount = document.getElementById('projectLightboxCount');
  const projectLightboxPrev = document.getElementById('projectLightboxPrev');
  const projectLightboxNext = document.getElementById('projectLightboxNext');
  const projectLightboxClose = document.getElementById('projectLightboxClose');

  let currentGalleryImages = [];
  let currentGalleryIndex = 0;
  let currentProjectId = '';

  const projectDetails = {
    'hawthorne-ave': {
      tag: 'Custom Homes 2025',
      title: 'Hawthorne Ave Whole-Home Renovation',
      location: 'Campbell, CA',
      summary: 'A whole-home structural renovation that transformed every room and system, including a new open floor plan, updated electrical and plumbing, custom floor-to-ceiling cabinetry, imported Cristallo Quartzite countertops, and redesigned outdoor living with hardscaping and landscaping.',
      cover: 'assets/images/portfolio/hawthorneAve/hero.jpg',
      meta: [
        { label: 'Scope', value: 'Remodel &amp; Addition' },
        { label: 'Type', value: 'Custom Homes' },
        { label: 'Area', value: 'Campbell, CA' },
        { label: 'Status', value: 'Completed 2025' },
      ],
      gallery: [
        'assets/images/portfolio/hawthorneAve/finished-back-patio.jpg',
        'assets/images/portfolio/hawthorneAve/finished-backyard-01.jpg',
        'assets/images/portfolio/hawthorneAve/finished-backyard-02.jpg',
        'assets/images/portfolio/hawthorneAve/finished-backyard-03.jpg',
        'assets/images/portfolio/hawthorneAve/finished-backyard-04.jpg',
        'assets/images/portfolio/hawthorneAve/finished-closet.jpg',
        'assets/images/portfolio/hawthorneAve/finished-front.jpg',
        'assets/images/portfolio/hawthorneAve/finished-kitchen-01.jpg',
        'assets/images/portfolio/hawthorneAve/finished-kitchen-02.jpg',
        'assets/images/portfolio/hawthorneAve/aerial-view.jpg',
        'assets/images/portfolio/hawthorneAve/build-01.jpg',
        'assets/images/portfolio/hawthorneAve/build-02.jpg',
        'assets/images/portfolio/hawthorneAve/build-03.jpg',
        'assets/images/portfolio/hawthorneAve/build-04.jpg',
        'assets/images/portfolio/hawthorneAve/build-05.jpg',
        'assets/images/portfolio/hawthorneAve/build-06.jpg',
        'assets/images/portfolio/hawthorneAve/build-07.jpg',
        'assets/images/portfolio/hawthorneAve/build-08.jpg',
        'assets/images/portfolio/hawthorneAve/build-09.jpg',
        'assets/images/portfolio/hawthorneAve/build-10.jpg',
        'assets/images/portfolio/hawthorneAve/build-11.jpg',
        'assets/images/portfolio/hawthorneAve/build-12.jpg',
        'assets/images/portfolio/hawthorneAve/build-13.jpg',
        'assets/images/portfolio/hawthorneAve/build-14.jpg',
        'assets/images/portfolio/hawthorneAve/build-15.jpg',
        'assets/images/portfolio/hawthorneAve/build-16.jpg',
        'assets/images/portfolio/hawthorneAve/build-17.jpg',
        'assets/images/portfolio/hawthorneAve/build-18.jpg',
        'assets/images/portfolio/hawthorneAve/build-19.jpg',
        'assets/images/portfolio/hawthorneAve/build-20.jpg',
        'assets/images/portfolio/hawthorneAve/build-21.jpg',
      ],
    },
    'angelica-way': {
      tag: 'Custom Homes 2025',
      title: 'Angelica Way Kitchen Remodel',
      location: 'San Jose, CA',
      summary: 'A complete kitchen transformation with custom cabinetry, premium countertops, and a modernized layout, visualized in 3D before construction to match the homeowner\'s vision.',
      cover: 'assets/images/portfolio/angelicaWay/hero.jpg',
      meta: [
        { label: 'Scope', value: 'Kitchen remodel' },
        { label: 'Type', value: 'Custom Homes' },
        { label: 'Area', value: 'San Jose, CA' },
        { label: 'Status', value: 'Completed 2025' },
      ],
      gallery: [
        'assets/images/portfolio/angelicaWay/finished-kitchen-01.jpg',
        'assets/images/portfolio/angelicaWay/finished-kitchen-02.jpg',
        'assets/images/portfolio/angelicaWay/finished-kitchen-03.jpg',
        'assets/images/portfolio/angelicaWay/finished-kitchen-04.jpg',
        'assets/images/portfolio/angelicaWay/finished-kitchen-05.jpg',
        'assets/images/portfolio/angelicaWay/finished-kitchen-06.jpg',
        'assets/images/portfolio/angelicaWay/finished-kitchen-07.jpg',
        'assets/images/portfolio/angelicaWay/finished-kitchen-cabinet-01.jpg',
        'assets/images/portfolio/angelicaWay/finished-kitchen-cabinet-02.jpg',
        'assets/images/portfolio/angelicaWay/build-01.jpg',
        'assets/images/portfolio/angelicaWay/build-02.jpg',
        'assets/images/portfolio/angelicaWay/build-03.jpg',
      ],
    },
    'james': {
      tag: 'Custom Homes 2025',
      title: 'James Complete Rehab',
      location: 'San Jose, CA',
      summary: 'A complete top-to-bottom rehabilitation with a new kitchen, updated bathrooms, modern exterior finishes, and a resort-style backyard with pool, new landscaping, and outdoor entertaining spaces.',
      cover: 'assets/images/portfolio/james/hero.jpg',
      meta: [
        { label: 'Scope', value: 'Full rehab with pool' },
        { label: 'Type', value: 'Custom Homes' },
        { label: 'Area', value: 'San Jose, CA' },
        { label: 'Status', value: 'Completed 2025' },
      ],
      gallery: [
        'assets/images/portfolio/james/finished-bath-01.jpg',
        'assets/images/portfolio/james/finished-bath-02.jpg',
        'assets/images/portfolio/james/finished-dining-01.jpg',
        'assets/images/portfolio/james/finished-ext-01.jpg',
        'assets/images/portfolio/james/finished-ext-02.jpg',
        'assets/images/portfolio/james/finished-ext-03.jpg',
        'assets/images/portfolio/james/finished-ext-04.jpg',
        'assets/images/portfolio/james/finished-ext-05.jpg',
        'assets/images/portfolio/james/finished-kitchen-00.jpg',
        'assets/images/portfolio/james/finished-kitchen-01.jpg',
        'assets/images/portfolio/james/finished-kitchen-02.jpg',
        'assets/images/portfolio/james/finished-kitchen-03.jpg',
        'assets/images/portfolio/james/finished-kitchen-04.jpg',
        'assets/images/portfolio/james/finished-kitchen-05.jpg',
        'assets/images/portfolio/james/finished-kitchen-06.jpg',
        'assets/images/portfolio/james/finished-kitchen-07.jpg',
        'assets/images/portfolio/james/build-01.jpg',
        'assets/images/portfolio/james/build-02.jpg',
        'assets/images/portfolio/james/build-03.jpg',
        'assets/images/portfolio/james/build-04.jpg',
        'assets/images/portfolio/james/build-05.jpg',
        'assets/images/portfolio/james/build-06.jpg',
        'assets/images/portfolio/james/build-07.jpg',
        'assets/images/portfolio/james/build-08.jpg',
        'assets/images/portfolio/james/build-09.jpg',
        'assets/images/portfolio/james/build-10.jpg',
        'assets/images/portfolio/james/build-11.jpg',
        'assets/images/portfolio/james/build-12.jpg',
        'assets/images/portfolio/james/build-13.jpg',
      ],
    },
    '19-ivy': {
      tag: 'Home Remodeling 2024',
      title: 'The Ivy Project',
      location: 'Orinda, CA',
      summary: 'A comprehensive home renovation in Orinda with an updated kitchen, modern finishes and cabinetry, renovated bathrooms, and refreshed interiors throughout.',
      cover: 'assets/images/portfolio/19-ivy/hero.jpg',
      meta: [
        { label: 'Scope', value: 'Kitchen and baths' },
        { label: 'Type', value: 'Home Remodeling' },
        { label: 'Area', value: 'Orinda, CA' },
        { label: 'Status', value: 'Completed 2024' },
      ],
      gallery: [
        'assets/images/portfolio/19-ivy/finished-back-01.jpg',
        'assets/images/portfolio/19-ivy/finished-back-02.jpg',
        'assets/images/portfolio/19-ivy/finished-back-03.jpg',
        'assets/images/portfolio/19-ivy/finished-back-04.jpg',
        'assets/images/portfolio/19-ivy/finished-back-05.jpg',
        'assets/images/portfolio/19-ivy/finished-balcony-01.jpg',
        'assets/images/portfolio/19-ivy/finished-balcony-02.jpg',
        'assets/images/portfolio/19-ivy/finished-bathroom-01.jpg',
        'assets/images/portfolio/19-ivy/finished-bathroom-03.jpg',
        'assets/images/portfolio/19-ivy/finished-bathroom-04.jpg',
        'assets/images/portfolio/19-ivy/finished-bathroom-05.jpg',
        'assets/images/portfolio/19-ivy/finished-bathroom-06.jpg',
        'assets/images/portfolio/19-ivy/finished-bathroom-07.jpg',
        'assets/images/portfolio/19-ivy/finished-bedroom-01.jpg',
        'assets/images/portfolio/19-ivy/finished-bedroom-02.jpg',
        'assets/images/portfolio/19-ivy/finished-bedroom-03.jpg',
        'assets/images/portfolio/19-ivy/finished-bedroom-04.jpg',
        'assets/images/portfolio/19-ivy/finished-bedroom-05.jpg',
        'assets/images/portfolio/19-ivy/finished-bedroom-06.jpg',
        'assets/images/portfolio/19-ivy/finished-bedroom-07.jpg',
        'assets/images/portfolio/19-ivy/finished-ext-01.jpg',
        'assets/images/portfolio/19-ivy/finished-front-01.jpg',
        'assets/images/portfolio/19-ivy/finished-front-02.jpg',
        'assets/images/portfolio/19-ivy/finished-front-03.jpg',
        'assets/images/portfolio/19-ivy/finished-front-04.jpg',
        'assets/images/portfolio/19-ivy/finished-front-05.jpg',
        'assets/images/portfolio/19-ivy/finished-interior-01.jpg',
        'assets/images/portfolio/19-ivy/finished-interior-02.jpg',
        'assets/images/portfolio/19-ivy/finished-interior-03.jpg',
        'assets/images/portfolio/19-ivy/finished-interior-04.jpg',
        'assets/images/portfolio/19-ivy/finished-interior-05.jpg',
        'assets/images/portfolio/19-ivy/finished-interior-06.jpg',
        'assets/images/portfolio/19-ivy/finished-kid-bedroom-01.jpg',
        'assets/images/portfolio/19-ivy/finished-kitchen-01.jpg',
        'assets/images/portfolio/19-ivy/finished-kitchen-02.jpg',
        'assets/images/portfolio/19-ivy/finished-kitchen-04.jpg',
        'assets/images/portfolio/19-ivy/finished-kitchen-05.jpg',
        'assets/images/portfolio/19-ivy/finished-kitchen-06.jpg',
        'assets/images/portfolio/19-ivy/finished-kitchen-07.jpg',
        'assets/images/portfolio/19-ivy/finished-side-01.jpg',
        'assets/images/portfolio/19-ivy/finished-side-02.jpg',
      ],
    },
    'blair': {
      tag: 'Home Remodeling 2024',
      title: 'The Blair Project',
      location: 'Sunnyvale, CA',
      summary: 'A comprehensive home rehabilitation in Sunnyvale that updated every room from the ground up with modern finishes throughout, delivering a move-in ready home.',
      cover: 'assets/images/portfolio/blair/hero.jpg',
      meta: [
        { label: 'Scope', value: 'Full-home rehabilitation' },
        { label: 'Type', value: 'Home Remodeling' },
        { label: 'Area', value: 'Sunnyvale, CA' },
        { label: 'Status', value: 'Completed 2024' },
      ],
      gallery: [
        'assets/images/portfolio/blair/finished-backyard-01.jpg',
        'assets/images/portfolio/blair/finished-backyard-02.jpg',
        'assets/images/portfolio/blair/finished-bathroom-01.jpg',
        'assets/images/portfolio/blair/finished-bathroom-02.jpg',
        'assets/images/portfolio/blair/finished-bathroom-03.jpg',
        'assets/images/portfolio/blair/finished-bathroom-04.jpg',
        'assets/images/portfolio/blair/finished-bedroom-01.jpg',
        'assets/images/portfolio/blair/finished-bedroom-02.jpg',
        'assets/images/portfolio/blair/finished-bedroom-03.jpg',
        'assets/images/portfolio/blair/finished-bedroom-04.jpg',
        'assets/images/portfolio/blair/finished-bedroom-05.jpg',
        'assets/images/portfolio/blair/finished-front-01.jpg',
        'assets/images/portfolio/blair/finished-garage-01.jpg',
        'assets/images/portfolio/blair/finished-kitchen-01.jpg',
        'assets/images/portfolio/blair/finished-kitchen-02.jpg',
        'assets/images/portfolio/blair/finished-kitchen-03.jpg',
        'assets/images/portfolio/blair/finished-livingroom-01.jpg',
        'assets/images/portfolio/blair/finished-livingroom-02.jpg',
        'assets/images/portfolio/blair/finished-livingroom-03.jpg',
        'assets/images/portfolio/blair/finished-livingroom-04.jpg',
        'assets/images/portfolio/blair/finished-livingroom-05.jpg',
      ],
    },
    'san-francisco': {
      tag: 'Home Remodeling 2024',
      title: 'The San Francisco Project',
      location: 'San Francisco, CA',
      summary: 'A comprehensive interior renovation that raised every room to current San Francisco standards, including kitchen, baths, bedrooms, living spaces, staircase, and entry, plus a deck and landscaped backyard.',
      cover: 'assets/images/portfolio/san-francisco/hero.jpg',
      meta: [
        { label: 'Scope', value: 'Complete interior remodel' },
        { label: 'Type', value: 'Home Remodeling' },
        { label: 'Area', value: 'San Francisco, CA' },
        { label: 'Status', value: 'Completed 2024' },
      ],
      gallery: [
        'assets/images/portfolio/san-francisco/finished-backyard-01.jpg',
        'assets/images/portfolio/san-francisco/finished-backyard-02.jpg',
        'assets/images/portfolio/san-francisco/finished-backyard-03.jpg',
        'assets/images/portfolio/san-francisco/finished-bathroom-01.jpg',
        'assets/images/portfolio/san-francisco/finished-bedroom-01.jpg',
        'assets/images/portfolio/san-francisco/finished-bedroom-02.jpg',
        'assets/images/portfolio/san-francisco/finished-deck-01.jpg',
        'assets/images/portfolio/san-francisco/finished-interior-01.jpg',
        'assets/images/portfolio/san-francisco/finished-interior-02.jpg',
        'assets/images/portfolio/san-francisco/finished-interior-stairs-01.jpg',
        'assets/images/portfolio/san-francisco/finished-kitchen-01.jpg',
        'assets/images/portfolio/san-francisco/finished-kitchen-02.jpg',
      ],
    },
    'willow-glen': {
      tag: 'Home Remodeling 2024',
      title: 'The Willow Glen Project',
      location: 'San Jose, CA',
      summary: 'A complete home rehabilitation in San Jose\'s Willow Glen neighborhood that modernized every interior space, from kitchen and bathrooms to bedrooms and living areas, while keeping the neighborhood character.',
      cover: 'assets/images/portfolio/willow-glen/hero.jpg',
      meta: [
        { label: 'Scope', value: 'Complete home rehab' },
        { label: 'Type', value: 'Home Remodeling' },
        { label: 'Area', value: 'San Jose, CA' },
        { label: 'Status', value: 'Completed 2024' },
      ],
      gallery: [
        'assets/images/portfolio/willow-glen/finished-backyard-01.jpg',
        'assets/images/portfolio/willow-glen/finished-backyard-02.jpg',
        'assets/images/portfolio/willow-glen/finished-bathroom-01.jpg',
        'assets/images/portfolio/willow-glen/finished-bathroom-02.jpg',
        'assets/images/portfolio/willow-glen/finished-bedroom-01.jpg',
        'assets/images/portfolio/willow-glen/finished-bedroom-02.jpg',
        'assets/images/portfolio/willow-glen/finished-bedroom-03.jpg',
        'assets/images/portfolio/willow-glen/finished-bedroom-04.jpg',
        'assets/images/portfolio/willow-glen/finished-bedroom-05.jpg',
        'assets/images/portfolio/willow-glen/finished-front-01.jpg',
        'assets/images/portfolio/willow-glen/finished-kitchen-01.jpg',
        'assets/images/portfolio/willow-glen/finished-kitchen-02.jpg',
        'assets/images/portfolio/willow-glen/finished-livingroom-01.jpg',
        'assets/images/portfolio/willow-glen/finished-livingroom-02.jpg',
        'assets/images/portfolio/willow-glen/finished-livingroom-03.jpg',
        'assets/images/portfolio/willow-glen/finished-livingroom-04.jpg',
        'assets/images/portfolio/willow-glen/finished-office-01.jpg',
        'assets/images/portfolio/willow-glen/finished-wine-cellar-01.jpg',
      ],
    },
    'contra-costa': {
      tag: 'Home Remodeling 2024',
      title: 'The Contra Costa Project',
      location: 'Contra Costa County, CA',
      summary: 'A comprehensive interior renovation across every room, including kitchen, bathrooms, bedrooms, living, and dining, with unified contemporary finishes and improved functionality.',
      cover: 'assets/images/portfolio/contra-costa/hero.jpg',
      meta: [
        { label: 'Scope', value: 'Full interior renovation' },
        { label: 'Type', value: 'Home Remodeling' },
        { label: 'Area', value: 'Contra Costa County, CA' },
        { label: 'Status', value: 'Completed 2024' },
      ],
      gallery: [
        'assets/images/portfolio/contra-costa/finished-back-01.jpg',
        'assets/images/portfolio/contra-costa/finished-bathroom-01.jpg',
        'assets/images/portfolio/contra-costa/finished-bathroom-02.jpg',
        'assets/images/portfolio/contra-costa/finished-bathroom-03.jpg',
        'assets/images/portfolio/contra-costa/finished-bathroom-04.jpg',
        'assets/images/portfolio/contra-costa/finished-bathroom-05.jpg',
        'assets/images/portfolio/contra-costa/finished-bathroom-06.jpg',
        'assets/images/portfolio/contra-costa/finished-bathroom-07.jpg',
        'assets/images/portfolio/contra-costa/finished-bedroom-01.jpg',
        'assets/images/portfolio/contra-costa/finished-bedroom-02.jpg',
        'assets/images/portfolio/contra-costa/finished-bedroom-03.jpg',
        'assets/images/portfolio/contra-costa/finished-bedroom-04.jpg',
        'assets/images/portfolio/contra-costa/finished-bedroom-05.jpg',
        'assets/images/portfolio/contra-costa/finished-bedroom-06.jpg',
        'assets/images/portfolio/contra-costa/finished-bedroom-07.jpg',
        'assets/images/portfolio/contra-costa/finished-bedroom-08.jpg',
        'assets/images/portfolio/contra-costa/finished-bedroom-09.jpg',
        'assets/images/portfolio/contra-costa/finished-dining-01.jpg',
        'assets/images/portfolio/contra-costa/finished-interior-01.jpg',
        'assets/images/portfolio/contra-costa/finished-interior-02.jpg',
        'assets/images/portfolio/contra-costa/finished-interior-03.jpg',
        'assets/images/portfolio/contra-costa/finished-interior-04.jpg',
        'assets/images/portfolio/contra-costa/finished-interior-05.jpg',
        'assets/images/portfolio/contra-costa/finished-interior-06.jpg',
        'assets/images/portfolio/contra-costa/finished-kitchen-01.jpg',
        'assets/images/portfolio/contra-costa/finished-kitchen-02.jpg',
        'assets/images/portfolio/contra-costa/finished-kitchen-03.jpg',
        'assets/images/portfolio/contra-costa/finished-kitchen-04.jpg',
        'assets/images/portfolio/contra-costa/finished-kitchen-05.jpg',
        'assets/images/portfolio/contra-costa/finished-kitchen-06.jpg',
        'assets/images/portfolio/contra-costa/finished-livingroom-01.jpg',
        'assets/images/portfolio/contra-costa/finished-livingroom-02.jpg',
        'assets/images/portfolio/contra-costa/finished-livingroom-03.jpg',
        'assets/images/portfolio/contra-costa/finished-livingroom-04.jpg',
        'assets/images/portfolio/contra-costa/finished-livingroom-05.jpg',
        'assets/images/portfolio/contra-costa/finished-livingroom-06.jpg',
      ],
    },
    'san-jose': {
      tag: 'Home Remodeling 2024',
      title: 'The San Jose Project',
      location: 'San Jose, CA',
      summary: 'A full home remodel with kitchen and master bath updates, plus structural changes that removed and repositioned walls to create an open-concept living and dining area.',
      cover: 'assets/images/portfolio/san-jose/hero.jpg',
      meta: [
        { label: 'Scope', value: 'Full home remodel' },
        { label: 'Type', value: 'Home Remodeling' },
        { label: 'Area', value: 'San Jose, CA' },
        { label: 'Status', value: 'Completed 2024' },
      ],
      gallery: [
        'assets/images/portfolio/san-jose/finished-kitchen-01.jpg',
        'assets/images/portfolio/san-jose/finished-kitchen-02.jpg',
        'assets/images/portfolio/san-jose/finished-master-bathroom-01.jpg',
        'assets/images/portfolio/san-jose/finished-master-bathroom-02.jpg',
        'assets/images/portfolio/san-jose/finished-master-bathroom-03.jpg',
      ],
    },
    'frostwood': {
      tag: 'Home Remodeling 2024',
      title: 'The Frostwood Project',
      location: 'Austin, TX',
      summary: 'A complete home rehabilitation in Austin with kitchen remodeling, bathroom updates, living-area reconfiguration, and backyard improvements including a pool.',
      cover: 'assets/images/portfolio/frostwood/hero.jpg',
      meta: [
        { label: 'Scope', value: 'Complete rehabilitation' },
        { label: 'Type', value: 'Home Remodeling' },
        { label: 'Area', value: 'Austin, TX' },
        { label: 'Status', value: 'Completed 2024' },
      ],
      gallery: [
        'assets/images/portfolio/frostwood/finished-backyard-01.jpg',
        'assets/images/portfolio/frostwood/finished-backyard-pool-01.jpg',
        'assets/images/portfolio/frostwood/finished-bathroom-01.jpg',
        'assets/images/portfolio/frostwood/finished-front-01.jpg',
        'assets/images/portfolio/frostwood/finished-kitchen-01.jpg',
        'assets/images/portfolio/frostwood/finished-kitchen-02.jpg',
        'assets/images/portfolio/frostwood/finished-livingroom-01.jpg',
        'assets/images/portfolio/frostwood/finished-livingroom-02.jpg',
        'assets/images/portfolio/frostwood/finished-stairs-01.jpg',
      ],
    },
    'delvin': {
      tag: 'Home Remodeling 2024',
      title: 'The Delvin Project',
      location: 'Austin, TX',
      summary: 'A complete home rehabilitation in Austin with refreshed living spaces and bathrooms, plus extensive backyard improvements including landscaping and a pool.',
      cover: 'assets/images/portfolio/delvin/hero.jpg',
      meta: [
        { label: 'Scope', value: 'Complete rehabilitation' },
        { label: 'Type', value: 'Home Remodeling' },
        { label: 'Area', value: 'Austin, TX' },
        { label: 'Status', value: 'Completed 2024' },
      ],
      gallery: [
        'assets/images/portfolio/delvin/finished-backyard-01.jpg',
        'assets/images/portfolio/delvin/finished-backyard-02.jpg',
        'assets/images/portfolio/delvin/finished-backyard-03.jpg',
        'assets/images/portfolio/delvin/finished-backyard-pool-01.jpg',
        'assets/images/portfolio/delvin/finished-bathroom-01.jpg',
        'assets/images/portfolio/delvin/finished-livingroom-01.jpg',
      ],
    },
    'belblossom': {
      tag: 'Home Remodeling 2025',
      title: 'Belblossom Rehab',
      location: 'San Jose, CA',
      summary: 'A comprehensive home rehabilitation in San Jose with a new kitchen, updated bathrooms, and refreshed living spaces throughout, modernized while preserving the existing structure and neighborhood character.',
      cover: 'assets/images/portfolio/belblossom/hero.jpg',
      meta: [
        { label: 'Scope', value: 'Complete rehabilitation' },
        { label: 'Type', value: 'Home Remodeling' },
        { label: 'Area', value: 'San Jose, CA' },
        { label: 'Status', value: 'Completed 2025' },
      ],
      gallery: [
        'assets/images/portfolio/belblossom/finished-back-patio.jpg',
        'assets/images/portfolio/belblossom/finished-bath-01.jpg',
        'assets/images/portfolio/belblossom/finished-bath-02.jpg',
        'assets/images/portfolio/belblossom/finished-bath-03.jpg',
        'assets/images/portfolio/belblossom/finished-fireplace.jpg',
        'assets/images/portfolio/belblossom/finished-kitchen-01.jpg',
        'assets/images/portfolio/belblossom/finished-kitchen-02.jpg',
        'assets/images/portfolio/belblossom/finished-kitchen-03.jpg',
        'assets/images/portfolio/belblossom/finished-kitchen-04.jpg',
        'assets/images/portfolio/belblossom/finished-kitchen-05.jpg',
        'assets/images/portfolio/belblossom/finished-living-room.jpg',
        'assets/images/portfolio/belblossom/build-01.jpg',
        'assets/images/portfolio/belblossom/build-02.jpg',
        'assets/images/portfolio/belblossom/build-03.jpg',
        'assets/images/portfolio/belblossom/build-04.jpg',
        'assets/images/portfolio/belblossom/build-05.jpg',
        'assets/images/portfolio/belblossom/build-06.jpg',
        'assets/images/portfolio/belblossom/build-07.jpg',
        'assets/images/portfolio/belblossom/build-08.jpg',
        'assets/images/portfolio/belblossom/build-09.jpg',
        'assets/images/portfolio/belblossom/build-10.jpg',
        'assets/images/portfolio/belblossom/build-11.jpg',
        'assets/images/portfolio/belblossom/build-12.jpg',
        'assets/images/portfolio/belblossom/build-13.jpg',
        'assets/images/portfolio/belblossom/build-14.jpg',
        'assets/images/portfolio/belblossom/IMG_6646.jpg',
      ],
    },
    aberdeen: {
      tag: 'Bathroom Remodeling 2024',
      title: 'The Aberdeen Project',
      location: 'Aberdeen, CA',
      summary: 'Bathroom and kitchen remodel that refreshed major living spaces with modern finishes.',
      cover: 'assets/images/portfolio/aberdeen/cover.webp',
      meta: [
        { label: 'Scope', value: 'Bathroom and kitchen remodel' },
        { label: 'Type', value: 'Bathroom Remodeling' },
        { label: 'Area', value: 'Aberdeen, CA' },
        { label: 'Status', value: 'Completed' },
      ],
      gallery: [
        'assets/images/portfolio/aberdeen/g01.webp',
        'assets/images/portfolio/aberdeen/g02.webp',
        'assets/images/portfolio/aberdeen/g03.webp',
        'assets/images/portfolio/aberdeen/g04.webp',
      ],
    },
    '100-unit-co-living': {
      tag: 'NCA Designs 2024',
      title: '100 Unit Co-Living',
      location: 'Campbell, California, USA',
      summary: 'A large-scale co-living concept designed to balance privacy, community, and efficient construction with two distinct interior directions for different resident lifestyles.',
      cover: 'assets/images/portfolio/100-unit-co-living/cover.jpg',
      meta: [
        { label: 'Scope', value: 'Co-living development concept' },
        { label: 'Type', value: 'Commercial / Multi-unit' },
        { label: 'Area', value: 'Campbell, California, USA' },
        { label: 'Status', value: 'Under construction' },
      ],
      gallery: [
        'assets/images/portfolio/100-unit-co-living/g01.jpg',
        'assets/images/portfolio/100-unit-co-living/g02.jpg',
        'assets/images/portfolio/100-unit-co-living/g03.jpg',
        'assets/images/portfolio/100-unit-co-living/g04.jpg',
      ],
    },
    'ncm-cafe': {
      tag: 'NCA Designs 2024',
      title: 'NCM Cafe',
      location: 'California, USA',
      summary: 'A futuristic cafe concept for entrepreneurs and creatives, combining robotic service ideas, flexible seating, and a bold mix of brick, metal, and smart technology.',
      cover: 'assets/images/portfolio/ncm-cafe/cover.jpg',
      meta: [
        { label: 'Scope', value: 'Cafe interior concept' },
        { label: 'Type', value: 'Commercial' },
        { label: 'Area', value: 'California, USA' },
        { label: 'Status', value: 'Under construction' },
      ],
      gallery: [
        'assets/images/portfolio/ncm-cafe/g01.jpg',
        'assets/images/portfolio/ncm-cafe/g02.jpg',
        'assets/images/portfolio/ncm-cafe/g03.jpg',
        'assets/images/portfolio/ncm-cafe/g04.jpg',
      ],
    },
    'bird': {
      tag: 'Custom Homes 2021',
      title: '1440 Bird Ave',
      location: 'San Jose, CA',
      summary: 'A major addition and whole-home remodel, the Sakhalkar Residence, expanding the home to four bedrooms, three bathrooms, and roughly 2,207 sq ft of living space, plus porch, patio, and an attached garage on a 7,405 sq ft lot.',
      cover: 'assets/images/portfolio/bird/img-9289.jpg',
      meta: [
        { label: 'Scope', value: 'Custom rebuild' },
        { label: 'Type', value: 'Custom Home' },
        { label: 'Area', value: 'San Jose, CA' },
        { label: 'Status', value: 'Completed July 2021' },
      ],
      gallery: [
        'assets/images/portfolio/bird/img-9342.jpg',
        'assets/images/portfolio/bird/img-9359.jpg',
        'assets/images/portfolio/bird/img-9288.jpg',
        'assets/images/portfolio/bird/img-9340.jpg',
        'assets/images/portfolio/bird/img-9283.jpg',
        'assets/images/portfolio/bird/img-9285.jpg',
        'assets/images/portfolio/bird/img-9286.jpg',
        'assets/images/portfolio/bird/img-9287.jpg',
        'assets/images/portfolio/bird/img-9297.jpg',
        'assets/images/portfolio/bird/img-9298.jpg',
        'assets/images/portfolio/bird/img-9303.jpg',
        'assets/images/portfolio/bird/img-9305.jpg',
        'assets/images/portfolio/bird/img-9307.jpg',
        'assets/images/portfolio/bird/img-9311.jpg',
        'assets/images/portfolio/bird/img-9312.jpg',
        'assets/images/portfolio/bird/img-9314.jpg',
        'assets/images/portfolio/bird/img-9315.jpg',
        'assets/images/portfolio/bird/img-9319.jpg',
        'assets/images/portfolio/bird/img-9320.jpg',
        'assets/images/portfolio/bird/img-9323.jpg',
        'assets/images/portfolio/bird/img-9329.jpg',
        'assets/images/portfolio/bird/img-9331.jpg',
        'assets/images/portfolio/bird/img-9346.jpg',
        'assets/images/portfolio/bird/img-9347.jpg',
        'assets/images/portfolio/bird/img-9348.jpg',
        'assets/images/portfolio/bird/img-9349.jpg',
        'assets/images/portfolio/bird/img-9350.jpg',
        'assets/images/portfolio/bird/img-9352.jpg',
        'assets/images/portfolio/bird/img-9354.jpg',
        'assets/images/portfolio/bird/img-9355.jpg',
        'assets/images/portfolio/bird/img-9356.jpg',
        'assets/images/portfolio/bird/img-9357.jpg',
        'assets/images/portfolio/bird/img-9358.jpg',
        'assets/images/portfolio/bird/img-9363.jpg',
        'assets/images/portfolio/bird/img-9364.jpg',
        'assets/images/portfolio/bird/img-9284.jpg',
        'assets/images/portfolio/bird/img-9292.jpg',
        'assets/images/portfolio/bird/img-9293.jpg',
        'assets/images/portfolio/bird/img-9301.jpg',
        'assets/images/portfolio/bird/img-9313.jpg',
        'assets/images/portfolio/bird/img-9316.jpg',
        'assets/images/portfolio/bird/img-9334.jpg',
        'assets/images/portfolio/bird/img-9344.jpg',
        'assets/images/portfolio/bird/img-9365.jpg',
        'assets/images/portfolio/bird/img-9367.jpg',
      ],
    },
    'curtiss': {
      tag: 'Custom Homes',
      title: 'Curtiss',
      location: 'San Jose, CA',
      summary: 'A complete custom home with a full kitchen, formal dining, multiple bedrooms and bathrooms, a private master suite, living and reading rooms, dedicated wine storage, and indoor-outdoor living across the front and back yards.',
      cover: 'assets/images/portfolio/curtiss/back11.jpg',
      meta: [
        { label: 'Scope', value: 'Whole-home project' },
        { label: 'Type', value: 'Custom Home' },
        { label: 'Area', value: 'San Jose, CA' },
        { label: 'Status', value: 'Completed' },
      ],
      gallery: [
        'assets/images/portfolio/curtiss/front3.jpg',
        'assets/images/portfolio/curtiss/back1.jpg',
        'assets/images/portfolio/curtiss/kitchen2.jpg',
        'assets/images/portfolio/curtiss/kitchen5.jpg',
        'assets/images/portfolio/curtiss/back2.jpg',
        'assets/images/portfolio/curtiss/living5.jpg',
        'assets/images/portfolio/curtiss/dining1.jpg',
        'assets/images/portfolio/curtiss/kitchen4.jpg',
        'assets/images/portfolio/curtiss/dining3.jpg',
        'assets/images/portfolio/curtiss/dining4.jpg',
        'assets/images/portfolio/curtiss/back7.jpg',
        'assets/images/portfolio/curtiss/back3.jpg',
        'assets/images/portfolio/curtiss/front2.jpg',
        'assets/images/portfolio/curtiss/kitchen6.jpg',
        'assets/images/portfolio/curtiss/back9.jpg',
        'assets/images/portfolio/curtiss/livingback4.jpg',
        'assets/images/portfolio/curtiss/livingback2.jpg',
        'assets/images/portfolio/curtiss/livingback3.jpg',
        'assets/images/portfolio/curtiss/master.jpg',
        'assets/images/portfolio/curtiss/master2.jpg',
        'assets/images/portfolio/curtiss/master4.jpg',
        'assets/images/portfolio/curtiss/bedroom1-3.jpg',
        'assets/images/portfolio/curtiss/bed3.jpg',
        'assets/images/portfolio/curtiss/kitchen7.jpg',
        'assets/images/portfolio/curtiss/bath4.jpg',
        'assets/images/portfolio/curtiss/livingroom-2.jpg',
        'assets/images/portfolio/curtiss/living4.jpg',
        'assets/images/portfolio/curtiss/room2.jpg',
        'assets/images/portfolio/curtiss/bedroom2.jpg',
        'assets/images/portfolio/curtiss/bed3-2.jpg',
        'assets/images/portfolio/curtiss/bed4.jpg',
        'assets/images/portfolio/curtiss/bed4-2.jpg',
        'assets/images/portfolio/curtiss/reading-room.jpg',
        'assets/images/portfolio/curtiss/readingroom-2.jpg',
        'assets/images/portfolio/curtiss/room4.jpg',
        'assets/images/portfolio/curtiss/room3.jpg',
        'assets/images/portfolio/curtiss/room3-2.jpg',
        'assets/images/portfolio/curtiss/stair.jpg',
        'assets/images/portfolio/curtiss/stair2.jpg',
        'assets/images/portfolio/curtiss/hall2.jpg',
        'assets/images/portfolio/curtiss/hallway.jpg',
        'assets/images/portfolio/curtiss/wine.jpg',
        'assets/images/portfolio/curtiss/wine-storage.jpg',
        'assets/images/portfolio/curtiss/front4.jpg',
        'assets/images/portfolio/curtiss/room5.jpg',
        'assets/images/portfolio/curtiss/room6.jpg',
        'assets/images/portfolio/curtiss/garage.jpg',
        'assets/images/portfolio/curtiss/laundry.jpg',
        'assets/images/portfolio/curtiss/before-front-house.jpg',
        'assets/images/portfolio/curtiss/front-left-1.jpg',
        'assets/images/portfolio/curtiss/front-left.jpg',
        'assets/images/portfolio/curtiss/back-right.jpg',
        'assets/images/portfolio/curtiss/back-1.jpg',
        'assets/images/portfolio/curtiss/back-2.jpg',
        'assets/images/portfolio/curtiss/back.jpg',
        'assets/images/portfolio/curtiss/front.jpg',
        'assets/images/portfolio/curtiss/dsc-0093.jpg',
        'assets/images/portfolio/curtiss/dsc-0116.jpg',
        'assets/images/portfolio/curtiss/dsc-0125.jpg',
        'assets/images/portfolio/curtiss/bed.jpg',
        'assets/images/portfolio/curtiss/kitchen-1.jpg',
        'assets/images/portfolio/curtiss/kitchen.jpg',
        'assets/images/portfolio/curtiss/kithcen.jpg',
        'assets/images/portfolio/curtiss/living-1.jpg',
        'assets/images/portfolio/curtiss/living-2.jpg',
        'assets/images/portfolio/curtiss/living.jpg',
        'assets/images/portfolio/curtiss/dsc-0100.jpg',
      ],
    },
    'castro-court': {
      tag: 'NCA Designs 2024',
      title: 'Castro Court',
      location: 'Campbell, California, USA',
      summary: 'A warm family home tailored for music, engineering, and everyday comfort, with a piano-centered living experience and cozy shared spaces.',
      cover: 'assets/images/portfolio/castro-court/cover.jpg',
      meta: [
        { label: 'Scope', value: 'Custom home design' },
        { label: 'Type', value: 'Custom Home' },
        { label: 'Area', value: 'Campbell, California, USA' },
        { label: 'Status', value: 'Under construction' },
      ],
      gallery: [
        'assets/images/portfolio/castro-court/g01.jpg',
        'assets/images/portfolio/castro-court/g02.jpg',
        'assets/images/portfolio/castro-court/g03.jpg',
        'assets/images/portfolio/castro-court/g04.jpg',
      ],
    },
    antonio: {
      tag: 'NCA Designs 2024',
      title: 'Antonio',
      location: 'Campbell, California, USA',
      summary: 'A multi-million-dollar villa concept shaped around harmony, greenery, skylit interiors, and strong visual connections across every floor.',
      cover: 'assets/images/portfolio/antonio/cover.jpg',
      meta: [
        { label: 'Scope', value: 'Luxury villa concept' },
        { label: 'Type', value: 'Custom Home' },
        { label: 'Area', value: 'Campbell, California, USA' },
        { label: 'Status', value: 'Under construction' },
      ],
      gallery: [
        'assets/images/portfolio/antonio/g01.jpg',
        'assets/images/portfolio/antonio/g02.jpg',
        'assets/images/portfolio/antonio/g03.jpg',
        'assets/images/portfolio/antonio/g04.jpg',
      ],
    },
    'calado-ave': {
      tag: 'NCA Designs 2024',
      title: 'Calado Ave',
      location: 'Campbell, California, USA',
      summary: 'A compact home for young couples, using an open minimalist layout, natural light, and refined detailing to make a smaller footprint feel elegant and warm.',
      cover: 'assets/images/portfolio/calado-ave/cover.jpg',
      meta: [
        { label: 'Scope', value: 'Compact home design' },
        { label: 'Type', value: 'Custom Home' },
        { label: 'Area', value: 'Campbell, California, USA' },
        { label: 'Status', value: 'Under construction' },
      ],
      gallery: [
        'assets/images/portfolio/calado-ave/g01.jpg',
        'assets/images/portfolio/calado-ave/g02.jpg',
        'assets/images/portfolio/calado-ave/g03.jpg',
        'assets/images/portfolio/calado-ave/g04.jpg',
      ],
    },
    'glen-dell': {
      tag: 'NCA Designs 2024',
      title: 'Glen Dell',
      location: 'Campbell, California, USA',
      summary: 'A spacious modern family home shaped around nature, openness, and daily togetherness, with seamless indoor-outdoor flow and calm contemporary materials.',
      cover: 'assets/images/portfolio/glen-dell/cover.jpg',
      meta: [
        { label: 'Scope', value: 'Family home design' },
        { label: 'Type', value: 'Custom Home' },
        { label: 'Area', value: 'Campbell, California, USA' },
        { label: 'Status', value: 'Under construction' },
      ],
      gallery: [
        'assets/images/portfolio/glen-dell/g01.jpg',
        'assets/images/portfolio/glen-dell/g02.jpg',
        'assets/images/portfolio/glen-dell/g03.jpg',
        'assets/images/portfolio/glen-dell/g04.jpg',
      ],
    },
  };

  const openProjectModal = (projectId) => {
    const detail = projectDetails[projectId];
    if (!detail) return;

    currentProjectId = projectId;

    modalHero.style.backgroundImage = `url('${detail.cover}')`;
    modalTitle.textContent = detail.title;
    modalLocation.textContent = detail.location;
    modalSummary.textContent = detail.summary;

    modalMeta.innerHTML = detail.meta
      .map((item) => `
        <article class="project-meta-item">
          <span class="project-meta-label">${item.label}</span>
          <span class="project-meta-value">${item.value}</span>
        </article>`)
      .join('');

    currentGalleryImages = detail.gallery.slice();

    modalGallery.innerHTML = detail.gallery
      .map((image, index) => `<button type="button" class="project-gallery-item" data-gallery-index="${index}" style="background-image:url('${image}')" aria-label="${detail.title}, ${detail.location} — open image ${index + 1}"></button>`)
      .join('');

    trackEvent('view_project_modal', {
      project_id: projectId,
      project_title: detail.title,
      project_location: detail.location,
    });

    projectModal.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  const closeProjectModal = () => {
    if (projectLightbox && !projectLightbox.hidden) {
      projectLightbox.hidden = true;
    }
    projectModal.hidden = true;
    document.body.style.overflow = '';
  };

  const updateLightboxImage = () => {
    if (!projectLightboxImage || !projectLightboxCount || !currentGalleryImages.length) return;
    projectLightboxImage.src = currentGalleryImages[currentGalleryIndex];
    const ld = projectDetails[currentProjectId];
    projectLightboxImage.alt = ld ? `${ld.title}, ${ld.location} — photo ${currentGalleryIndex + 1}` : '';
    projectLightboxCount.textContent = `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;
  };

  const openProjectLightbox = (startIndex) => {
    if (!projectLightbox || !currentGalleryImages.length) return;
    currentGalleryIndex = Math.max(0, Math.min(startIndex, currentGalleryImages.length - 1));
    updateLightboxImage();

    trackEvent('open_project_lightbox', {
      project_id: currentProjectId || 'unknown',
      image_index: currentGalleryIndex + 1,
    });

    projectLightbox.hidden = false;
  };

  const closeProjectLightbox = () => {
    if (!projectLightbox) return;
    projectLightbox.hidden = true;
  };

  const nextLightboxImage = () => {
    if (!currentGalleryImages.length) return;
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;
    updateLightboxImage();
  };

  const prevLightboxImage = () => {
    if (!currentGalleryImages.length) return;
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    updateLightboxImage();
  };

  // Board cards are now real <a> links to project detail pages; let native
  // navigation handle the click (no modal). Hover still shows the title-deed panel.
  void projectCardsForModal;

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProjectModal);
  }

  if (modalGallery) {
    modalGallery.addEventListener('click', (event) => {
      const target = event.target.closest('.project-gallery-item[data-gallery-index]');
      if (!target) return;
      const index = Number(target.dataset.galleryIndex || 0);
      openProjectLightbox(index);
    });
  }

  if (projectLightboxPrev) {
    projectLightboxPrev.addEventListener('click', prevLightboxImage);
  }

  if (projectLightboxNext) {
    projectLightboxNext.addEventListener('click', nextLightboxImage);
  }

  if (projectLightboxClose) {
    projectLightboxClose.addEventListener('click', closeProjectLightbox);
  }

  if (projectLightbox) {
    projectLightbox.addEventListener('click', (event) => {
      const target = event.target;
      if (target && target.dataset && target.dataset.lightboxClose === 'true') {
        closeProjectLightbox();
      }
    });
  }

  projectModal.addEventListener('click', (event) => {
    const target = event.target;
    if (target && target.dataset && target.dataset.projectClose === 'true') {
      closeProjectModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (projectLightbox && !projectLightbox.hidden) {
      if (event.key === 'Escape') {
        closeProjectLightbox();
        return;
      }
      if (event.key === 'ArrowRight') {
        nextLightboxImage();
        return;
      }
      if (event.key === 'ArrowLeft') {
        prevLightboxImage();
        return;
      }
    }

    if (event.key === 'Escape' && !projectModal.hidden) {
      closeProjectModal();
    }
  });
}

// ─── EVENT CALENDAR (Event page) ──────────────────────────────────────────────
const eventCalendarGrid = document.getElementById('eventCalendarGrid');
const eventCalendarTitle = document.getElementById('eventCalendarTitle');
const eventMonthStrip = document.getElementById('eventMonthStrip');
const eventCalendarPrev = document.getElementById('eventCalendarPrev');
const eventCalendarNext = document.getElementById('eventCalendarNext');
const eventDetailModal = document.getElementById('eventDetailModal');
const eventDetailClose = document.getElementById('eventDetailClose');
const eventDetailType = document.getElementById('eventDetailType');
const eventDetailTitle = document.getElementById('eventDetailTitle');
const eventDetailDate = document.getElementById('eventDetailDate');
const eventDetailSummary = document.getElementById('eventDetailSummary');
const eventDetailTime = document.getElementById('eventDetailTime');
const eventDetailLocation = document.getElementById('eventDetailLocation');
const eventDetailHost = document.getElementById('eventDetailHost');
const eventDetailAudience = document.getElementById('eventDetailAudience');
const eventDetailNotes = document.getElementById('eventDetailNotes');

if (eventCalendarGrid && eventCalendarTitle && eventMonthStrip) {
  const eventEntries = [
    {
      id: 'bay-area-remodel-consultations',
      date: '2026-05-06',
      type: 'consultation',
      title: 'Bay Area Remodel Consultations',
      time: '10:00 AM - 12:00 PM',
      location: 'UniqHaus Studio, San Jose',
      summary: 'A focused consultation block for homeowners comparing remodel scope, timing, and permitting strategy before design development starts.',
      host: 'UniqHaus planning team',
      audience: 'Homeowners planning remodels or additions',
      notes: 'Bring any floor plans, inspiration images, or rough wish lists. The session is structured around scope clarity, feasibility, and next-step recommendations.'
    },
    {
      id: 'open-house-walkthrough',
      date: '2026-05-09',
      type: 'showcase',
      title: 'Open House Walkthrough',
      time: '1:30 PM - 3:30 PM',
      location: 'Willow Glen Project Site',
      summary: 'A guided walkthrough of a completed residential project, highlighting planning decisions, material selections, and construction details in the finished space.',
      host: 'UniqHaus project lead',
      audience: 'Prospective clients and referral partners',
      notes: 'Expect a short presentation, site circulation notes, and time for project-specific questions about budget, sequencing, and design choices.'
    },
    {
      id: 'material-finish-workshop',
      date: '2026-05-14',
      type: 'workshop',
      title: 'Material + Finish Workshop',
      time: '4:00 PM - 6:00 PM',
      location: 'Design Library',
      summary: 'A hands-on workshop covering material palettes, finish coordination, and how to narrow selections without losing cohesion across the home.',
      host: 'Interior design team',
      audience: 'Active design clients',
      notes: 'Samples, finish boards, and cabinet or stone options will be reviewed. Clients should arrive with preferred color families or reference images.'
    },
    {
      id: 'framing-progress-site-visit',
      date: '2026-05-21',
      type: 'site',
      title: 'Framing Progress Site Visit',
      time: '11:00 AM - 12:30 PM',
      location: 'Los Altos Build',
      summary: 'An in-field coordination visit during framing to review layout, critical dimensions, and alignment with the approved construction set.',
      host: 'Construction planning team',
      audience: 'Current build clients',
      notes: 'Closed-toe shoes are required. The visit covers framing checkpoints, pending site questions, and any decisions needed before the next trade phase.'
    },
    {
      id: 'adu-planning-session',
      date: '2026-05-27',
      type: 'consultation',
      title: 'ADU Planning Session',
      time: '9:30 AM - 11:00 AM',
      location: 'Virtual Meeting',
      summary: 'A planning session focused on ADU feasibility, site constraints, local code considerations, and realistic delivery paths for Bay Area properties.',
      host: 'Architecture + permitting team',
      audience: 'Homeowners exploring an ADU',
      notes: 'The team will review site conditions, target use cases, and likely approval constraints so the next design step is based on real planning inputs.'
    },
    {
      id: 'kitchen-reveal-evening',
      date: '2026-06-03',
      type: 'showcase',
      title: 'Kitchen Reveal Evening',
      time: '5:30 PM - 7:00 PM',
      location: 'Campbell Residence',
      summary: 'A reveal event centered on a completed kitchen transformation, including the design rationale, detailing strategy, and lessons from construction execution.',
      host: 'UniqHaus design-build team',
      audience: 'Prospective kitchen remodel clients',
      notes: 'This is a small-format event intended for clients researching kitchen remodels. The walkthrough ends with an open Q&A.'
    },
    {
      id: 'permitting-prep-workshop',
      date: '2026-06-11',
      type: 'workshop',
      title: 'Permitting Prep Workshop',
      time: '3:00 PM - 4:30 PM',
      location: 'UniqHaus Studio, San Jose',
      summary: 'A workshop explaining what permit-ready packages need, how consultant coordination affects review time, and what clients should expect during submissions.',
      host: 'Permitting coordination team',
      audience: 'Clients entering permit phase',
      notes: 'The session covers documentation milestones, consultant inputs, city review timing, and the most common approval delays to plan around.'
    }
  ];

  const calendarYear = 2026;
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  const initialMonthIndex = today.getFullYear() === calendarYear ? today.getMonth() : 0;
  let viewingDate = new Date(calendarYear, initialMonthIndex, 1);

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const eventMap = eventEntries.reduce((map, entry) => {
    if (!map[entry.date]) {
      map[entry.date] = [];
    }

    map[entry.date].push(entry);
    return map;
  }, {});

  const eventEntryMap = eventEntries.reduce((map, entry) => {
    map[entry.id] = entry;
    return map;
  }, {});

  const detailDateFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const openEventDetail = (eventId) => {
    const entry = eventEntryMap[eventId];
    if (!entry || !eventDetailModal) return;

    const eventDate = new Date(`${entry.date}T12:00:00`);
    eventDetailType.textContent = entry.type;
    eventDetailTitle.textContent = entry.title;
    eventDetailDate.textContent = detailDateFormatter.format(eventDate);
    eventDetailSummary.textContent = entry.summary;
    eventDetailTime.textContent = entry.time;
    eventDetailLocation.textContent = entry.location;
    eventDetailHost.textContent = entry.host;
    eventDetailAudience.textContent = entry.audience;
    eventDetailNotes.textContent = entry.notes;

    trackEvent('view_event_detail', {
      event_id: entry.id,
      event_type: entry.type,
      event_title: entry.title,
    });

    eventDetailModal.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  const closeEventDetail = () => {
    if (!eventDetailModal) return;
    eventDetailModal.hidden = true;
    document.body.style.overflow = '';
  };

  const syncCalendarControls = () => {
    const activeMonth = viewingDate.getMonth();
    let activeMonthButton = null;

    eventMonthStrip.querySelectorAll('.event-month-pill').forEach((button) => {
      const monthIndex = Number(button.dataset.monthIndex);
      const isActive = monthIndex === activeMonth;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
      if (isActive) {
        activeMonthButton = button;
      }
    });

    activeMonthButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    if (eventCalendarPrev) {
      eventCalendarPrev.disabled = activeMonth === 0;
    }

    if (eventCalendarNext) {
      eventCalendarNext.disabled = activeMonth === 11;
    }
  };

  const renderCalendar = () => {
    const year = viewingDate.getFullYear();
    const month = viewingDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingDays = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const trailingDays = (7 - ((leadingDays + totalDays) % 7)) % 7;
    const totalCells = leadingDays + totalDays + trailingDays;
    const firstGridDay = new Date(year, month, 1 - leadingDays);
    const todayKey = formatDateKey(today);
    const fragments = [];

    eventCalendarTitle.textContent = monthFormatter.format(firstDay);

    weekdayLabels.forEach((label) => {
      fragments.push(`<div class="event-calendar-weekday">${label}</div>`);
    });

    for (let index = 0; index < totalCells; index += 1) {
      const cellDate = new Date(firstGridDay);
      cellDate.setDate(firstGridDay.getDate() + index);

      const dateKey = formatDateKey(cellDate);
      const items = eventMap[dateKey] || [];
      const isOutside = cellDate.getMonth() !== month;
      const isToday = dateKey === todayKey;
      const stateClasses = [
        'event-calendar-day',
        isOutside ? 'is-outside' : '',
        isToday ? 'is-today' : '',
        items.length ? 'has-events' : ''
      ].filter(Boolean).join(' ');
      const firstEventId = items[0]?.id || '';
      const dayAttributes = items.length
        ? `data-event-id="${firstEventId}" role="button" tabindex="0" aria-label="Open event details for ${cellDate.getDate()} ${monthFormatter.format(firstDay)}"`
        : '';

      const chipsMarkup = items.map((entry) => `
        <button class="event-chip event-chip--${entry.type}" type="button" data-event-id="${entry.id}" aria-label="Open details for ${entry.title}">
          <span class="event-chip-time">${entry.time}</span>
          <span class="event-chip-title">${entry.title}</span>
          <span class="event-chip-location">${entry.location}</span>
        </button>
      `).join('');

      fragments.push(`
        <div class="${stateClasses}" ${dayAttributes}>
          <span class="event-calendar-daynum">${cellDate.getDate()}</span>
          <div class="event-day-events">${chipsMarkup}</div>
        </div>
      `);
    }

    eventCalendarGrid.innerHTML = fragments.join('');
    syncCalendarControls();
  };

  eventMonthStrip.innerHTML = Array.from({ length: 12 }, (_, monthIndex) => {
    const label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(calendarYear, monthIndex, 1));
    return `<button class="event-month-pill" type="button" data-month-index="${monthIndex}" aria-pressed="false">${label}</button>`;
  }).join('');

  eventMonthStrip.addEventListener('click', (event) => {
    const button = event.target.closest('.event-month-pill[data-month-index]');
    if (!button) return;

    const monthIndex = Number(button.dataset.monthIndex);
    viewingDate = new Date(calendarYear, monthIndex, 1);
    trackEvent('view_event_month', {
      event_month_index: monthIndex + 1,
      click_text: normalizeTrackingText(button.textContent),
      placement: getTrackingPlacement(button),
    });
    renderCalendar();
  });

  eventCalendarPrev?.addEventListener('click', () => {
    if (viewingDate.getMonth() === 0) return;
    viewingDate = new Date(calendarYear, viewingDate.getMonth() - 1, 1);
    renderCalendar();
  });

  eventCalendarNext?.addEventListener('click', () => {
    if (viewingDate.getMonth() === 11) return;
    viewingDate = new Date(calendarYear, viewingDate.getMonth() + 1, 1);
    renderCalendar();
  });

  eventCalendarGrid.addEventListener('click', (event) => {
    const button = event.target.closest('.event-chip[data-event-id]');
    if (button) {
      openEventDetail(button.dataset.eventId);
      return;
    }

    const day = event.target.closest('.event-calendar-day[data-event-id]');
    if (!day) return;

    openEventDetail(day.dataset.eventId);
  });

  eventCalendarGrid.addEventListener('keydown', (event) => {
    const day = event.target.closest('.event-calendar-day[data-event-id]');
    if (!day) return;

    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openEventDetail(day.dataset.eventId);
  });

  eventDetailClose?.addEventListener('click', closeEventDetail);

  eventDetailModal?.addEventListener('click', (event) => {
    const target = event.target;
    if (target && target.dataset && target.dataset.eventClose === 'true') {
      closeEventDetail();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && eventDetailModal && !eventDetailModal.hidden) {
      closeEventDetail();
    }
  });

  renderCalendar();
}

/* ─── Back-to-top button (shown on every page) ─────────────────────────────── */
(function () {
  if (document.querySelector('.scroll-top-btn')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'scroll-top-btn';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 5l-7 7h4v7h6v-7h4z" fill="currentColor"/></svg>';
  document.body.appendChild(btn);
  const toggle = () => btn.classList.toggle('is-visible', window.scrollY > 400);
  window.addEventListener('scroll', toggle, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  toggle();
})();

// ─── SERVICE DETAIL MODAL (Services page) ──────────────────────────────────
const svcModal = document.getElementById('svcModal');
if (svcModal) {
  const serviceDetails = {
    'custom-homes': {
      title: 'Custom Homes', tagline: 'Your home, designed twice - then built once.',
      hero: 'assets/images/portfolio/curtiss/back11.jpg',
      overview: 'Ground-up custom homes built by one studio. We design every detail in full 3D first, itemize every material, then build - so there are no surprises between the plan you approve and the home you move into.',
      included: ['Full 2D + 3D design of the entire home', 'Permit-ready drawings and full agency management', 'Structural concrete, seismic, and liquefaction-zone expertise', 'Global material sourcing - from Italian marble to custom millwork', 'Itemized scope - every material priced line by line', 'Single point of contact from first sketch to final walkthrough'],
      points: ['Phase 1 design, Phase 2 build - all decisions locked before construction', 'The price you approve is the price you pay', 'Weekly photo updates and milestone reports'],
      meta: ['Timeline: 12-18 months (design 2-4, build 10-14)', 'Investment: $250-$500+/sq ft']
    },
    'home-remodeling': {
      title: 'Home Remodeling', tagline: 'Transform the home you already love.',
      hero: 'assets/images/portfolio/blair/hero.jpg',
      overview: 'Whole-house and room-by-room remodels designed in 3D before construction starts. From cosmetic refreshes to structural transformations, every finish is coordinated by one team.',
      included: ['Whole-house transformation with coordinated finishes', 'Open-floor-plan conversions (load-bearing wall removal)', 'Structural modifications, foundation work, seismic upgrades', 'Aging-in-place and accessibility updates', 'Full systems renewal - electrical, plumbing, waterproofing'],
      points: ['Structure first: foundation, framing, and waterproofing inspected before finishes', 'Designed in 3D before construction starts', 'Zero change orders when the full design phase is followed'],
      meta: ['Cosmetic: 4-6 months', 'Gut renovation: 8-12 months', 'Investment: $200-$400+/sq ft']
    },
    'home-additions': {
      title: 'Home Additions', tagline: 'Expand without moving.',
      hero: 'assets/images/portfolio/bird/img-9289.jpg',
      overview: 'Second-story additions, room expansions, and bump-outs that blend seamlessly with your existing home - backed by deep structural engineering.',
      included: ['Second-story additions with foundation verification', 'Room additions - bedrooms, family rooms, home offices', 'Bump-outs and extensions (kitchen, bath, sunroom)', 'Master-suite additions with en-suite and walk-in closet', 'Load-bearing modifications, foundation, and seismic work'],
      points: ['Structural capacity evaluated during the design phase', 'Designed in 3D before we build', 'Stay in your home where the addition allows'],
      meta: ['Most additions: 6-12 months', 'Second-story: 8-14 months', 'Investment: $250-$500/sq ft']
    },
    'kitchen-remodeling': {
      title: 'Kitchen Remodeling', tagline: 'See every cabinet before demolition day.',
      hero: 'assets/images/portfolio/design_your_room2.jpg',
      overview: 'The kitchen is the most complex room to remodel - every decision affects the next. We design it fully in 3D and lock all selections before any demolition begins.',
      included: ['Complete layout redesign optimizing the work triangle', 'Custom and semi-custom cabinetry', 'Stone countertops and backsplash', 'Lighting and electrical design', 'Plumbing fixtures and appliance integration', 'Flooring and interior painting'],
      points: ['Every cabinet, countertop, and fixture seen in 3D first', 'Appliance dimensions and clearances verified before construction', 'Selections locked - no mid-project swaps'],
      meta: ['Design: 3-6 weeks', 'Construction: 8-16 weeks', 'Investment: $75K-$200K+']
    },
    'bathroom-remodeling': {
      title: 'Bathroom Remodeling', tagline: 'Spa-like retreats, finalized before we start.',
      hero: 'assets/images/portfolio/ncadesigns7.jpg',
      overview: 'Custom tile, stone, and fixtures rendered in 3D so you finalize every detail before we begin - no mid-project tile regret or fixture swaps.',
      included: ['Full 3D rendering of the finished bathroom', 'Spa features - steam showers, freestanding tubs, heated floors', 'Custom tile and stone - porcelain, mosaic, natural stone', 'Fixture and plumbing upgrades', 'Accessibility options - curbless showers, grab bars', 'Multi-layer waterproofing with flood testing'],
      points: ['Line-item transparency for every material', 'Waterproofing flood-tested before tile goes in', 'Selections locked during design'],
      meta: ['Design: 2-4 weeks', 'Construction: 6-12 weeks', 'Investment: $35K-$150K+']
    },
    'adus': {
      title: 'ADUs', tagline: 'Designed and priced before we build.',
      hero: 'assets/images/portfolio/hawthorneAve/hero.jpg',
      overview: 'Detached, attached, and junior ADUs plus garage conversions - with full permit management under California ADU law (AB 68 / SB 13).',
      included: ['Detached ADUs (DADUs) up to 1,200 sq ft', 'Attached ADUs (AADUs) sharing walls and utilities', 'Junior ADUs (JADUs) under 500 sq ft', 'Garage conversions into living space', 'Full permit management from plans to final inspection'],
      points: ['Designed and priced in 3D before construction', 'Rental-ready where zoning allows, to help offset your mortgage', 'Structural and utility work engineered during design'],
      meta: ['Garage conversion: 4-6 months', 'Detached: 8-12 months', 'Investment: $120K-$500K+']
    },
    'garage-conversions': {
      title: 'Garage Conversions', tagline: 'The fastest way to add living space.',
      hero: 'assets/images/portfolio/blair/hero.jpg',
      overview: 'A garage conversion is the fastest, most affordable way to add functional living space - a studio, office, gym, or rental - without ground-up construction.',
      included: ['Full design phase with 3D visualization', 'Permit management and local code navigation', 'Structural and inspection oversight', 'Insulation, systems, and finishes', 'Weekly progress updates with photos'],
      points: ['Design-first - all decisions locked before build', '100% itemized pricing, no hidden allowances', 'Documented written approval before any extra work'],
      meta: ['Timeline: 4-6 months', 'Investment: $125K-$225K']
    },
    'commercial-buildout': {
      title: 'Commercial Buildout', tagline: 'Designed, permitted, and built under one roof.',
      hero: 'assets/images/portfolio/100-unit-co-living/cover.jpg',
      overview: 'Restaurants, cafes, bars, retail, and tenant improvements - with customer flow, finishes, and code handled in the design phase, not mid-construction.',
      included: ['Full 3D visualization of the space and customer flow', 'Tenant-improvement expertise for shell or existing spaces', 'Building permits, health-department, and fire-marshal approvals', 'ADA compliance and certificate-of-occupancy coordination', 'Equipment-vendor and signage coordination'],
      points: ['Compliance built into design, not an afterthought', 'One team from demolition through final inspection', 'Itemized pricing and weekly progress reporting'],
      meta: ['Schedule set in design phase', 'Investment: $150-$350+/sq ft']
    },
    'hotel-ffe': {
      title: 'Hotel FFE', tagline: 'Furniture, fixtures & equipment, sourced and installed.',
      hero: 'assets/images/portfolio/ncm-cafe/cover.jpg',
      overview: 'End-to-end FFE procurement and installation for hospitality projects - leveraging a global supply chain with on-site quality control before anything ships.',
      included: ['Global sourcing from international and domestic suppliers', 'End-to-end procurement coordination', 'Per-room furnishings - beds, desks, lighting, bath fixtures', 'On-site quality inspection before shipping', 'Professional installation by our team'],
      points: ['Every shipment inspected before installation', 'Buffer time built into every shipping schedule', 'Works with hotel chains and independent boutiques'],
      meta: ['Per room: $5K-$25K+', 'Sourced globally']
    },
    'seismic-retrofitting': {
      title: 'Seismic Retrofitting', tagline: 'Anchor your home against the next quake.',
      hero: 'assets/images/portfolio/curtiss/back11.jpg',
      overview: 'Strengthen the connection between your home and its foundation so the structure can resist lateral shaking - especially for Bay Area homes built before 1980.',
      included: ['Foundation bolting - mudsill to foundation', 'Cripple-wall bracing with structural plywood', 'Soft-story retrofitting with steel moment frames', 'Chimney bracing for masonry chimneys', 'Water-heater strapping to code'],
      points: ['Engineering, permitting, and inspections handled throughout', 'May qualify for California Earthquake Authority insurance discounts', 'Free assessment of your home vulnerabilities'],
      meta: ['Standard work: 3-5 days', 'With permitting: 2-6 months', 'From $3K-$7K+']
    },
    'termite-damage-repair': {
      title: 'Termite Damage Repair', tagline: 'Restore structural integrity after the clearance.',
      hero: 'assets/images/portfolio/hawthorneAve/hero.jpg',
      overview: 'Once a licensed pest-control company clears the infestation, we assess and repair all structural damage - from sill plates to subfloors - and restore finishes.',
      included: ['Wood-member replacement (studs, joists, beams, sill plates)', 'Subfloor repair and replacement', 'Framing and wall restoration', 'Drywall, insulation, and finish work', 'Code-compliance upgrades'],
      points: ['We assess from the pest report, then scope and quote', 'All work inspected before walls close', 'Detailed invoices provided for insurance claims'],
      meta: ['Minor repairs: 2-5 days', 'Extensive: 2-4 weeks', 'Estimate within 48 hours']
    }
  };

  const svcHero = document.getElementById('svcModalHero');
  const svcTitle = document.getElementById('svcModalTitle');
  const svcTagline = document.getElementById('svcModalTagline');
  const svcOverview = document.getElementById('svcModalOverview');
  const svcIncluded = document.getElementById('svcModalIncluded');
  const svcPoints = document.getElementById('svcModalPoints');
  const svcMeta = document.getElementById('svcModalMeta');

  const openServiceModal = (id) => {
    const d = serviceDetails[id];
    if (!d) return;
    svcHero.style.backgroundImage = "url('" + d.hero + "')";
    svcTitle.textContent = d.title;
    svcTagline.textContent = d.tagline;
    svcOverview.textContent = d.overview;
    svcIncluded.innerHTML = d.included.map(function (x) { return '<li>' + x + '</li>'; }).join('');
    svcPoints.innerHTML = d.points.map(function (x) { return '<li>' + x + '</li>'; }).join('');
    svcMeta.innerHTML = d.meta.map(function (x) { return '<span>' + x + '</span>'; }).join('');
    svcModal.hidden = false;
    document.body.style.overflow = 'hidden';
    svcModal.scrollTop = 0;
    trackEvent('view_service_modal', { service_id: id, service_title: d.title });
  };
  const closeServiceModal = () => { svcModal.hidden = true; document.body.style.overflow = ''; };

  document.querySelectorAll('.svc-icon-card[data-service]').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      openServiceModal(card.dataset.service);
    });
  });
  svcModal.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-svc-close')) closeServiceModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !svcModal.hidden) closeServiceModal();
  });
}
// ─── HERO BACKGROUND VIDEO (desktop only, respects reduced-motion) ──────────
(function(){
  var v = document.getElementById('heroVideo');
  if (!v) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia('(min-width: 768px)').matches;
  if (!wide || reduced) return;
  [['assets/video/hero-ht.webm','video/webm'], ['assets/video/hero-ht.mp4','video/mp4']].forEach(function(s){
    var el = document.createElement('source'); el.src = s[0]; el.type = s[1]; v.appendChild(el);
  });
  v.load();
  v.addEventListener('canplay', function(){
    v.classList.add('is-ready');
    var p = v.play();
    if (p && p.catch) { p.catch(function(){}); }
  });
})();
// ─── PROJECT GALLERY LIGHTBOX (detail pages) ───────────────────────────────
(function(){
  var gal = document.querySelector('.pgrid') || document.querySelector('.proj-gallery');
  if (!gal) return;
  var rev = gal.querySelectorAll('figure, .pgrid-label');
  if (rev.length) {
    var ro = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); ro.unobserve(e.target); } }); }, { threshold: 0.12 });
    rev.forEach(function(el){ ro.observe(el); });
  }
  var imgs = Array.prototype.slice.call(gal.querySelectorAll('img'));
  if (!imgs.length) return;
  var lb = document.createElement('div');
  lb.className = 'pglb'; lb.hidden = true;
  lb.innerHTML = '<button class="pglb-x" aria-label="Close">&times;</button>' +
    '<button class="pglb-nav pglb-prev" aria-label="Previous">&#8249;</button>' +
    '<img class="pglb-img" src="" alt="" />' +
    '<button class="pglb-nav pglb-next" aria-label="Next">&#8250;</button>' +
    '<p class="pglb-count"></p>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('.pglb-img');
  var lbCount = lb.querySelector('.pglb-count');
  var idx = 0;
  function show(i){ idx = (i + imgs.length) % imgs.length; lbImg.src = imgs[idx].src; lbImg.alt = imgs[idx].alt || ''; lbCount.textContent = (idx + 1) + ' / ' + imgs.length; }
  function open(i){ show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; }
  function close(){ lb.hidden = true; document.body.style.overflow = ''; }
  imgs.forEach(function(im, i){ im.addEventListener('click', function(){ open(i); }); });
  lb.querySelector('.pglb-prev').addEventListener('click', function(e){ e.stopPropagation(); show(idx - 1); });
  lb.querySelector('.pglb-next').addEventListener('click', function(e){ e.stopPropagation(); show(idx + 1); });
  lb.querySelector('.pglb-x').addEventListener('click', close);
  lb.addEventListener('click', function(e){ if (e.target === lb) close(); });
  document.addEventListener('keydown', function(e){ if (lb.hidden) return; if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(idx - 1); else if (e.key === 'ArrowRight') show(idx + 1); });
  var sx = 0;
  lb.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function(e){ var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(dx < 0 ? idx + 1 : idx - 1); }, { passive: true });
})();
// ─── PROJECT SLIDESHOW (horizontal editorial gallery) ──────────────────────
(function(){
  var show = document.querySelector('.pshow');
  if (!show) return;
  var track = show.querySelector('.pshow-track');
  var slides = Array.prototype.slice.call(track.querySelectorAll('.pshow-slide'));
  if (!slides.length) return;
  var pad = track.querySelector('.pshow-spacer').offsetWidth;
  var intro = show.querySelector('.pshow-intro');
  var counter = show.querySelector('.pshow-counter');
  var zL = show.querySelector('.pshow-zone.l');
  var zR = show.querySelector('.pshow-zone.r');
  var idx = 0, maxScroll = 0;
  function measure(){ maxScroll = Math.max(0, track.scrollWidth - show.clientWidth); }
  function p2(n){ return (n < 10 ? '0' : '') + n; }
  function apply(){
    var x = slides[idx].offsetLeft - pad;
    if (x > maxScroll) x = maxScroll; if (x < 0) x = 0;
    track.style.transform = 'translateX(' + (-x) + 'px)';
    if (intro) intro.classList.toggle('hide', idx > 0);
    if (counter) counter.textContent = p2(idx + 1) + ' / ' + p2(slides.length);
    if (zL) zL.classList.toggle('off', idx <= 0);
    if (zR) zR.classList.toggle('off', x >= maxScroll - 1);
  }
  function go(i){ idx = Math.max(0, Math.min(slides.length - 1, i)); apply(); }
  if (zL) zL.addEventListener('click', function(){ go(idx - 1); });
  if (zR) zR.addEventListener('click', function(){ go(idx + 1); });
  document.addEventListener('keydown', function(e){ if (e.key === 'ArrowLeft') go(idx - 1); else if (e.key === 'ArrowRight') go(idx + 1); });
  var sx = 0;
  show.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, { passive: true });
  show.addEventListener('touchend', function(e){ var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1); }, { passive: true });
  window.addEventListener('resize', function(){ measure(); apply(); });
  var imgs = track.querySelectorAll('img'), left = imgs.length;
  function done(){ if (--left <= 0){ measure(); apply(); } }
  imgs.forEach(function(im){ if (im.complete) done(); else { im.addEventListener('load', done); im.addEventListener('error', done); } });
  measure(); apply();
})();