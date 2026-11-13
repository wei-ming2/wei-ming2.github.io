const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
// DNS Exfiltration Raw: generated traffic, policy decision, receiving-side proof.
const alphaPreview = $("#alpha-preview");
const alphaNext = $("#alpha-next");
if (alphaPreview && alphaNext) {
  let stepIndex = 0;
  let policy = "baseline";
  const phases = ["ready", "prepare", "capture", "policy", "outcome"];
  const stepTitles = [
    "THE EXPERIMENT",
    "A CREDENTIAL IS AT RISK",
    "HIDE THE CREDENTIAL IN DNS",
    "APPLY THE FIREWALL POLICY",
    "CONFIRM THE CONSEQUENCE",
  ];

  function renderAlpha() {
    const restricted = policy === "restricted";
    const sent = stepIndex >= 2;
    const evaluated = stepIndex >= 3;
    const complete = stepIndex === 4;
    const received = complete && !restricted;
    alphaPreview.dataset.phase = phases[stepIndex];
    alphaPreview.dataset.policy = policy;
    $("#alpha-progress").textContent = `${stepIndex} / 4`;
    $("#alpha-step-title").textContent = stepTitles[stepIndex];
    $("#alpha-rule-state").textContent = restricted ? "Approved DNS only" : "Direct DNS permitted";
    $("#alpha-capture-empty").hidden = sent;
    $("#alpha-capture-data").hidden = !sent;
    $("#alpha-buffer").textContent = received ? "secret" : complete ? "No data received" : "Empty";
    $("#alpha-firewall-log").textContent = evaluated
      ? `00:01 action=${restricted ? "drop" : "pass"}\nsrc=192.168.1.20\ndst=203.0.113.20\nproto=udp dport=53\npolicy=${restricted ? "restricted-dns" : "baseline"}\n${restricted ? "reason=unapproved-dns" : "reason=direct-dns"}`
      : "Waiting for DNS traffic.";
    $("#alpha-receiver-log").textContent = complete
      ? restricted ? "No data received.\nreceived=0" : "00:07 status=complete\nmarker=www.chess.com\nrecovered=secret"
      : evaluated && restricted ? "No requests reached the collector." : "Waiting for a transmission.";

    const messages = [
      "DNS normally looks up website addresses. Follow an internal credential hidden in those requests, then compare the firewall policies.",
      "The attacker has access to this computer and wants to steal an internal credential. Monitored email and uploads make DNS an alternative route.",
      "AlphaGen places one character into each DNS query name. Wireshark records these requests leaving 192.168.1.20, regardless of the firewall policy.",
      restricted
        ? "The collector is not an approved DNS destination. The firewall stops the requests; the sender’s capture still records what it transmitted."
        : "The baseline policy permits direct DNS traffic to the collector. Each request carries part of the credential across the boundary.",
      restricted
        ? "The collector receives no credential. This DNS transfer attempt was stopped at the firewall."
        : "The external collector reconstructs the credential: secret. The data has crossed the network boundary.",
    ];
    $("#alpha-status").textContent = messages[stepIndex];
    alphaNext.textContent = complete ? "Restart ↻" : stepIndex ? "Next →" : "Begin →";
    const activeNode = stepIndex <= 2
      ? "generator"
      : stepIndex === 3 || restricted ? "firewall" : "responder";
    alphaPreview.querySelectorAll("[data-alpha-node]").forEach((node) => {
      node.classList.toggle("is-current", node.dataset.alphaNode === activeNode);
    });
    alphaPreview.querySelectorAll("[data-alpha-policy]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.alphaPolicy === policy));
    });
  }

  alphaNext.addEventListener("click", () => {
    stepIndex = stepIndex === 4 ? 1 : stepIndex + 1;
    renderAlpha();
  });
  alphaPreview.querySelectorAll("[data-alpha-policy]").forEach((button) => {
    button.addEventListener("click", () => {
      policy = button.dataset.alphaPolicy;
      renderAlpha();
    });
  });
  renderAlpha();
  alphaNext.hidden = false;
  alphaPreview.querySelector(".alpha-policy-toolbar").hidden = false;
}

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
// function renderMarkdown() {
//   const fragment = document.createDocumentFragment();
//   let list = null;
//   $("#markdown-source")
//     .value.split("\n")
//     .forEach((line) => {
//       if (line.startsWith("- ")) {
//         if (!list) {
//           list = document.createElement("ul");
//           fragment.append(list);
//         }
//         const li = document.createElement("li");
//         li.textContent = line.slice(2);
//         list.append(li);
//         return;
//       }
//       list = null;
//       if (!line.trim()) return;
//       const heading = line.match(/^(#{1,3})\s+(.*)/);
//       const el = document.createElement(
//         heading ? `h${Number(heading[1].length) + 3}` : "p",
//       );
//       el.textContent = heading ? heading[2] : line;
//       fragment.append(el);
//     });
//   $("#markdown-output").replaceChildren(fragment);
// }
// $("#markdown-source").addEventListener("input", renderMarkdown);
// renderMarkdown();
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
      `Showing ${count} ${filter === "all" ? "" : filter + " "}project${count === 1 ? "" : "s"}`;
  }),
);
const stories = {
  alpharegen: {
    label: "ENGINEERING CASE STUDY / ALPHAREGEN V1",
    title: "Traffic generation, firewall policy, and packet evidence in one testbed",
    body: /* HTML */ `
      <p>
        AlphaReGen combines a modular Python traffic generator/responder with a
        segmented VMware testbed. Students generate normal and malicious traffic,
        configure firewall policy, and examine the resulting logs and packet
        captures. The v1 deliverable was integrated into Singapore Polytechnic’s
        Cybersecurity Infrastructure Configuration module.
      </p>
      <h3>The problem and my contribution</h3>
      <p>
        Lecturers needed practical exercises without spending each lesson setting
        up and troubleshooting individual services. I led the five-person team
        and built the shared software architecture, developed Port and ARP
        exercises, and helped integrate other protocol implementations. I also
        standardised contributed modules and troubleshot their behaviour on the
        required Oracle Linux virtual machines. Firewall configuration and
        testing were team deliverables.
      </p>
      <h3>A network with distinct trust boundaries</h3>
      <p>
        The VMware environment separated Inside, Outside, and Extranet/DMZ networks
        around a firewall. A Linux cloud simulator provided routing and NAT toward
        the external network and Internet, while a separate management client
        provided access to the firewall interface. We exercised Inside-to-DMZ,
        Outside-to-DMZ, and Inside-to-Outside paths, placing the generator and
        responder where each exercise required them.
      </p>
      <h3>Firewall configuration and validation</h3>
      <p>
        Our team configured Palo Alto and pfSense firewalls in the testbed,
        established basic connectivity, and applied rules and security policies
        to the generated traffic. Exercises covered scanning, brute-force
        attempts, SQL injection, flooding, and exfiltration. We compared the
        observed behaviour of the two firewall configurations and documented
        the results, including cases where the tested configuration did not
        detect the traffic.
      </p>
      <p>
        The investigation workflow was to generate a known action, inspect the
        firewall decision and Wireshark capture, change the policy, and compare
        the evidence. We also explored URL filtering and packet-capture features.
        These findings describe our lab configurations and test conditions;
        detection depended on the enabled policies and inspection features.
      </p>
      <h3>A common framework for protocol exercises</h3>
      <p>
        AlphaGen selects protocol modules and coordinates AlphaRes through a TCP
        command channel. The responder launches the selected service as a
        subprocess. Scapy handles packet crafting for protocol headers and
        attack scenarios, while libraries such as Paramiko, pyftpdlib, and
        Flask with SQLite provide application conversations and target state.
      </p>
      <p>
        Shared helpers handle input validation, menus, learner explanations,
        and scenario-specific Wireshark filters. Interactive and verbose modes
        expose inputs and response details. This structure let us integrate
        teammates’ protocol implementations into a consistent learning workflow.
        Cross-platform testing mattered: Scapy traffic could interact differently
        with the Linux network stack, requiring investigation beyond the Python
        code itself.
      </p>
      <h3>Delivery and engineering lessons</h3>
      <p>
        The handover included user and developer documentation, a firewall
        administration guide, exported firewall configurations, and a shell
        script for repeated setup. Together, these supported rebuilding the lab
        and extending its exercises for teaching. The final-year project received
        Grade A.
      </p>
      <p>
        The central lesson was to connect the software action, the policy
        decision, and the captured packet. A future revision would strengthen
        responder readiness checks, subprocess cleanup, and automated
        packet-capture regression checks.
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
  const activeHash = `#${section.id}`;
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
