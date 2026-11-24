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
    },
    {
      phase: "capture", title: "HIDING THE SECRET IN DNS", observer: "generator",
      evidence: "Wireshark · capture on AlphaGen", address: "192.168.1.20", next: "Check policy →",
    },
    {
      phase: "policy", title: "THE DATA GOES UNNOTICED", observer: "firewall",
      evidence: "Firewall · baseline decision", address: "192.168.1.1", next: "Verify receiver →",
    },
    {
      phase: "outcome", title: "THE SECRET ARRIVES", observer: "responder",
      evidence: "AlphaRes · attacker’s server", address: "203.0.113.20", next: "Try Restricted DNS →",
    },
    {
      phase: "compare", title: "STOPPING THE SAME TRANSFER", observer: "firewall",
      evidence: "Firewall · same queries, two policies", address: "192.168.1.1", next: "Restart ↻",
    },
  ];

  const captions = alphaPreview.querySelectorAll("[data-alpha-caption]");

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
    alphaPreview.querySelectorAll("[data-alpha-view]").forEach((view) => {
      view.hidden = view.dataset.alphaView !== step.phase;
    });
    alphaPreview.querySelectorAll("[data-alpha-node]").forEach((node) => {
      node.classList.toggle("is-current", node.dataset.alphaNode === step.observer);
    });
    alphaNext.textContent = step.next;
    let captionText = "";
    for (const caption of captions) {
      const isActive = caption.dataset.alphaCaption === step.phase;
      caption.classList.toggle("is-active", isActive);
      if (isActive) captionText = caption.textContent;
    }
    $("#alpha-status").textContent = `Step ${stepIndex + 1} of ${steps.length}. ${captionText}`;
  }

  alphaNext.addEventListener("click", () => {
    stepIndex = (stepIndex + 1) % steps.length;
    renderAlpha();
  });
  renderAlpha();
  alphaNext.hidden = false;
}

