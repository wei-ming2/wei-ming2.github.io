const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
// One documented DNS exercise, followed by an illustrative policy comparison.
const alphaPreview = $("#alpha-preview");
const alphaNext = $("#alpha-next");
if (alphaPreview && alphaNext) {
  let stepIndex = 0;
  const steps = [
    {
      phase: "prepare", title: "A SYSTEM IS COMPROMISED", observer: "generator",
      evidence: "AlphaGen · compromised computer", address: "192.168.1.20", next: "Encode in DNS →",
      caption: "An attacker has gained access to an internal system and wants to steal its secrets. Email and uploads could be flagged and blocked, so they turn to DNS.",
    },
    {
      phase: "capture", title: "HIDING THE SECRET IN DNS", observer: "generator",
      evidence: "Wireshark · capture on AlphaGen", address: "192.168.1.20", next: "Check policy →",
      caption: "DNS normally looks up website addresses. AlphaGen hides `secret` in the query names, one character at a time. Wireshark records the requests sent to the attacker’s server.",
    },
    {
      phase: "policy", title: "THE DATA GOES UNNOTICED", observer: "firewall",
      evidence: "Firewall · baseline decision", address: "192.168.1.1", next: "Verify receiver →",
      caption: "Here, the firewall checks addresses and ports but doesn’t inspect the DNS query names. The hidden data passes through unnoticed.",
    },
    {
      phase: "outcome", title: "THE SECRET ARRIVES", observer: "responder",
      evidence: "AlphaRes · attacker’s server", address: "203.0.113.20", next: "Try Restricted DNS →",
      caption: "The queries reach the attacker’s server, where AlphaRes reconstructs `secret`. The secret has successfully been transmitted outside the internal network.",
    },
    {
      phase: "compare", title: "STOPPING THE SAME TRANSFER", observer: "firewall",
      evidence: "Firewall · same queries, two policies", address: "192.168.1.1", next: "Restart ↻",
      caption: "Now DNS requests can only go to approved servers. The attacker’s server at `203.0.113.20` isn’t on the list, so this transfer is stopped.",
    },
  ];

  const caption = $("#alpha-explanation");
  const captionMeasure = document.createElement("p");
  captionMeasure.className = "alpha-caption-measure";
  captionMeasure.setAttribute("aria-hidden", "true");
  caption.parentElement.append(captionMeasure);
  let captionSizeKey = "";
  let captionFrame = 0;

  function writeAlphaCaption(target, text) {
    target.replaceChildren(...text.split(/`([^`]+)`/g).map((part, index) => {
      if (index % 2 === 0) return document.createTextNode(part);
      const code = document.createElement("code");
      code.textContent = part;
      return code;
    }));
  }

  // Reserve the tallest paragraph at the actual font and width, independent of stage.
  function measureAlphaCaptions() {
    const width = caption.getBoundingClientRect().width;
    if (!width) return;
    const style = getComputedStyle(caption);
    const key = `${width}:${style.font}:${style.letterSpacing}`;
    if (captionSizeKey === key) return;
    captionSizeKey = key;
    captionMeasure.style.width = `${width}px`;
    let height = Number.parseFloat(style.lineHeight) * 3;
    steps.forEach((step) => {
      writeAlphaCaption(captionMeasure, step.caption);
      height = Math.max(height, captionMeasure.getBoundingClientRect().height);
    });
    alphaPreview.style.setProperty("--alpha-caption-height", `${Math.ceil(height)}px`);
  }

  function scheduleCaptionMeasurement() {
    cancelAnimationFrame(captionFrame);
    captionFrame = requestAnimationFrame(measureAlphaCaptions);
  }

  function renderAlpha() {
    const step = steps[stepIndex];
    const compared = step.phase === "compare";
    const received = step.phase === "outcome";
    alphaPreview.dataset.phase = step.phase;
    alphaPreview.dataset.policy = compared ? "restricted" : "baseline";
    alphaPreview.dataset.observer = step.observer;
    $("#alpha-progress").textContent = `${stepIndex + 1} / ${steps.length}`;
    $("#alpha-step-title").textContent = step.title;
    $("#alpha-evidence-title").textContent = step.evidence;
    $("#alpha-evidence-address").textContent = step.address;
    $("#alpha-rule-state").textContent = compared ? "Restricted DNS" : "Baseline";
    $("#alpha-buffer").textContent = compared ? "No data" : received ? "secret" : "Empty";
    $("#alpha-firewall-log").textContent = stepIndex >= 2
      ? `00:01 action=${compared ? "drop" : "pass"}\nsrc=192.168.1.20\ndst=203.0.113.20\nproto=udp dport=53\npolicy=${compared ? "restricted-dns" : "baseline"}\n${compared ? "reason=unapproved-dns" : "reason=direct-dns"}`
      : "";
    $("#alpha-receiver-log").textContent = received ? "00:07 status=complete\nmarker=www.chess.com" : "";
    $("#alpha-recovery").textContent = received ? "Received data: secret" : "";
    alphaPreview.querySelectorAll("[data-alpha-view]").forEach((view) => {
      view.hidden = view.dataset.alphaView !== step.phase;
    });
    alphaPreview.querySelectorAll("[data-alpha-node]").forEach((node) => {
      node.classList.toggle("is-current", node.dataset.alphaNode === step.observer);
    });
    alphaNext.textContent = step.next;
    writeAlphaCaption(caption, step.caption);
    $("#alpha-status").textContent = `Step ${stepIndex + 1} of ${steps.length}. ${caption.textContent}`;
  }

  alphaNext.addEventListener("click", () => {
    stepIndex = (stepIndex + 1) % steps.length;
    renderAlpha();
  });
  if ("ResizeObserver" in window) {
    const captionObserver = new ResizeObserver(scheduleCaptionMeasurement);
    captionObserver.observe(alphaPreview);
    captionObserver.observe(caption);
  } else {
    addEventListener("resize", scheduleCaptionMeasurement);
  }
  if (document.fonts) {
    const refreshCaptionFont = () => {
      captionSizeKey = "";
      scheduleCaptionMeasurement();
    };
    document.fonts.ready.then(refreshCaptionFont);
    document.fonts.addEventListener("loadingdone", refreshCaptionFont);
  }
  renderAlpha();
  alphaNext.hidden = false;
  measureAlphaCaptions();
}

// Retained templates initialise only when their complete controls are present.
const motionToggle = $("#motion-toggle");
const prismPreview = $(".prism-preview");
const motionCaption = $("#motion-caption");
if (motionToggle && prismPreview && motionCaption) {
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  motionToggle.addEventListener("click", () => {
    const enabled = motionToggle.getAttribute("aria-checked") !== "true";
    motionToggle.setAttribute("aria-checked", String(enabled));
    prismPreview.classList.toggle("paused", !enabled);
    motionCaption.textContent = enabled
      ? reduced()
        ? "Your system prefers reduced motion."
        : "Small movements. Clear feedback."
      : "Motion paused. Your choice stays in control.";
  });
  if (reduced()) motionCaption.textContent = "Your system prefers reduced motion.";
}

const markdownSource = $("#markdown-source");
const markdownOutput = $("#markdown-output");
if (markdownSource && markdownOutput) {
  function renderMarkdown() {
    const fragment = document.createDocumentFragment();
    let list = null;
    markdownSource.value.split("\n").forEach((rawLine) => {
      const line = rawLine.trimStart();
      if (line.startsWith("- ")) {
        if (!list) {
          list = document.createElement("ul");
          fragment.append(list);
        }
        const item = document.createElement("li");
        item.textContent = line.slice(2);
        list.append(item);
        return;
      }
      list = null;
      if (!line.trim()) return;
      const heading = line.match(/^(#{1,3})\s+(.*)/);
      const element = document.createElement(heading ? `h${Number(heading[1].length) + 3}` : "p");
      element.textContent = heading ? heading[2] : line;
      fragment.append(element);
    });
    markdownOutput.replaceChildren(fragment);
  }
  markdownSource.addEventListener("input", renderMarkdown);
  renderMarkdown();
}

const portfolioPreview = $(".portfolio-preview");
const portfolioBreakpoints = $$("[data-preview-breakpoint]");
const portfolioLayouts = {
  375: "Mobile",
  768: "Tablet",
  1440: "Desktop",
};
portfolioBreakpoints.forEach((button) => {
  button.addEventListener("click", () => {
    const width = button.dataset.previewBreakpoint;
    portfolioPreview.dataset.previewWidth = width;
    portfolioBreakpoints.forEach((option) => {
      option.setAttribute("aria-pressed", String(option === button));
    });
    portfolioPreview.querySelector(".portfolio-preview-caption").textContent =
      `${portfolioLayouts[width]} layout · ${width}px reference`;
  });
});
const stories = {
  alpharegen: {
    label: "ENGINEERING CASE STUDY / ALPHAREGEN V1",
    title: "Traffic generation, firewall policy, and packet evidence in one testbed",
    body: /* HTML */ `
      <h3>Problem and my contribution</h3>
      <p>
        Lecturers needed practical exercises without spending each lesson setting
        up individual services. AlphaReGen paired a Python command-line traffic
        generator, AlphaGen, with a responder, AlphaRes, in a reusable VMware lab.
        I led the five-person team, built the shared software architecture, and
        implemented port-scanning and ARP exercises. I integrated and standardised
        teammates’ protocol modules and troubleshot their behaviour on Oracle
        Linux. Firewall configuration and testing were team deliverables.
      </p>
      <h3>Generator–responder design</h3>
      <p>
        AlphaGen selects protocol handlers and coordinates AlphaRes over a TCP
        command channel, separate from the exercise traffic. AlphaRes starts the
        matching service as a subprocess. Shared helpers provide menus, input
        validation, learner explanations and Wireshark filters, giving contributed
        modules a consistent interface. Interactive and verbose modes expose
        inputs and response details so learners can connect each command to the
        resulting traffic. Scapy crafts packets for header-level
        exercises; application services use libraries such as Paramiko,
        pyftpdlib, and Flask with SQLite. This distinction lets students examine
        both packet behaviour and service interactions without manually setting
        up each target.
      </p>
      <h3>Network and firewall testing</h3>
      <p>
        The testbed separated Inside, Outside and DMZ networks. A Linux cloud
        simulator handled routing and NAT; a dedicated management client provided
        firewall administration access. Our team configured Palo Alto and pfSense
        firewalls and tested traffic across these boundaries. We generated known
        actions, compared firewall records and Wireshark captures with responder
        output, then adjusted policy and repeated the test. Results documented
        which transfers were stopped, which reached the responder, and what the
        captures showed under the tested configurations. These were lab findings,
        not general rankings of either product.
      </p>
      <h3>What the DNS exercise demonstrates</h3>
      <p>
        In the documented DNS Exfiltration Raw exercise, AlphaGen sends crafted
        queries directly to AlphaRes. Each <code>www.youtube.com.sgX</code> name
        carries a character; <code>www.chess.com</code> signals completion.
        AlphaRes reconstructs the data. These names are signalling strings, not
        requests to the public websites. The concept demo shows how network rules
        can forward DNS without inspecting query names. Its comparison repeats
        the traffic under an illustrative destination restriction: only approved
        DNS servers are reachable. This stops the transfer without claiming that
        the firewall recognised the hidden secret.
      </p>
      <h3>Handover and lessons</h3>
      <p>
        The handover included user and developer documentation, a firewall
        administration guide, configuration exports and a setup script for
        rebuilding the environment. The project received Grade A, and AlphaReGen
        v1 was integrated into Singapore Polytechnic’s
        <a href="https://www.sp.edu.sg/courses/schools/soc/cybersecurity-digital-forensics#section-2" target="_blank" rel="noopener noreferrer">Cybersecurity Infrastructure Configuration module</a>.
        A future revision would add responder readiness checks, strengthen
        subprocess cleanup, and introduce packet-capture regression tests to
        catch integration failures before classroom use.
      </p>
      <p class="alpha-case-stack">
        Python / Scapy / Socket programming / VMware / Oracle Linux /
        Network segmentation / NAT / Firewall policy / pfSense / Palo Alto /
        Wireshark / Packet analysis
      </p>
    `,
  },
  prism: {
    label: "PROJECT 03 / DESIGN DECISIONS",
    title: "Prism UI: the switch is the small part",
    body: /* HTML */ `
      <p>
        A toggle looks like a track and a thumb. Its behaviour includes a name,
        a state, a keyboard interaction, visible focus, and a decision about
        what happens when motion is unwanted.
      </p>
      <h3>Start with the browser</h3>
      <p>
        The demo uses a real button with <code>role="switch"</code> and an
        explicit <code>aria-checked</code> state. It is reachable with Tab and
        works with Space or Enter.
      </p>
      <h3>Motion should explain a change</h3>
      <p>
        The movement between on and off connects the two states. The small
        interaction study pauses when the control is switched off. A system
        preference for reduced motion takes precedence over decorative
        animation.
      </p>
      <h3>A smaller primitive</h3>
      <p>
        The aim of the project concept is to expose behaviour without dictating
        the whole appearance. A consumer should be able to choose a different
        size or colour without reimplementing keyboard support.
      </p>
      <p>
        The preview here is plain JavaScript and CSS; the larger reference
        project is a React component library concept.
      </p>
    `,
  },
  markdown: {
    label: "PROJECT 04 / IMPLEMENTATION NOTES",
    title: "MarkdownPress: a short feedback loop",
    body: /* HTML */ `
      <p>
        There is something useful about a tool whose entire job fits on one
        line: turn a directory of Markdown into a directory of HTML.
      </p>
      <h3>The smallest useful pipeline</h3>
      <pre>
source files
  → parser
  → syntax tree
  → page template
  → static HTML</pre
      >
      <p>
        The reference concept explores Zig and Bun for the compiler and
        development workflow. A first version needs predictable output and clear
        errors before it needs incremental caching.
      </p>
      <h3>The cache question</h3>
      <p>
        A cache only helps when its inputs are defined. Source text is one
        input; templates, parser versions, and syntax-highlighting rules can all
        affect the final page too.
      </p>
      <h3>About the editor</h3>
      <p>
        The editor on this site is an intentionally small browser
        implementation. It supports headings, paragraphs, and bullet lists. It
        inserts text through the DOM rather than interpreting user input as
        HTML.
      </p>
      <p>
        Try adding a new heading or changing a list item. This demonstrates the
        feedback loop, not the performance of a native compiler.
      </p>
    `,
  },
  colophon: {
    label: "ABOUT THIS SITE",
    title: "A personal site with room for the details",
    body: /* HTML */ `
      <p>
        I built this space to document my academic journey, professional experiences, projects and interests. 
        It is a space to showcase what I have worked on, reflect on what I have learnt, and share what I hope to explore next.
      </p>
      <h3>Built with</h3>
      <p>
        The visual direction was developed in Stitch, with Codex assisting in the implementation. 
        The website is built using plain HTML, CSS and JavaScript. 
        SVG powers the custom visual elements.
      </p>
      <p>
        The code and final details were reviewed and refined by hand. 
        The design uses Manrope and JetBrains Mono typography, paired with a warm neutral palette, charcoal text and a clay accent.
      </p>
      <h3>Design references</h3>
      <p>
        The <a href="https://github.com/Evavic44/portfolio-ideas" target="_blank" rel="noopener noreferrer">Portfolio Ideas collection</a>
        informed the broader direction.
        <a href="https://www.taniarascia.com/" target="_blank" rel="noopener noreferrer">Tania Rascia</a>
        and <a href="https://victoreke.com/" target="_blank" rel="noopener noreferrer">Victor Eke</a>
        inspired how projects, writing and experiences are presented with room to breathe.
      </p>
    `,
  },
};
const reader = $("#reader");
const readerTitle = $("#reader-title");
const readerBody = $("#reader-body");
let readerKind = null;
let readerReturnFocus = null;

function showReader(label, title, kind = "case") {
  readerKind = kind;
  $("#reader-label").textContent = label;
  readerTitle.textContent = title;
  if (!reader.open) reader.showModal();
  reader.scrollTop = 0;
}

function addPlaceholderNotice() {
  const notice = document.createElement("p");
  notice.className = "placeholder-notice";
  notice.textContent =
    "Retained placeholder content from the original design; not documented in my résumé.";
  readerBody.prepend(notice);
}

$$("[data-story]").forEach((button) => {
  button.addEventListener("click", () => {
    const story = stories[button.dataset.story];
    if (!story) return;
    readerReturnFocus = button;
    readerBody.innerHTML = story.body;
    const placeholder = ["prism", "markdown"].includes(button.dataset.story);
    if (placeholder) addPlaceholderNotice();
    showReader(placeholder ? `PLACEHOLDER / ${story.label}` : story.label, story.title);
  });
});

function appendThoughtText(element, content) {
  let offset = 0;
  for (const match of content.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi)) {
    const [markdown, label, href] = match;
    const link = document.createElement("a");
    link.textContent = label;
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    element.append(content.slice(offset, match.index), link);
    offset = match.index + markdown.length;
  }
  element.append(content.slice(offset));
}

function renderThoughtBody(markdown) {
  const body = document.createDocumentFragment();
  let paragraph = [];
  function appendParagraph() {
    if (!paragraph.length) return;
    const element = document.createElement("p");
    appendThoughtText(element, paragraph.join(" "));
    body.append(element);
    paragraph = [];
  }

  for (const line of markdown.trim().split(/\r?\n/)) {
    const content = line.trim();
    const heading = content.match(/^##\s+(.+)$/);
    if (!content || heading || content === "---") {
      appendParagraph();
      if (heading) {
        const element = document.createElement("h3");
        appendThoughtText(element, heading[1]);
        body.append(element);
      } else if (content === "---") {
        body.append(document.createElement("hr"));
      }
    } else {
      paragraph.push(content);
    }
  }
  appendParagraph();
  return body;
}

async function readThought(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);

  const markdown = (await response.text()).trim();
  const frontMatter = markdown.match(
    /^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/,
  );
  const article = frontMatter?.[2].trim().match(/^#[ \t]+([^\r\n]+)([\s\S]*)$/);
  if (!article) throw new Error(`${url}: missing metadata or title`);

  const metadata = Object.fromEntries(
    Array.from(
      frontMatter[1].matchAll(/^([a-z]+):[ \t]*(.*)$/gm),
      ([, key, value]) => [key, value.trim()],
    ),
  );
  const { category, excerpt, minutes } = metadata;
  if (!category || !excerpt || !/^[1-9]\d*$/.test(minutes)) {
    throw new Error(`${url}: incomplete article metadata`);
  }

  return {
    category,
    excerpt,
    minutes,
    title: article[1].trim(),
    body: article[2],
  };
}

const thoughtEntries = new Map();
let readerRouteRequest = 0;
let readerClosing = false;

function thoughtSlug() {
  if (!location.hash.startsWith("#thought/")) return null;
  try {
    return decodeURIComponent(location.hash.slice("#thought/".length));
  } catch {
    return "";
  }
}

function populateThoughtLink(link, { category, title, excerpt, minutes }) {
  link.replaceChildren();
  for (const [className, text] of [
    ["note-category", category],
    ["note-title", title],
    ["note-excerpt", excerpt],
    ["note-time", `${minutes} min read`],
  ]) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    link.append(span);
  }
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  link.querySelector(".note-title").append(arrow);
  link.hidden = false;
}

function closeDialog() {
  reader.close();
  readerKind = null;
  readerReturnFocus?.focus({ preventScroll: true });
  readerReturnFocus = null;
}

async function syncThoughtRoute() {
  const slug = thoughtSlug();
  const request = ++readerRouteRequest;
  readerClosing = false;
  if (slug === null) {
    if (readerKind === "thought") closeDialog();
    return;
  }

  const entry = thoughtEntries.get(slug);
  readerReturnFocus = entry?.link || $("#notes-heading");
  const article = entry ? await entry.ready : null;
  if (request !== readerRouteRequest || thoughtSlug() !== slug) return;

  if (article) {
    readerBody.replaceChildren(renderThoughtBody(article.body));
    showReader(article.category, article.title, "thought");
  } else {
    const message = document.createElement("p");
    message.textContent = entry
      ? "This article could not be loaded. You can try its Markdown source or return to Thoughts."
      : "This article isn’t available. Return to Thoughts to see the current writing.";
    readerBody.replaceChildren(message);
    if (entry) {
      const source = document.createElement("a");
      source.href = entry.url;
      source.textContent = "Open the Markdown source ↗";
      readerBody.append(source);
    }
    showReader("THOUGHTS", entry ? "Article unavailable" : "Thought not found", "thought");
  }
  scheduleSidebarUpdate();
}

$$(".writing-list > [data-thought]").forEach((link) => {
  const filename = link.dataset.thought;
  const slug = filename.replace(/\.md$/, "");
  const url = `thoughts/${encodeURIComponent(filename)}`;
  const entry = { link, url };
  thoughtEntries.set(slug, entry);
  entry.ready = readThought(url).then((article) => {
    populateThoughtLink(link, article);
    return article;
  }).catch(() => {
    link.href = url;
    link.textContent = `Open ${filename} ↗`;
    link.hidden = false;
    return null;
  });
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !link.hash.startsWith("#thought/")) return;
    event.preventDefault();
    if (location.hash !== link.hash) {
      history.pushState({ portfolioThought: true }, "", link.hash);
    }
    void syncThoughtRoute();
  });
});

function closeReader() {
  if (readerClosing) return;
  if (readerKind === "thought" && thoughtSlug() !== null) {
    readerClosing = true;
    if (history.state?.portfolioThought) {
      history.back();
    } else {
      history.replaceState(null, "", "#notes");
      ++readerRouteRequest;
      closeDialog();
      $("#notes").scrollIntoView();
      readerClosing = false;
      scheduleSidebarUpdate();
    }
  } else {
    closeDialog();
  }
}
$("#close-reader").addEventListener("click", closeReader);
$("#reader-done").addEventListener("click", closeReader);
reader.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeReader();
});
reader.addEventListener("click", (event) => {
  const rect = reader.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
    closeReader();
  }
});
addEventListener("hashchange", syncThoughtRoute);
addEventListener("popstate", syncThoughtRoute);
$("#copy-email").addEventListener("click", async () => {
  await navigator.clipboard.writeText("fooweiming1@gmail.com");
  $("#copy-email").textContent = "Copied ✓";
});
const pageSections = $$("main > section");
const mainNavLinks = $$(".sidebar nav > a");
let navUpdatePending = false;

function sectionAtScrollLine(sections, line) {
  let active = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top > line) break;
    active = section;
  }
  return active;
}

function updateSidebar() {
  navUpdatePending = false;
  const root = document.documentElement;
  // Include the section's scroll margin so a native fragment jump activates it.
  const line = parseFloat(getComputedStyle(root).scrollPaddingTop) + 24;
  const atBottom = scrollY > 0 && scrollY + innerHeight >= root.scrollHeight - 1;
  const section = atBottom
    ? pageSections[pageSections.length - 1]
    : sectionAtScrollLine(pageSections, line);
  const activeHash = thoughtSlug() !== null ? "#notes" : `#${section.id}`;
  for (const link of mainNavLinks) {
    const active = link.hash === activeHash;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}

function scheduleSidebarUpdate() {
  if (navUpdatePending) return;
  navUpdatePending = true;
  requestAnimationFrame(updateSidebar);
}

addEventListener("scroll", scheduleSidebarUpdate, { passive: true });
addEventListener("resize", scheduleSidebarUpdate);
addEventListener("hashchange", scheduleSidebarUpdate);
addEventListener("pageshow", scheduleSidebarUpdate);
if ("ResizeObserver" in window) {
  new ResizeObserver(scheduleSidebarUpdate).observe($("main"));
}
scheduleSidebarUpdate();
void syncThoughtRoute();
