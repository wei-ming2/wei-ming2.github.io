/** Initializes every project preview on the page. */
function initProjects() {
	initAlphaReGenPreview();
	initThisSitePreview();
}

// ==============================
// Project - AlphaReGen
// ==============================
/**
 * Declares step 1 of 5, then calls `renderAlphaReGenStep()` to populate the demo
 * with that step's content. The Next button advances the step (wrapping back to
 * step 1) and re-renders.
 */
function initAlphaReGenPreview() {
	const alphaReGenElements = findAlphaReGenElements();
	if (!alphaReGenElements) return;

	let stepIndex = 0;
	alphaReGenElements.nextButton.addEventListener("click", () => {
		stepIndex = (stepIndex + 1) % alphaReGenSteps.length;
		renderAlphaReGenStep(alphaReGenElements, stepIndex);
	});
	renderAlphaReGenStep(alphaReGenElements, stepIndex);
	alphaReGenElements.nextButton.hidden = false;
}

// The five-step script driving the demo; each entry defines the phase, the host
// observing it, the evidence label, and the text of the Next button.
const alphaReGenSteps = [
	{
		phase: "prepare", title: "A SYSTEM IS COMPROMISED", observer: "generator",
		evidence: "AlphaGen · compromised computer", next: "Encode in DNS →",
	},
	{
		phase: "capture", title: "HIDING THE SECRET IN DNS", observer: "generator",
		evidence: "Wireshark · capture on AlphaGen", next: "Check policy →",
	},
	{
		phase: "policy", title: "THE DATA GOES UNNOTICED", observer: "firewall",
		evidence: "Firewall · baseline decision", next: "Verify receiver →",
	},
	{
		phase: "outcome", title: "THE SECRET ARRIVES", observer: "responder",
		evidence: "AlphaRes · attacker’s server", next: "Try Restricted DNS →",
	},
	{
		phase: "compare", title: "STOPPING THE SAME TRANSFER", observer: "firewall",
		evidence: "Firewall · same queries, two policies", next: "Restart ↻",
	},
];

/**
 * Looks up the demo's buttons, labels, and diagram parts once, so later renders
 * can reuse them instead of searching the page again.
 * 
 * Also maps each host name to its diagram node and address label.
 * Returns null when the demo isn't on the page.
 */
function findAlphaReGenElements() {
	const alphaReGenPreview = document.querySelector("#alpha-preview");
	if (!alphaReGenPreview) return null;

	const alphaReGenElements = {
		nextButton: alphaReGenPreview.querySelector("#alpha-next"),
		progress: alphaReGenPreview.querySelector("#alpha-progress"),
		stepTitle: alphaReGenPreview.querySelector("#alpha-step-title"),
		evidenceTitle: alphaReGenPreview.querySelector("#alpha-evidence-title"),
		evidenceAddress: alphaReGenPreview.querySelector("#alpha-evidence-address"),
		ruleState: alphaReGenPreview.querySelector("#alpha-rule-state"),
		buffer: alphaReGenPreview.querySelector("#alpha-buffer"),
		status: alphaReGenPreview.querySelector("#alpha-status"),
	};
	if (Object.values(alphaReGenElements).some((element) => !element)) return null;

	const alphaReGenHosts = new Map();
	for (const node of alphaReGenPreview.querySelectorAll("[data-alpha-node]")) {
		alphaReGenHosts.set(node.dataset.alphaNode, {
			node,
			address: node.querySelector("[data-alpha-host-address]"),
		});
	}
	return {
		...alphaReGenElements,
		preview: alphaReGenPreview,
		views: alphaReGenPreview.querySelectorAll("[data-alpha-view]"),
		captions: alphaReGenPreview.querySelectorAll("[data-alpha-caption]"),
		hosts: alphaReGenHosts,
	};
}

/**
 * Renders one step of the demo to its current state.
 * 
 * Updates the labels, evidence, diagram view, highlighted host, Next button,
 * and status line for that step.
 */
function renderAlphaReGenStep(alphaReGenElements, stepIndex) {
	const { preview, hosts, views, captions } = alphaReGenElements;
	const step = alphaReGenSteps[stepIndex];
	const hostAddress = hosts.get(step.observer)?.address;
	const compared = step.phase === "compare";
	const received = step.phase === "outcome";
	preview.dataset.phase = step.phase;
	preview.dataset.policy = compared ? "restricted" : "baseline";
	preview.dataset.observer = step.observer;

	alphaReGenElements.progress.textContent = `${stepIndex + 1} / ${alphaReGenSteps.length}`;
	alphaReGenElements.stepTitle.textContent = step.title;
	alphaReGenElements.evidenceTitle.textContent = step.evidence;
	alphaReGenElements.evidenceAddress.textContent = hostAddress?.textContent.trim() ?? "";
	alphaReGenElements.ruleState.textContent = compared ? "Restricted DNS" : "Baseline";
	alphaReGenElements.buffer.textContent = compared ? "No data" : received ? "secret" : "Empty";

	for (const view of views) {
		view.hidden = view.dataset.alphaView !== step.phase;
	}
	for (const [role, { node }] of hosts) {
		node.classList.toggle("is-current", role === step.observer);
	}
	alphaReGenElements.nextButton.textContent = step.next;

	const captionText = showAlphaReGenCaption(captions, step.phase);
	alphaReGenElements.status.textContent =
		`Step ${stepIndex + 1} of ${alphaReGenSteps.length}. ${captionText}`;
}

/**
 * Marks the caption matching `phase` as active and hides the others, then
 * returns its text so the caller can announce it for screen readers.
 */
function showAlphaReGenCaption(captions, phase) {
	let captionText = "";
	for (const caption of captions) {
		const isActive = caption.dataset.alphaCaption === phase;
		caption.classList.toggle("is-active", isActive);
		if (isActive) captionText = caption.textContent;
	}
	return captionText;
}

// ==============================
// Project - This Site
// ==============================
/**
 * Wires the breakpoint buttons that resize the miniature page preview. 
 * 
 * Each click sets the preview's width, updates the buttons' `aria-pressed` state,
 * and rewrites the caption as "<layout> layout · <width>px reference".
 */
function initThisSitePreview() {
	const thisSitePreview = document.querySelector(".portfolio-preview");
	const thisSiteBreakpointButtons = document.querySelectorAll("[data-preview-breakpoint]");

	thisSiteBreakpointButtons.forEach((button) => {
		button.addEventListener("click", () => {
			const width = button.dataset.previewBreakpoint;
			const layout = button.dataset.previewLayout;
			thisSitePreview.dataset.previewWidth = width;
			thisSiteBreakpointButtons.forEach((option) => {
				option.setAttribute("aria-pressed", String(option === button));
			});
			thisSitePreview.querySelector(".portfolio-preview-caption").textContent =
				`${layout} layout · ${width}px reference`;
		});
	});
}