// One archived comparison, embedded beside its static SVG fallback.
const hdbPreview = $("#hdb-preview");
if (hdbPreview) {
  const svg = $("#hdb-chart");
  const slider = $("#hdb-quarter");
  const quarterLabel = $("#hdb-quarter-value");
  const namespace = "http://www.w3.org/2000/svg";
  let renderedWidth = 0;

  function element(tag, attributes, text) {
    const node = document.createElementNS(namespace, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  try {
    const data = JSON.parse($("#hdb-gap-data").textContent);
    const quarters = data.quarters.map((quarter) => Number(quarter.slice(0, 4)) * 4 + Number(quarter.slice(-1)) - 1);
    const money = (value) => `S$${value.toLocaleString("en-SG")}`;
    const baseGap = data.prices["5-ROOM"][0] - data.prices["3-ROOM"][0];
    const basePremium = baseGap / data.prices["3-ROOM"][0] * 100;

    function comparison(index) {
      const smaller = data.prices["3-ROOM"][index];
      const larger = data.prices["5-ROOM"][index];
      if (smaller === null || larger === null) {
        return { gap: null, premium: null, lines: ["No 5-room median was published.", "The gap cannot be calculated."] };
      }
      const gap = larger - smaller;
      const premium = gap / smaller * 100;
      let lines;
      if (index === 0) {
        lines = [`Starting gap: ${money(gap)}.`, `${premium.toFixed(1)}% above the 3-room median.`];
      } else {
        const absolute = Math.sign(gap - baseGap);
        const relative = Math.sign(Number(premium.toFixed(1)) - Number(basePremium.toFixed(1)));
        if (absolute === 0 || relative === 0) {
          const word = absolute > 0 ? "wider" : "narrower";
          lines = [absolute ? `The dollar gap is ${word} than at the start.` : "The dollar gap is unchanged from the start.", `The relative premium is ${premium.toFixed(1)}% above 3-room.`];
        } else {
          const direction = absolute > 0 ? "widened" : "narrowed";
          const connective = absolute === relative ? "and" : "but";
          const change = relative > 0 ? "rose" : "fell";
          lines = [`The dollar gap ${direction}, ${connective} the`, `premium ${change} from ${basePremium.toFixed(1)}% to ${premium.toFixed(1)}%.`];
        }
      }
      return { gap, premium, lines };
    }

    function renderHdb() {
      const width = svg.getBoundingClientRect().width;
      if (!width) return;
      renderedWidth = width;
      const index = Number(slider.value);
      const quarter = data.quarters[index].replace("-", " ");
      const result = comparison(index);
      const valueText = result.gap === null
        ? `${quarter}, comparison unavailable: no published 5-room median`
        : `${quarter}, ${money(result.gap)} gap, ${result.premium.toFixed(1)}% above 3-room`;
      const left = 48, right = width - 18, top = 46, bottom = 194;
      const x = (quarter) => left + (quarter - quarters[0]) / (quarters[quarters.length - 1] - quarters[0]) * (right - left);
      const y = (price) => bottom - price / 800_000 * (bottom - top);
      const children = [
        element("title", { id: "hdb-chart-title" }, "Did the price gap widen?"),
        element("desc", { id: "hdb-chart-desc" }, `Ang Mo Kio, 3-room and 5-room nominal quarterly resale medians, 20 selected quarters, 2007 Q2–2022 Q1. Scale: S$0–S$800,000; gaps are unpublished values. ${valueText}. ${result.lines.join(" ")}`),
        element("text", { class: "hdb-question", x: 18, y: 23, "aria-hidden": "true" }, "Did the price gap widen?"),
      ];
      for (const [price, label] of [[0, "0"], [200000, "200k"], [400000, "400k"], [600000, "600k"], [800000, "S$800k"]]) {
        children.push(element("line", { class: "hdb-grid", x1: left, x2: right, y1: y(price), y2: y(price), "aria-hidden": "true" }));
        children.push(element("text", { class: "hdb-axis", x: left - 7, y: y(price) + 4, "text-anchor": "end", "aria-hidden": "true" }, label));
      }
      const ticks = [[quarters[0], "2007 Q2", "start"], [quarters[quarters.length - 1], "2022 Q1", "end"]];
      if (width >= 310) ticks.splice(1, 0, [2015 * 4, "2015", "middle"]);
      for (const [quarter, label, anchor] of ticks) {
        children.push(element("text", { class: "hdb-axis", x: x(quarter), y: 218, "text-anchor": anchor, "aria-hidden": "true" }, label));
      }
      const cursor = x(quarters[index]);
      children.push(element("line", { class: "hdb-cursor", x1: cursor, x2: cursor, y1: top, y2: bottom, "aria-hidden": "true" }));
      data.types.forEach((kind, number) => {
        const values = data.prices[kind];
        let start = true;
        const path = [];
        values.forEach((price, i) => {
          if (price === null) { start = true; return; }
          path.push(`${start ? "M" : "L"}${x(quarters[i]).toFixed(2)},${y(price).toFixed(2)}`);
          start = false;
          if (values[i - 1] == null && values[i + 1] == null) {
            children.push(element("circle", { class: `hdb-point hdb-point-${number}`, cx: x(quarters[i]), cy: y(price), r: 2, "aria-hidden": "true" }));
          }
        });
        children.push(element("path", { class: `hdb-series hdb-series-${number}`, d: path.join(" "), "aria-hidden": "true" }));
      });
      if (result.gap !== null) {
        const labelOnLeft = cursor > width / 2;
        const arrowX = cursor;
        const high = y(data.prices["5-ROOM"][index]), low = y(data.prices["3-ROOM"][index]);
        const arrow = `M${arrowX},${high}V${low}M${arrowX - 3},${high + 5}L${arrowX},${high}L${arrowX + 3},${high + 5}M${arrowX - 3},${low - 5}L${arrowX},${low}L${arrowX + 3},${low - 5}`;
        children.push(element("path", { id: "hdb-gap-arrow", class: "hdb-arrow", d: arrow, "aria-hidden": "true" }));
        const labelX = labelOnLeft ? Math.max(120, cursor - 16) : Math.min(width - 120, cursor + 16);
        const anchor = labelOnLeft ? "end" : "start";
        const middle = (high + low) / 2;
        children.push(element("text", { id: "hdb-gap-value", class: "hdb-gap-value", x: labelX, y: middle - 2, "text-anchor": anchor, "aria-hidden": "true" }, `${money(result.gap)} gap`));
        children.push(element("text", { id: "hdb-gap-percent", class: "hdb-gap-percent", x: labelX, y: middle + 13, "text-anchor": anchor, "aria-hidden": "true" }, `${result.premium.toFixed(1)}% above 3-room`));
      }
      data.types.forEach((kind, number) => {
        const price = data.prices[kind][index];
        if (price !== null) children.push(element("circle", { class: `hdb-point hdb-point-${number}`, cx: cursor, cy: y(price), r: 3.5, "aria-hidden": "true" }));
      });
      const insight = element("text", { id: "hdb-insight", class: "hdb-insight", x: 18, y: 248, "aria-hidden": "true" });
      result.lines.forEach((line, i) => insight.append(element("tspan", { x: 18, dy: i ? 18 : 0 }, line)));
      children.push(insight);
      svg.setAttribute("viewBox", `0 0 ${width} 282`);
      svg.classList.remove("is-fallback");
      svg.replaceChildren(...children);
      quarterLabel.textContent = quarter;
      // The native slider announces one concise value; resizing adds no live update.
      if (slider.getAttribute("aria-valuetext") !== valueText) slider.setAttribute("aria-valuetext", valueText);
    }

    slider.max = data.quarters.length - 1;
    renderHdb();
    slider.disabled = false;
    slider.addEventListener("input", renderHdb);
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => {
        if (svg.getBoundingClientRect().width !== renderedWidth) renderHdb();
      }).observe(hdbPreview);
    } else {
      addEventListener("resize", renderHdb);
    }
  } catch {
    // Keep the generated chart and interpretation readable without enhancement.
    slider.disabled = true;
  }
}

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

