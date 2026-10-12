// Native GET forms keep working without JavaScript. This enhancement adds the
// service to the WhatsApp draft; the visitor still chooses whether to send it.
export function buildIdeaMessage(serviceLabel, idea) {
  const text = typeof idea === "string" ? idea.trim() : "";
  if (!text) return "";
  const service = typeof serviceLabel === "string" && serviceLabel.trim()
    ? serviceLabel.trim().replace(/\s+/gu, " ")
    : "Un nuovo progetto";
  return `Ciao Space Media Studio,\nvorrei parlarvi di un progetto: ${service}.\n\nLa mia idea:\n${text}`;
}

export function installIdeaBriefs({ signal } = {}) {
  if (signal?.aborted) return () => {};
  const listeners = new AbortController();
  const cleanups = [];
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    listeners.abort();
    signal?.removeEventListener("abort", dispose);
    cleanups.forEach((cleanup) => cleanup());
  };

  document.querySelectorAll("[data-idea-form]").forEach((form) => {
    const field = form.querySelector('textarea[name="text"]');
    if (!field) return;
    const service = form.dataset.serviceLabel || "Un nuovo progetto";
    const count = form.querySelector("[data-idea-count]");
    const status = form.querySelector("[data-idea-status]");
    const initialStatus = status?.textContent || "";
    const initialValidity = field.validity.customError ? field.validationMessage : "";
    const update = () => {
      if (count) count.textContent = field.maxLength > 0
        ? `${field.value.length} / ${field.maxLength}`
        : String(field.value.length);
      // Native required/minlength remain authoritative. Prevent whitespace
      // from satisfying them while preserving the visitor's original text.
      const minimum = Math.max(1, field.minLength);
      const short = field.value.length > 0 && field.value.trim().length < minimum;
      field.setCustomValidity(short ? `Descrivi la tua idea con almeno ${minimum} caratteri, oltre agli spazi iniziali e finali.` : initialValidity);
      if (status) status.textContent = initialStatus;
    };

    update();
    field.addEventListener("input", update, { signal: listeners.signal });
    form.addEventListener("formdata", (event) => {
      const idea = event.formData.get("text");
      const message = buildIdeaMessage(service, idea);
      event.formData.set("text", message);
      if (status) status.textContent = message
        ? "Bozza pronta per WhatsApp. Rileggila e premi «Invia» quando vuoi."
        : initialStatus;
    }, { signal: listeners.signal });
    cleanups.push(() => field.setCustomValidity(initialValidity));
  });

  signal?.addEventListener("abort", dispose, { once: true });
  return dispose;
}
