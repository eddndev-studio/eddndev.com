import { onPageCleanup } from '../core/lifecycle';
import { contactErrors, createContactMessage, deliverContact } from './contact-model';

export default function initContactForm() {
  const desk = document.querySelector('[data-contact-desk]');
  const form = desk?.querySelector('[data-contact-form]');
  if (!form) return;

  const events = new AbortController();
  const options = { signal: events.signal };
  const fields = ['name', 'email', 'message'];
  const submit = form.querySelector('[data-contact-submit]');
  const label = submit.querySelector('[data-contact-submit-label]');
  const initialLabel = label.textContent;
  const alert = form.querySelector('[data-contact-alert]');
  const status = desk.querySelector('[data-contact-status]');
  const receipt = desk.querySelector('[data-contact-receipt]');
  const reset = receipt.querySelector('[data-contact-reset]');
  const progress = desk.querySelector('[data-contact-progress]');
  const copyStatus = receipt.querySelector('[data-contact-copy-status]');
  const touched = new Set();
  let request;
  let delivered = false;
  let busy = false;

  form.noValidate = true;
  progress.hidden = false;

  const values = () => {
    return {
      ...Object.fromEntries(fields.map(name => [name, form.elements.namedItem(name).value.trim()])),
      services: [...form.querySelectorAll('[name="services"]:checked')].map(input => input.value),
    };
  };

  function validateField(name, errors = contactErrors(values())) {
    const input = form.elements.namedItem(name);
    const error = form.querySelector(`[data-contact-error="${name}"]`);
    error.textContent = errors[name] || '';
    error.hidden = !errors[name];
    if (errors[name]) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function updateProgress() {
    const errors = contactErrors(values());
    const count = fields.filter(name => !errors[name]).length;
    desk.querySelector('[data-contact-count]').textContent = `${count} de 3`;
    progress.querySelectorAll('i').forEach((light, index) => light.classList.toggle('is-complete', !errors[fields[index]]));
    desk.querySelector('[data-contact-character-count]').textContent = `${form.elements.namedItem('message').value.length} / 3000`;
    desk.dataset.contactReady = String(count === 3);
  }

  form.addEventListener('input', (event) => {
    if (touched.has(event.target.name)) validateField(event.target.name);
    updateProgress();
    if (!alert.hidden && !busy) { alert.hidden = true; alert.textContent = ''; }
  }, options);

  form.addEventListener('focusout', (event) => {
    if (!fields.includes(event.target.name)) return;
    touched.add(event.target.name);
    validateField(event.target.name);
  }, options);

  function setBusy(value) {
    busy = value;
    form.setAttribute('aria-busy', String(value));
    form.querySelectorAll('fieldset').forEach(fieldset => { fieldset.disabled = value; });
    submit.disabled = value;
    label.textContent = value ? (form.dataset.endpoint ? 'Enviando tu mensaje…' : 'Preparando conversación…') : initialLabel;
    desk.dataset.contactState = value ? 'sending' : 'editing';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    const payload = values();
    const errors = contactErrors(payload);
    fields.forEach(name => { touched.add(name); validateField(name, errors); });
    const invalid = fields.filter(name => errors[name]);
    if (invalid.length) {
      alert.textContent = invalid.length === 1 ? 'Revisa el campo indicado antes de continuar.' : `Revisa los ${invalid.length} campos indicados antes de continuar.`;
      alert.hidden = false;
      form.elements.namedItem(invalid[0]).focus();
      return;
    }

    alert.hidden = true;
    request = new AbortController();
    const timeout = setTimeout(() => request.abort(), 15000);
    setBusy(true);
    status.textContent = form.dataset.endpoint ? 'Enviando tu mensaje.' : 'Preparando tu mensaje.';
    try {
      const result = await deliverContact(payload, { endpoint: form.dataset.endpoint, signal: request.signal });
      if (events.signal.aborted) return;
      delivered = result.status === 'sent';
      receipt.querySelector('[data-contact-receipt-code]').textContent = delivered ? 'Mensaje recibido' : 'Borrador preparado';
      receipt.querySelector('[data-contact-receipt-title]').textContent = delivered ? 'Ya estamos en conversación.' : 'El primer paso, listo.';
      receipt.querySelector('[data-contact-receipt-copy]').textContent = delivered
        ? `Gracias, ${payload.name}. Te responderemos a ${payload.email} para hablar del siguiente paso.`
        : 'Tu mensaje está listo. Ábrelo en tu correo y envíalo para empezar la conversación.';
      const mailto = receipt.querySelector('[data-contact-mailto]');
      mailto.hidden = delivered;
      if (result.href) mailto.href = result.href;
      receipt.querySelector('[data-contact-receipt-fallback]').hidden = delivered;
      reset.textContent = delivered ? 'Escribir otro mensaje' : 'Volver al mensaje';
      form.hidden = true;
      receipt.hidden = false;
      status.textContent = delivered ? 'Mensaje enviado. Gracias por escribirnos.' : 'Borrador preparado. Falta enviarlo desde tu correo.';
      receipt.querySelector('[data-contact-receipt-title]').focus();
    } catch {
      if (events.signal.aborted) return;
      alert.textContent = 'No pudimos confirmar el envío. Tu mensaje sigue aquí. Inténtalo de nuevo o escríbenos por correo.';
      alert.hidden = false;
      status.textContent = '';
    } finally {
      clearTimeout(timeout);
      if (!events.signal.aborted) {
        setBusy(false);
        if (delivered) desk.dataset.contactState = 'sent';
        if (!form.hidden && (document.activeElement === document.body || form.contains(document.activeElement))) {
          submit.focus({ preventScroll: true });
        }
      }
    }
  }, options);

  reset.addEventListener('click', () => {
    if (delivered) { form.reset(); touched.clear(); fields.forEach(name => validateField(name, {})); }
    receipt.hidden = true;
    form.hidden = false;
    copyStatus.textContent = '';
    status.textContent = '';
    delivered = false;
    desk.dataset.contactState = 'editing';
    updateProgress();
    form.elements.namedItem('name').focus();
  }, options);

  receipt.querySelector('[data-contact-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(createContactMessage(values()));
      if (!events.signal.aborted) copyStatus.textContent = 'Mensaje copiado.';
    } catch {
      if (!events.signal.aborted) copyStatus.textContent = 'No se pudo copiar. Vuelve al mensaje para seleccionar y copiar el texto.';
    }
  }, options);

  updateProgress();
  // Native submission stays unavailable until the draft/delivery handler is ready.
  submit.disabled = false;
  onPageCleanup(() => { events.abort(); request?.abort(); });
}
