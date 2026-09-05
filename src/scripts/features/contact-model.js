const limits = { name: 100, email: 254, message: 3000 };

export function contactErrors(values) {
  const errors = {};
  if (!values.name?.trim()) errors.name = 'Escribe tu nombre para saber con quién hablamos.';
  if (!values.email?.trim()) errors.email = 'Escribe el correo en el que podemos responderte.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Revisa tu correo. Por ejemplo: nombre@proyecto.com.';
  if (!values.message?.trim()) errors.message = 'Cuéntanos brevemente qué quieres construir o mejorar.';
  for (const [field, limit] of Object.entries(limits)) {
    if (values[field]?.length > limit) errors[field] = `Usa un máximo de ${limit} caracteres.`;
  }
  return errors;
}

export function createContactMessage(values) {
  return `Nombre: ${values.name.trim()}\nCorreo: ${values.email.trim()}\nProyecto: ${values.services?.join(', ') || 'Por definir'}\n\n${values.message.trim()}`;
}

export function createMailto(values) {
  const subject = encodeURIComponent(`Un proyecto con edd n'dev — ${values.name.trim()}`);
  return `mailto:contacto@eddndev.com?subject=${subject}&body=${encodeURIComponent(createContactMessage(values))}`;
}

/** A delivery service must return { ok: true } only after accepting the message. */
export async function deliverContact(values, { endpoint, signal, fetcher = globalThis.fetch } = {}) {
  signal?.throwIfAborted();
  if (Object.keys(contactErrors(values)).length) throw new Error('Invalid contact fields');
  if (!endpoint) return { status: 'prepared', href: createMailto(values) };
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(values),
    signal,
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error('Contact delivery failed');
  const result = await response.json();
  if (result.ok !== true) throw new Error('Contact delivery unconfirmed');
  return { status: 'sent' };
}
