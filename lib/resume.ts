export const BASE = {
  name: 'UDO ONYEKWERE',
  contact: 'Denton, TX &nbsp;|&nbsp; (940) 300-6036 &nbsp;|&nbsp; udo.onyekwere.resume@gmail.com &nbsp;|&nbsp; linkedin.com/in/udoonyekwere',
  utg: {
    company: 'UTG Media &nbsp;|&nbsp; Dallas, TX &nbsp;|&nbsp; Remote',
    dates: 'Nov 2022 &ndash; Present',
  },
  aafes: {
    title: 'Data Security Analyst &ndash; Intrusion Detection &amp; Firewall Security',
    dates: 'Nov 2022 &ndash; Present',
    company: 'Army &amp; Air Force Exchange Service (AAFES) &ndash; Department of Defense &nbsp;|&nbsp; Dallas, TX',
    bullets: [
      'Operate in a compliance-driven DoD environment &mdash; monitoring network traffic, managing incident workflows in ServiceNow, and maintaining process discipline across global Army and Air Force infrastructure.',
      'Configure and maintain Cisco ASA firewalls and Cisco FMC &mdash; enforcing security policies and documenting all changes for audit and compliance.',
    ],
  },
  projects: [
    {
      name: 'Faceless B-Roll &mdash; facelessbroll.com',
      bullet: 'AI-powered content platform generating B-roll video for 25+ creators. Built on Python, OpenAI API, and automated media pipelines.',
    },
    {
      name: 'CreatorSplit',
      bullet: 'Full-stack web application for content creator revenue splits. Built with Next.js, Supabase, and Vercel.',
    },
  ],
  education: {
    degree: 'Bachelor of Computer Information Systems',
    school: 'University of Texas at Tyler &ndash; Soules College of Business, Tyler, TX',
    dates: '2018 &ndash; 2022',
    honors: 'Presidential Fellowship (Full-Ride Academic Scholarship)',
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
  .job-title { font-weight: bold; font-size: 10.5pt; }
  .job-date { font-weight: bold; font-size: 10pt; white-space: nowrap; margin-left: 10px; }
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