$$("[data-story]").forEach((button) => {
  button.addEventListener("click", () => {
    const story = document.getElementById(`story-${button.dataset.story}`);
    if (!(story instanceof HTMLTemplateElement)) return;
    readerReturnFocus = button;
    readerBody.replaceChildren(story.content.cloneNode(true));
    showReader(story.dataset.label, story.dataset.title);
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
$("#copy-email").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const email = $(".contact-email a").textContent.trim();
  try {
    await navigator.clipboard.writeText(email);
  } catch {
    return;
  }
  button.textContent = "Copied ✓";
});
const pageSections = $$("main > section");
const mainNavLinks = $$(".sidebar nav > a");
const SIDEBAR_ACTIVATION_OFFSET = 24;
let sidebarActivationLine;
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
  const atBottom = scrollY > 0 && scrollY + innerHeight >= root.scrollHeight - 1;
  const section = atBottom
    ? pageSections[pageSections.length - 1]
    : sectionAtScrollLine(pageSections, sidebarActivationLine);
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

function refreshSidebarActivationLine() {
  // Include the section's scroll margin so a native fragment jump activates it.
  const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
  sidebarActivationLine = scrollPadding + SIDEBAR_ACTIVATION_OFFSET;
  scheduleSidebarUpdate();
}

addEventListener("scroll", scheduleSidebarUpdate, { passive: true });
addEventListener("resize", refreshSidebarActivationLine);
addEventListener("hashchange", scheduleSidebarUpdate);
addEventListener("pageshow", refreshSidebarActivationLine);
if ("ResizeObserver" in window) {
  new ResizeObserver(scheduleSidebarUpdate).observe($("main"));
}
refreshSidebarActivationLine();
void syncThoughtRoute();
