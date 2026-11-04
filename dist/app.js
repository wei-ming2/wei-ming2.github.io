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
const frames = {
  main: ["main_thread", 48.2, "100%"],
  render: ["renderVNodeTree", 31.1, "64.5%"],
  gc: ["gcSync", 17.1, "35.5%"],
  diff: ["diffProps", 10.8, "22.4%"],
  layout: ["layoutPass", 20.3, "42.1%"],
  sweep: ["markSweep", 17.1, "35.5%"],
};
$$("[data-frame]").forEach((button) =>
  button.addEventListener("click", () => {
    $$("[data-frame]").forEach((b) =>
      b.classList.toggle("selected", b === button),
    );
    const [name, time, percent] = frames[button.dataset.frame];
    $("#trace-readout").textContent =
      `${name} · ${time} ms · ${percent} of frame`;
  }),
);
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
  traceflow: {
    label: "PROJECT 02 / IMPLEMENTATION NOTES",
    title: "TraceFlow: keeping the profiler responsive",
    body: /* HTML */ `
      <p>
        A flamegraph turns nested work into widths. The widest stack is often a
        better place to begin than the function with the most intimidating name.
      </p>
      <h3>Separate data from pixels</h3>
      <p>
        A worker can parse trace data and produce compact buffers. The rendering
        layer can then draw visible spans without rebuilding a document tree for
        every event.
      </p>
      <p>
        Moving work into a worker is only part of the job. Copying a large
        object between threads can itself be expensive. Transferable buffers and
        careful ownership matter.
      </p>
      <h3>A useful interaction budget</h3>
      <p>
        Panning and zooming should work from the visible range, not scan the
        entire trace. Hit testing should identify the span under the pointer
        without redrawing everything else.
      </p>
      <h3>About the sample</h3>
      <p>
        The embedded preview uses illustrative timing data. Click a stack to see
        its duration and share of the frame. The labels are intentionally small
        enough to show how nesting and width help you navigate.
      </p>
      <p>
        No production event-count or frame-rate claims are made here. Those
        require a benchmark, a dataset, and a named test machine.
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
  "note-local": {
    label: "FIELD NOTE / DISTRIBUTED SYSTEMS",
    title: "The interesting part starts when a peer goes offline",
    body: /* HTML */ `
      <p>
        When every peer is online and every update arrives in order, a shared
        document looks straightforward. A counter goes up. A message goes out.
        The other screen changes.
      </p>
      <p>Now disconnect one peer. Edit on both sides. Reconnect.</p>
      <h3>Two histories, one screen</h3>
      <p>
        There is no longer a single obvious “latest” version. Each side has
        information the other has never seen. A timestamp can order events, but
        it cannot explain the author’s intent.
      </p>
      <p>
        That makes the conflict policy part of the product. Last-writer-wins
        might be fine for a status flag. It would be surprising for two
        paragraphs that someone spent an hour writing.
      </p>
      <h3>Make the failure repeatable</h3>
      <p>
        A useful test harness does more than send random traffic. It pauses a
        peer, records an operation, delays another message, and then replays
        that exact sequence. If the result differs between runs, debugging
        becomes much harder.
      </p>
      <p>
        The first thing worth building is often the failure scenario rather than
        the happy-path animation.
      </p>
      <h3>Further reading</h3>
      <p>
        <a
          href="https://www.inkandswitch.com/essay/local-first/"
          target="_blank"
          rel="noopener noreferrer"
          >Local-first software — Ink & Switch</a
        >
        is a useful starting point for the product questions that sit alongside
        the technical ones.
      </p>
    `,
  },
  "note-perf": {
    label: "FIELD NOTE / BROWSER PERFORMANCE",
    title: "A fast renderer can still have a slow interface",
    body: /* HTML */ `
      <p>
        Suppose a chart draws quickly once it has its data. It can still feel
        slow if parsing, copying, and preparing that data blocks the interaction
        immediately before the draw.
      </p>
      <h3>Follow the whole trip</h3>
      <p>
        A trace file must be read, parsed, transformed, transferred, indexed,
        and finally rendered. Improving only the last step can hide the real
        problem.
      </p>
      <p>
        A worker helps with CPU work, but it introduces a boundary. Sending a
        deeply nested object across that boundary may require a copy. A
        transferred buffer changes ownership instead, which can be cheaper, but
        requires a plan for who gets to use it next.
      </p>
      <h3>Measure an interaction</h3>
      <p>
        “Time to draw” is useful, but “time from pointer input to visible
        response” is closer to what the person using the tool experiences. Those
        measurements can lead to different priorities.
      </p>
      <p>
        The next experiment: keep the renderer unchanged and move only the
        parser. Then measure again. One change makes the result easier to
        explain.
      </p>
    `,
  },
  "note-small": {
    label: "FIELD NOTE / BUILDING & LEARNING",
    title: "The version I should have built first",
    body: /* HTML */ `
      <p>
        The first plan tends to include a parser, a cache, a plugin system, a
        file watcher, and a configuration format. That is a lot of work before a
        single page exists.
      </p>
      <h3>One input, one output</h3>
      <p>
        A better first milestone is one Markdown file producing one HTML file.
        No folder traversal. No theme. No watch mode. Just a result you can open
        in a browser.
      </p>
      <p>
        That version tests the part that matters most: whether the idea is
        pleasant to use at all. It also gives every later feature something
        concrete to preserve.
      </p>
      <h3>Write down the stopping point</h3>
      <p>
        For a shell: run one external command. For a state sync experiment: send
        one operation between two peers. For a profiler: draw one recorded
        frame.
      </p>
      <p>
        The smaller version is often the one that gets finished, understood, and
        eventually replaced with something better.
      </p>
    `,
  },
  colophon: {
    label: "ABOUT THIS SITE",
    title: "A personal site with room for the details",
    body: /* HTML */ `
      <p>
        This is Foo Wei Ming’s personal portfolio. Identity, contact details,
        education, experience, AlphaReGen, leadership, and technical skills are
        taken from the supplied résumé. Projects and writing not covered by the
        résumé remain as labeled placeholders.
      </p>
      <h3>Built simply</h3>
      <p>
        The page is buildless HTML, CSS, and JavaScript. The network diagram is
        SVG; the profiler, switch, and Markdown preview use browser-native
        controls. The résumé has a dedicated print stylesheet for saving as a
        PDF.
      </p>
      <h3>Design references</h3>
      <p>
        The
        <a
          href="https://github.com/Evavic44/portfolio-ideas"
          target="_blank"
          rel="noopener noreferrer"
          >Portfolio Ideas collection</a
        >
        informed the broader direction.
        <a
          href="https://www.taniarascia.com/"
          target="_blank"
          rel="noopener noreferrer"
          >Tania Rascia</a
        >
        and
        <a
          href="https://victoreke.com/"
          target="_blank"
          rel="noopener noreferrer"
          >Victor Eke</a
        >
        were references for giving projects, writing, and experience enough
        room.
      </p>
      <p>
        The typography pairs Manrope with JetBrains Mono. Warm paper, charcoal,
        and a single clay accent keep the interface quiet without stripping out
        the content.
      </p>
      <h3>Before making it yours</h3>
      <p>
        The original sample projects and articles have been preserved where the
        résumé does not provide replacements. Their placeholder labels
        distinguish them from the documented profile. The GitHub and LinkedIn
        links are the links embedded in the résumé.
      </p>
    `,
  },
};
const reader = $("#reader");
$$("[data-story]").forEach((button) =>
  button.addEventListener("click", () => {
    const story = stories[button.dataset.story];
    const placeholder = !["alpharegen", "colophon"].includes(
      button.dataset.story,
    );
    $("#reader-label").textContent = placeholder
      ? "PLACEHOLDER / " + story.label
      : story.label;
    $("#reader-title").textContent = story.title;
    $("#reader-body").innerHTML =
      (placeholder
        ? '<p class="placeholder-notice">Retained placeholder content from the original design; not documented in my résumé.</p>'
        : "") + story.body;
    reader.showModal();
    reader.scrollTop = 0;
  }),
);
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
$("#print-resume").addEventListener("click", () => window.print());
$("#copy-email").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("fooweiming1@gmail.com");
    $("#copy-email").textContent = "Copied ✓";
    $("#copy-status").textContent = "Copied fooweiming1@gmail.com.";
  } catch {
    $("#copy-status").textContent =
      "Copy unavailable. Select fooweiming1@gmail.com to copy it manually.";
  }
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
