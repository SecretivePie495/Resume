export const BASE = {
  name: 'Udo Onyekwere',
  contact: 'Denton, TX &nbsp;|&nbsp; 940-300-6036 &nbsp;|&nbsp; udo.onyekwere.resume@gmail.com &nbsp;|&nbsp; linkedin.com/in/udoonyekwere',
  aafes: {
    company: 'AAFES &mdash; Army &amp; Air Force Exchange Service, Department of Defense',
    location: 'Dallas, TX',
    dates: 'Nov 2022 &ndash; Present',
    title: 'Data Security Analyst, Intrusion Detection &amp; Prevention &ndash; Firewall Security',
    bullets: [
      'Monitored and analyzed Cisco FMC security logs to identify, triage, and respond to security incidents, documenting incidents and remediation steps in ServiceNow for streamlined tracking and audit-ready resolution.',
      'Configured and maintained Cisco ASA Firewalls, including rule changes, policy updates, and system administration via CLI and SSH.',
      'Designed, implemented, and maintained firewall technologies and network security controls across every Army and Air Force database worldwide, ensuring secure and reliable network operations at global scale.',
      'Partnered with cross-functional IT and security teams to triage intrusion alerts and escalate incidents in accordance with DoD security protocols and change-control procedures.',
    ],
  },
  utg: {
    company: 'UTG Media',
    location: 'Dallas, TX',
    dates: 'Nov 2022 &ndash; Present',
    bullets: [
      'Architected Airtable-based marketing and CRM systems automating campaign tracking, content approvals, and performance analytics across multiple clients.',
      'Built Airtable automations and interfaces integrating OpenAI, Make, and Slack for real-time reporting and content scheduling.',
      'Designed multi-table data models and formula-driven logic to unify marketing and sales pipelines, increasing collaboration and transparency.',
      'Partnered with fintech and enterprise clients (including Goldman Sachs and Fortezsa) to automate Airtable CRM and inventory tracking workflows, boosting data accuracy and speed by 30&ndash;40%.',
      'Delivered internal Airtable training sessions to cross-functional teams, documenting best practices and workflow guides.',
      'Oversaw Airtable data integrity via validation scripts, sync tables, and field governance models.',
    ],
  },
  purvis: {
    company: 'Purvis Industries',
    location: 'Dallas, TX',
    dates: 'June 2022 &ndash; July 2022',
    title: 'Tech Support &ndash; Contract',
    bullets: [
      'Built and configured PCs, laptops, printers, and VPNs; managed IT requests and applications; resolved hardware/software issues, improving uptime and productivity.',
    ],
  },
  education: {
    degree: 'Bachelor of Computer Information Systems, Cybersecurity Certification',
    school: 'The University of Texas at Tyler, Soules College of Business',
    dates: 'Fall 2018 &ndash; Spring 2022',
    honors: 'Presidential Fellowship (Full-ride academic scholarship)',
  },
};

export interface TailoredJob {
  subtitle: string;
  summary: string;
  core_competencies: string;
  skills: Array<{ cat: string; items: string }>;
  utg_title: string;
  utg_bullets: string[];
}

export const CSS = `
  @page { margin-top: 0.45in; }
  @page :first { margin-top: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Calibri', 'Arial', sans-serif;
    font-size: 10.5pt;
    color: #000;
    padding: 0.60in 0.70in;
    line-height: 1.33;
  }
  .name { text-align: center; font-size: 26pt; font-weight: bold; color: #1a3468; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
  .subtitle { text-align: center; font-size: 11pt; font-weight: bold; color: #1a3468; margin-bottom: 6px; }
  .contact { text-align: center; font-size: 10pt; color: #222; margin-bottom: 10px; }
  .section-header { color: #1a3468; font-size: 12pt; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #1a3468; padding-bottom: 2px; margin-bottom: 7px; margin-top: 12px; }
  ul { margin-left: 18px; margin-bottom: 5px; }
  ul li { margin-bottom: 2.5px; list-style-type: square; }
  .job { margin-bottom: 9px; page-break-inside: avoid; break-inside: avoid; }
  .job-header { display: flex; justify-content: space-between; align-items: baseline; }
  .job-company { font-weight: bold; font-size: 10.5pt; flex: 1 1 auto; min-width: 0; }
  .job-date { font-weight: bold; font-size: 10pt; white-space: nowrap; margin-left: 10px; flex-shrink: 0; }
  .job-subheader { display: flex; justify-content: space-between; align-items: baseline; font-style: italic; margin-bottom: 3px; }
  .job-title { font-size: 10pt; flex: 1 1 auto; min-width: 0; }
  .job-location { font-size: 10pt; white-space: nowrap; margin-left: 10px; flex-shrink: 0; }
  .skill-line { margin-bottom: 4px; }
  a { color: #000; }
  p { margin-bottom: 5px; }
`;

function jobBlock(company: string, dates: string, title: string, location: string, bullets: string[]): string {
  const bulletsHtml = bullets.map(b => `<li>${b}</li>`).join('\n    ');
  return `
<div class="job">
  <div class="job-header">
    <span class="job-company">${company}</span>
    <span class="job-date">${dates}</span>
  </div>
  <div class="job-subheader">
    <span class="job-title">${title}</span>
    <span class="job-location">${location}</span>
  </div>
  <ul>${bulletsHtml}</ul>
</div>`;
}

export function buildHTML(job: TailoredJob): string {
  const skillsHtml = job.skills.map(s => `<p class="skill-line"><strong>${s.cat}:</strong> ${s.items}</p>`).join('\n');
  const edu = BASE.education;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>${CSS}</style></head>
<body>
<div class="name">${BASE.name}</div>
<div class="subtitle">${job.subtitle}</div>
<div class="contact">${BASE.contact}</div>
<div class="section-header">Professional Profile</div>
<p>${job.summary}</p>
<div class="section-header">Core Competencies</div>
<p>${job.core_competencies}</p>
<div class="section-header">Technical Skills</div>
${skillsHtml}
<div class="section-header">Experience</div>
${jobBlock(BASE.aafes.company, BASE.aafes.dates, BASE.aafes.title, BASE.aafes.location, BASE.aafes.bullets)}
${jobBlock(BASE.utg.company, BASE.utg.dates, job.utg_title, BASE.utg.location, job.utg_bullets)}
${jobBlock(BASE.purvis.company, BASE.purvis.dates, BASE.purvis.title, BASE.purvis.location, BASE.purvis.bullets)}
<div class="section-header">Education</div>
<p>${edu.degree} &mdash; ${edu.school} &nbsp;|&nbsp; ${edu.dates} &nbsp;|&nbsp; ${edu.honors}</p>
</body>
</html>`;
}
