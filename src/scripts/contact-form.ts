// Contact form: sends through Web3Forms when an access key is configured in
// src/data/site.json (contactFormKey); otherwise opens the visitor's email app
// with the message pre-filled, so enquiries are never lost.

const ENDPOINT = 'https://api.web3forms.com/submit';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = 'idle' | 'sending' | 'success' | 'error';

/** Localized strings rendered into the form's data-messages attribute. */
interface Messages {
  errName: string;
  errEmail: string;
  errMessage: string;
  errConsent: string;
  success: string;
  mailOpened: string;
  failed: string;
  send: string;
  sending: string;
  subject: string;
}

interface Enquiry {
  projectType: string;
  name: string;
  email: string;
  phone: string;
  business: string;
  message: string;
}

function readEnquiry(data: FormData): Enquiry {
  const get = (key: string) => String(data.get(key) ?? '').trim();
  return {
    projectType: get('project_type'),
    name: get('name'),
    email: get('email'),
    phone: get('phone'),
    business: get('business'),
    message: get('message'),
  };
}

function validate(form: HTMLFormElement, enquiry: Enquiry, messages: Messages): string | null {
  if (!enquiry.name) return messages.errName;
  if (!EMAIL_PATTERN.test(enquiry.email)) return messages.errEmail;
  if (enquiry.message.length < 10) return messages.errMessage;
  const consent = form.elements.namedItem('consent') as HTMLInputElement | null;
  if (!consent?.checked) return messages.errConsent;
  return null;
}

function setStatus(form: HTMLFormElement, messages: Messages, status: Status, message = ''): void {
  const output = form.querySelector<HTMLElement>('[data-status]');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const label = form.querySelector<HTMLElement>('[data-label]');
  if (output) {
    output.textContent = message;
    output.className = `text-sm ${status === 'error' ? 'text-[#ffb4a0]' : 'text-sand/80'}`;
  }
  if (button) button.disabled = status === 'sending';
  if (label) label.textContent = status === 'sending' ? messages.sending : messages.send;
}

function subjectFor(enquiry: Enquiry, messages: Messages): string {
  return `${messages.subject}: ${enquiry.projectType} — ${enquiry.name}`;
}

function openMailFallback(to: string, subject: string, enquiry: Enquiry): void {
  const body = [
    `Project: ${enquiry.projectType}`,
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    enquiry.phone && `Phone: ${enquiry.phone}`,
    enquiry.business && `Business: ${enquiry.business}`,
    '',
    enquiry.message,
  ]
    .filter((line) => line !== '')
    .join('\n');
  window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function sendViaWeb3Forms(accessKey: string, subject: string, enquiry: Enquiry, botcheck: boolean): Promise<void> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: accessKey,
      subject,
      from_name: 'Lucsoft website',
      botcheck,
      language: document.documentElement.lang,
      ...enquiry,
    }),
  });
  const result = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;
  if (!response.ok || !result?.success) {
    throw new Error(result?.message ?? `Request failed with status ${response.status}`);
  }
}

function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>('#contact-form');
  if (!form) return;
  const accessKey = form.dataset.formKey ?? '';
  const fallbackEmail = form.dataset.fallbackEmail ?? '';
  const messages = JSON.parse(form.dataset.messages ?? '{}') as Messages;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const enquiry = readEnquiry(data);

    const error = validate(form, enquiry, messages);
    if (error) {
      setStatus(form, messages, 'error', error);
      return;
    }

    const subject = subjectFor(enquiry, messages);
    if (!accessKey) {
      openMailFallback(fallbackEmail, subject, enquiry);
      setStatus(form, messages, 'success', messages.mailOpened);
      return;
    }

    setStatus(form, messages, 'sending');
    try {
      await sendViaWeb3Forms(accessKey, subject, enquiry, data.has('botcheck'));
      form.reset();
      setStatus(form, messages, 'success', messages.success);
    } catch (err) {
      console.error('Contact form submission failed', err);
      setStatus(form, messages, 'error', messages.failed);
    }
  });
}

initContactForm();
