const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, reduced() ? 0 : ms));
let offline = false,
  version = 0,
  busy = false;
$("#disconnect").addEventListener("click", () => {
  offline = !offline;
  $("#disconnect").setAttribute("aria-pressed", String(offline));
  $("#disconnect").textContent = offline ? "Reconnect SIN" : "Disconnect SIN";
  $('[data-mesh="SIN"]').classList.toggle("offline", offline);
  $("#sin-link").style.opacity = offline ? "0.1" : "0.6";
  if (!offline) {
    $('[data-mesh="SIN"] .version').textContent = `v${version}`;
    $("#mesh-status").textContent =
      `4 peers connected · recovered to v${version}`;
  } else {
    $("#mesh-status").textContent = "3 peers connected · SIN is offline";
  }
});
$("#send-update").addEventListener("click", async () => {
  if (busy) return;
  busy = true;
  version++;
  $("#send-update").disabled = true;
  $("#disconnect").disabled = true;
  $$(".mesh-node").forEach((n) => n.classList.remove("updated"));
  const peers = ["SFO", "ORD", "FRA", ...(offline ? [] : ["SIN"])];
  for (const name of peers) {
    const node = $(`[data-mesh="${name}"]`);
    node.classList.add("updated");
    node.querySelector(".version").textContent = `v${version}`;
    $("#mesh-status").textContent = `Replicating v${version} → ${name}`;
    await delay(230);
  }
  $("#mesh-status").textContent = offline
    ? `v${version} replicated to 3 peers · SIN waiting`
    : `v${version} replicated · all 4 peers agree`;
  $("#send-update").disabled = false;
  $("#disconnect").disabled = false;
  busy = false;
});
$("#motion-toggle").addEventListener("click", () => {
  const enabled = $("#motion-toggle").getAttribute("aria-checked") !== "true";
  $("#motion-toggle").setAttribute("aria-checked", String(enabled));
  $(".prism-preview").classList.toggle("paused", !enabled);
  $("#motion-caption").textContent = enabled
    ? reduced()
      ? "Your system prefers reduced motion."
      : "Small movements. Clear feedback."
    : "Motion paused. Your choice stays in control.";
});
if (reduced())
  $("#motion-caption").textContent = "Your system prefers reduced motion.";
