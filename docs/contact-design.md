# Contact: the beginning of a project

The homepage and `/contact` share the ContactDesk composition. Its expanded
heading shifts across the existing grid; the form and direct contact occupy an
open workspace below it. On small screens, the form comes before the secondary
contact channels. The homepage process section, contact, and compact footer share
one background. Other pages retain their existing closing prompt and footer.

The three violet segments reflect valid required fields (name, email, message).
Service selection is optional and supports multiple native checkboxes. Labels
remain visible. Validation runs on blur and submission; correcting a touched
field clears its error. A failed request preserves every field. Requests time
out after 15 seconds, duplicate submission is blocked while pending, and page
navigation aborts pending work through the existing Astro lifecycle.

## Delivery

There is no delivery backend in this repository. By default the CTA prepares a
message, then offers a mailto link and a copy alternative. The UI explicitly says
that the visitor still needs to send it from their email application. It never
reports a mailto handoff as a successful delivery. Without JavaScript, the native
form also opens the email application and direct contact links remain available.

To enable delivery from the site, set `PUBLIC_CONTACT_ENDPOINT` at build time to
an approved endpoint (for example `/api/contact`). This is a public URL, never an
API key. The client posts JSON:

```json
{
  "name": "María",
  "email": "maria@example.com",
  "message": "Quiero construir un producto digital.",
  "services": ["Producto digital"]
}
```

The server must validate the input, apply its abuse protections, deliver or
reliably enqueue the message to `contacto@eddndev.com`, and return HTTP 2xx with
`{ "ok": true }` only when acceptance is confirmed. Non-2xx responses, invalid
JSON, missing acknowledgement, network failures and timeouts show an error.
A cross-origin endpoint also needs CORS for the production site. Provider secrets
belong on that server. Adding this endpoint and its deployment configuration is
separate from the frontend design; no provider has been provisioned or connected.

## Verification

Run `npm test` and `npm run build` in this worktree. Contact model tests cover
required fields, optional services, encoded email content, confirmed delivery,
server failures, invalid responses, network errors and cancellation. Integration
checks retain the current direct contact details and shared home/contact form.

Browser review covers desktop, tablet and mobile layouts, keyboard selection,
visible focus, validation recovery, draft handoff, and success/error/loading
states using a local test endpoint. No test sends email to the studio.
The reduced-motion selectors were exercised in the browser by enabling their
media conditions in the local fixture: loading retained its text feedback with
no animated transform. This does not change the system's motion preference.
