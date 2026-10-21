/**
 * "Contact Kommissary" Google Form → an email to the team for every response.
 *
 * The website's contact form (app/api/contact/route.ts) submits to this Google Form. This
 * script is bound to the form (Form editor → ⋮ → Apps Script) and emails each response to
 * RECIPIENTS, laid out for reading, with Reply going straight to the person who wrote in
 * and a link to the responses sheet.
 *
 * Setup: paste this in, Save, choose setUp in the toolbar and Run it once (approve the
 * permissions it asks for). sendTest() emails the most recent response again, to check it.
 *
 * The emails are sent from the Google account that ran setUp.
 */

const RECIPIENTS = ['contact@kommissary.com', 'host@kommissary.com'];
const SENDER_NAME = 'Kommissary website';
const TIME_ZONE = 'America/New_York';

/** Run once. Safe to run again: it replaces its own trigger rather than adding another. */
function setUp() {
  const form = FormApp.getActiveForm();
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'onContactSubmit')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onContactSubmit').forForm(form).onFormSubmit().create();
  Logger.log('Ready: new responses will be emailed to ' + RECIPIENTS.join(', '));
}

/** The trigger: every new response. */
function onContactSubmit(e) {
  sendFor(e.response, false);
}

/** Emails the latest response again (subject marked TEST), to check the layout. */
function sendTest() {
  const responses = FormApp.getActiveForm().getResponses();
  if (!responses.length) throw new Error('No responses yet: submit the form once first.');
  sendFor(responses[responses.length - 1], true);
}

function sendFor(response, isTest) {
  const form = FormApp.getActiveForm();
  const a = {};
  response.getItemResponses().forEach((r) => {
    a[r.getItem().getTitle().trim()] = String(r.getResponse() ?? '').trim();
  });

  const first = a['First Name'] || '';
  const name = [first, a['Last Name']].filter(Boolean).join(' ') || 'Someone';
  const email = a['Email Address'] || '';
  const phone = a['Phone Number'] || '';
  const reason = a['Reason for contact'] || 'General';
  const message = a['Message'] || '';
  const when = Utilities.formatDate(response.getTimestamp(), TIME_ZONE, "EEE, MMM d, yyyy 'at' h:mm a");
  const responses = responsesLink(form);
  const sheetUrl = responses.url;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const subject = (isTest ? 'TEST · ' : '') + 'Website contact: ' + reason + ' · ' + name;

  const row = (label, html) =>
    '<tr><td style="padding:6px 16px 6px 0;color:#777;white-space:nowrap;vertical-align:top">' +
    label + '</td><td style="padding:6px 0;color:#111">' + html + '</td></tr>';
  const button = (href, label, bg, fg) =>
    '<a href="' + href + '" style="display:inline-block;margin:0 8px 8px 0;padding:10px 18px;' +
    'border-radius:999px;background:' + bg + ';color:' + fg + ';font-weight:600;text-decoration:none">' +
    label + '</a>';

  const htmlBody =
    '<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;max-width:600px">' +
    '<div style="background:#111;color:#ffcf33;padding:16px 20px;border-radius:12px 12px 0 0;font-size:18px;font-weight:700">' +
    'New message from kommissary.com</div>' +
    '<div style="border:1px solid #e5e5e5;border-top:0;border-radius:0 0 12px 12px;padding:20px">' +
    '<table style="border-collapse:collapse;margin-bottom:16px">' +
    row('Name', esc(name)) +
    row('Email', validEmail ? '<a href="mailto:' + esc(email) + '">' + esc(email) + '</a>' : esc(email) || '—') +
    row('Phone', phone ? '<a href="tel:' + esc(phone.replace(/[^\d+]/g, '')) + '">' + esc(phone) + '</a>' : '—') +
    row('Reason', '<b>' + esc(reason) + '</b>') +
    row('Received', esc(when)) +
    row('All responses', '<a href="' + sheetUrl + '">' + responses.label + '</a>') +
    '</table>' +
    '<div style="background:#f6f6f6;border-left:4px solid #ff6666;padding:12px 16px;border-radius:6px;white-space:pre-wrap;color:#111">' +
    esc(message) + '</div>' +
    '<div style="margin-top:20px">' +
    (validEmail ? button('mailto:' + esc(email) + '?subject=' + encodeURIComponent('Re: your message to Kommissary'),
      'Reply to ' + esc(first || name), '#ff6666', '#fff') : '') +
    button(sheetUrl, responses.label, '#111', '#ffcf33') +
    '</div></div></div>';

  const textBody = [
    'New message from kommissary.com', '',
    'Name: ' + name, 'Email: ' + (email || '—'), 'Phone: ' + (phone || '—'),
    'Reason: ' + reason, 'Received: ' + when, '', message, '',
    'All responses: ' + sheetUrl,
  ].join('\n');

  const options = { name: SENDER_NAME, htmlBody: htmlBody };
  if (validEmail) options.replyTo = email; // Reply goes to the person, not the team.
  MailApp.sendEmail(RECIPIENTS.join(','), subject, textBody, options);
}

/** The linked responses sheet, or the form's own Responses tab if no sheet is linked. */
function responsesLink(form) {
  try {
    if (form.getDestinationType() === FormApp.DestinationType.SPREADSHEET) {
      return {
        url: 'https://docs.google.com/spreadsheets/d/' + form.getDestinationId() + '/edit',
        label: 'Open the responses sheet',
      };
    }
  } catch (err) {
    // No destination set: fall through to the form's Responses tab.
  }
  return { url: form.getEditUrl().replace(/\/edit.*$/, '/edit#responses'), label: 'Open responses in the form' };
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