function renderMarkdown() {
  const fragment = document.createDocumentFragment();
  let list = null;
  $("#markdown-source")
    .value.split("\n")
    .forEach((line) => {
      if (line.startsWith("- ")) {
        if (!list) {
          list = document.createElement("ul");
          fragment.append(list);
        }
        const li = document.createElement("li");
        li.textContent = line.slice(2);
        list.append(li);
        return;
      }
      list = null;
      if (!line.trim()) return;
      const heading = line.match(/^(#{1,3})\s+(.*)/);
      const el = document.createElement(
        heading ? `h${Number(heading[1].length) + 3}` : "p",
      );
      el.textContent = heading ? heading[2] : line;
      fragment.append(el);
    });
  $("#markdown-output").replaceChildren(fragment);
}
$("#markdown-source").addEventListener("input", renderMarkdown);
renderMarkdown();
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
$$("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    $$("[data-filter]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b === button)),
    );
    $$(".project").forEach(
      (project) =>
        (project.hidden =
          filter !== "all" && project.dataset.category !== filter),
    );
    const count = $$(".project").filter((p) => !p.hidden).length;
    $(".project-pair").hidden = !$(".project-pair").querySelector(
      ".project:not([hidden])",
    );
    $("#filter-status").textContent =
      `Showing ${count} ${filter === "all" ? "" : filter + " "}projects`;
  }),
);
const stories = {
  alpharegen: {
    label: "PROJECT / FROM MY RÉSUMÉ",
    title: "AlphaReGen: network security simulation",
    body: /* HTML */ `
      <p>
        AlphaReGen was my diploma final-year project at Singapore Polytechnic,
        completed from October 2022 to March 2023 and awarded Grade A.
      </p>
      <h3>My role</h3>
      <p>
        I led the team in developing a simulated attacker–target environment,
        with a traffic generator and responder to simulate network protocols and
        attack scenarios including DNS exfiltration and SSH versus FTP.
      </p>
      <h3>Learning through traffic analysis</h3>
      <p>
        We integrated Wireshark-based traffic analysis and a technical guide to
        help learners identify attack patterns, distinguish normal from spoofed
        traffic, and configure and compare pfSense and Palo Alto firewalls.
      </p>
      <h3>Tools</h3>
      <p>pfSense, Palo Alto firewalls, and Wireshark.</p>
      <p>
        <a
          href="https://github.com/wei-ming2"
          target="_blank"
          rel="noopener noreferrer"
          >GitHub profile linked in my résumé ↗</a
        >
      </p>
    `,
  },
  hypersync: {
    label: "PROJECT 01 / BUILD NOTES",
    title: "HyperSync: what happens after “offline”?",
    body: /* HTML */ `
      <p>
        The original idea was simple: change a piece of state in one browser,
        then see the same state in another. The hard part begins when one of
        those browsers loses its connection.
      </p>
      <h3>The shape of the system</h3>
      <p>
        The portfolio concept uses Rust for the state machinery, WebAssembly for
        the browser boundary, and WebRTC data channels for peer-to-peer
        transport. Keeping those boundaries separate makes failures easier to
        reason about.
      </p>
      <pre>
browser event
  → local state update
  → encode operation
  → send to connected peers
  → apply or reconcile on arrival</pre
      >
      <h3>What the preview demonstrates</h3>
      <p>
        The network sketch on this page is a small JavaScript simulation, not a
        live WebRTC mesh. Disconnect SIN, send an update, and reconnect it. The
        returning peer catches up to the latest version.
      </p>
      <h3>What that leaves unsolved</h3>
      <p>
        A single version counter only works for this ordered simulation.
        Independent writers need conflict handling, operation identity, and a
        clear strategy for merging concurrent edits. WebRTC also needs signaling
        and sometimes a relay.
      </p>
      <p>
        The useful next experiment would be two simultaneous offline edits,
        followed by a deterministic merge. That is a better test than adding
        more dots to a network diagram.
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

function showReader(label, title) {
  $("#reader-label").textContent = label;
  readerTitle.textContent = title;
  reader.showModal();
  reader.scrollTop = 0;
}

function addPlaceholderNotice() {
  const notice = document.createElement("p");
  notice.className = "placeholder-notice";
  notice.textContent =
    "Retained placeholder content from the original design; not documented in my résumé.";
  readerBody.prepend(notice);
}

$$("[data-story]").forEach((button) =>
  button.addEventListener("click", () => {
    const story = stories[button.dataset.story];
    const placeholder = !["alpharegen", "colophon"].includes(
      button.dataset.story,
    );
    readerBody.innerHTML = story.body;
    if (placeholder) addPlaceholderNotice();
    const label = placeholder ? `PLACEHOLDER / ${story.label}` : story.label;
    showReader(label, story.title);
  }),
);

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

function populateThoughtButton(button, { category, title, excerpt, minutes, body }) {
  for (const [className, text] of [
    ["note-category", category],
    ["note-title", title],
    ["note-excerpt", excerpt],
    ["note-time", `${minutes} min read`],
  ]) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    button.append(span);
  }
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  button.querySelector(".note-title").append(arrow);

  button.addEventListener("click", () => {
    readerBody.replaceChildren(renderThoughtBody(body));
    showReader(category, title);
  });
  button.hidden = false;
}

async function loadThoughtButton(button) {
  const filename = button.dataset.thought;
  const url = `thoughts/${encodeURIComponent(filename)}`;
  let thought;
  try {
    thought = await readThought(url);
  } catch {
    const link = document.createElement("a");
    link.className = "text-link";
    link.href = url;
    link.textContent = `Open ${filename} ↗`;
    button.replaceWith(link);
    return;
  }
  populateThoughtButton(button, thought);
}

$$(".writing-list > button[data-thought]").forEach(loadThoughtButton);

function closeReader() {
  reader.close();
}
$("#close-reader").addEventListener("click", closeReader);
$("#reader-done").addEventListener("click", closeReader);
reader.addEventListener("click", (e) => {
  const rect = reader.getBoundingClientRect();
  if (
    e.clientX < rect.left ||
    e.clientX > rect.right ||
    e.clientY < rect.top ||
    e.clientY > rect.bottom
  )
    reader.close();
});
$("#copy-email").addEventListener("click", async () => {
  await navigator.clipboard.writeText("fooweiming1@gmail.com");
  $("#copy-email").textContent = "Copied ✓";
});
const sections = $$("main>section");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          $$("nav a").forEach((a) => {
            const active = a.getAttribute("href") === `#${entry.target.id}`;
            a.classList.toggle("active", active);
            if (active) a.setAttribute("aria-current", "location");
            else a.removeAttribute("aria-current");
          });
        }
      });
    },
    { rootMargin: "-10% 0px -65% 0px", threshold: 0 },
  );
  sections.forEach((s) => observer.observe(s));
}
