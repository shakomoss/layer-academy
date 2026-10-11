import type { ValidatedRegistration } from './validate';

const RESEND_URL = 'https://api.resend.com/emails';

const CONTACT_METHOD_LABELS: Record<ValidatedRegistration['preferredContact'], string> = {
  whatsapp: 'WhatsApp',
  viber: 'Viber',
  call: 'ზარი',
  email: 'ელ-ფოსტა',
};

const TYPE_LABELS: Record<ValidatedRegistration['type'], string> = {
  group: 'ჯგუფური კურსი',
  mentorship: 'ინდივიდუალური მენტორინგი',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildOwnerEmail(data: ValidatedRegistration): { subject: string; html: string } {
  const rows: [string, string][] = [
    ['პროგრამა', data.courseTitle],
    ['ფორმატი', TYPE_LABELS[data.type]],
    ['ფასი', `${data.price} ${data.currency === 'GEL' ? '₾' : data.currency}`],
    ['სახელი და გვარი', data.name],
    ['ტელეფონი', data.phone],
    ['ელ-ფოსტა', data.email || '—'],
    ['სასურველი კონტაქტი', CONTACT_METHOD_LABELS[data.preferredContact]],
    ['კომენტარი', data.comment || '—'],
    ['გვერდი', data.pageUrl || '—'],
    ['UTM წყარო', data.utm.source || '—'],
    ['UTM მედიუმი', data.utm.medium || '—'],
    ['UTM კამპანია', data.utm.campaign || '—'],
  ];

  const html = `
    <h2>ახალი რეგისტრაცია — ${escapeHtml(data.courseTitle)}</h2>
    <table cellpadding="6">
      ${rows.map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`).join('')}
    </table>
  `;

  return { subject: `ახალი რეგისტრაცია: ${data.courseTitle} (${TYPE_LABELS[data.type]})`, html };
}

export function buildStudentEmail(data: ValidatedRegistration): { subject: string; html: string } {
  const html = `
    <p>გამარჯობა, ${escapeHtml(data.name)},</p>
    <p>
      მადლობა რეგისტრაციისთვის — <strong>${escapeHtml(data.courseTitle)}</strong>
      (${TYPE_LABELS[data.type]}), ფასი: ${data.price} ₾.
    </p>
    <p>
      მალე დაგიკავშირდებით ${CONTACT_METHOD_LABELS[data.preferredContact]}-ის საშუალებით და
      გამოგიწერთ ინვოისს გადასახდელად (გადახდა ხდება საბანკო გადარიცხვით).
    </p>
    <p>Layer Academy</p>
  `;

  return { subject: `რეგისტრაცია მიღებულია — ${data.courseTitle}`, html };
}

export async function sendEmail(
  apiKey: string,
  fromEmail: string,
  options: { to: string; subject: string; html: string }
): Promise<void> {
  const response = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${body}`);
  }
}
