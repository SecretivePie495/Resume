export const BASE = {
  name: 'Udo Onyekwere',
  contact: 'Denton, TX &nbsp;|&nbsp; 940-300-6036 &nbsp;|&nbsp; udo.onyekwere.resume@gmail.com &nbsp;|&nbsp; linkedin.com/in/udoonyekwere',
  utg: {
    company: 'UTG Media &nbsp;|&nbsp; Dallas, TX',
    dates: 'Nov 2022 &ndash; Present',
    title: 'No-Code Developer, AI Integration Specialist',
    bullets: [
      'Architected Airtable-based marketing and CRM systems automating campaign tracking, content approvals, and performance analytics across multiple clients.',
      'Built Airtable automations and interfaces integrating OpenAI, Make, and Slack for real-time reporting and content scheduling.',
      'Designed multi-table data models and formula-driven logic to unify marketing and sales pipelines, increasing collaboration and transparency.',
      'Partnered with fintech and enterprise clients (including Goldman Sachs and Fortezsa) to automate Airtable CRM and inventory tracking workflows, boosting data accuracy and speed by 30&ndash;40%.',
      'Delivered internal Airtable training sessions to cross-functional teams, documenting best practices and workflow guides.',
      'Oversaw Airtable data integrity via validation scripts, sync tables, and field governance models.',
    ],
  },
  aafes: {
    title: 'Data Security Analyst, Intrusion Detection &amp; Prevention &ndash; Firewall Security',
    dates: 'Nov 2022 &ndash; Present',
    company: 'AAFES &ndash; Army &amp; Air Force Exchange Service, Department of Defense &nbsp;|&nbsp; Dallas, TX',
    bullets: [
      'Monitored and analyzed Cisco FMC security logs to identify and respond to security incidents, documenting incidents and remediation steps in ServiceNow for streamlined tracking and resolution.',
      'Experienced in configuring Cisco ASA Firewalls &amp; scripting within the CLI and SSH.',
      'Ensured secure and reliable network operations by designing, implementing, and maintaining computer networks and firewall technologies internationally across every Army and Air Force database worldwide.',
    ],
  },
  projects: [
    {
      name: 'Goldman Sachs &mdash; AI Automation for Inventory Management',
      bullet: 'Led the design and implementation of AI-driven automation agents leveraging OpenAI and Claude to optimize inventory workflows, reducing manual tracking efforts by 40%. Built experimental prompt chains and multi-agent workflows to monitor and predict inventory needs, integrating structured data pipelines from internal systems.',
    },
  ],
  education: {
    degree: 'Bachelor of Computer Information Systems',
    school: 'University of Texas at Tyler &ndash; Soules College of Business, Tyler, TX',
    dates: '2018 &ndash; 2022',
    honors: 'Presidential Fellowship (Full-Ride Academic Scholarship) &amp; Cybersecurity Certification',
  },
};

export interface TailoredJob {
  subtitle: string;
  summary: string;
  skills: Array<{ cat: string; items: string }>;
  utg_title: string;
  utg_bullets: string[];
  lead_revival_bullet: string;
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
  .contact { text-align: center; font-size: 10pt; color: #222; margin-bottom: 8px; }
  .subtitle-bar { background: #dce6f0; text-align: center; font-size: 10.5pt; font-weight: bold; color: #1a3468; padding: 5px 10px; margin-bottom: 13px; }
  .section-header { color: #1a3468; font-size: 12pt; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #1a3468; padding-bottom: 2px; margin-bottom: 7px; margin-top: 12px; }
  ul { margin-left: 18px; margin-bottom: 5px; }
  ul li { margin-bottom: 2.5px; list-style-type: square; }
  .job { margin-bottom: 9px; page-break-inside: avoid; break-inside: avoid; }
  .job-header { display: flex; justify-content: space-between; align-items: baseline; }
  .job-title { font-weight: bold; font-size: 10.5pt; flex: 1 1 auto; min-width: 0; }
  .job-date { font-weight: bold; font-size: 10pt; white-space: nowrap; margin-left: 10px; flex-shrink: 0; }
  .job-company { font-weight: bold; margin-bottom: 3px; font-size: 10pt; }
  .project { margin-bottom: 7px; page-break-inside: avoid; break-inside: avoid; }
  .project-name { font-weight: bold; margin-bottom: 2px; }
  a { color: #000; }
  p { margin-bottom: 5px; }
`;

export function buildHTML(job: TailoredJob): string {
  const skillsHtml = job.skills.map(s => `<li><strong>${s.cat}:</strong> ${s.items}</li>`).join('\n  ');
  const utgBullets = job.utg_bullets.map(b => `<li>${b}</li>`).join('\n      ');
  const aafessBullets = BASE.aafes.bullets.map(b => `<li>${b}</li>`).join('\n    ');
  const extraProjects = BASE.projects.map(p => `
<div class="project">
  <div class="project-name">${p.name}</div>
  <ul><li>${p.bullet}</li></ul>
</div>`).join('');
  const edu = BASE.education;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>${CSS}</style></head>
<body>
<div class="name">${BASE.name}</div>
<div class="contact">${BASE.contact}</div>
<div class="subtitle-bar">${job.subtitle}</div>
<div class="section-header">Professional Summary</div>
<p>${job.summary}</p>
<div class="section-header">Core Skills</div>
<ul>${skillsHtml}</ul>
<div class="section-header">Professional Experience</div>
<div class="job">
  <div class="job-header">
    <span class="job-title">${job.utg_title}</span>
    <span class="job-date">${BASE.utg.dates}</span>
  </div>
  <div class="job-company">${BASE.utg.company}</div>
  <ul>${utgBullets}</ul>
</div>
<div class="job">
  <div class="job-header">
    <span class="job-title">${BASE.aafes.title}</span>
    <span class="job-date">${BASE.aafes.dates}</span>
  </div>
  <div class="job-company">${BASE.aafes.company}</div>
  <ul>${aafessBullets}</ul>
</div>
<div class="section-header" style="margin-top: 24px;">Projects</div>
<div class="project">
  <div class="project-name">Lead Revival OS</div>
  <ul><li>${job.lead_revival_bullet}</li></ul>
</div>
${extraProjects}
<div class="section-header">Education</div>
<p><strong>${edu.degree}</strong><br>
${edu.school} &nbsp;|&nbsp; ${edu.dates}<br>
<strong>Honors:</strong> ${edu.honors}</p>
</body>
</html>`;
}

