function initProjects() {
	initThisSitePreview();
}

// ==============================
// Project - This Site
// ==============================
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
