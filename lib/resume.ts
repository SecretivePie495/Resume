export const BASE = {
  name: 'Udo Onyekwere',
  contact: 'Denton, TX &nbsp;|&nbsp; (917) 675-5324 &nbsp;|&nbsp; onyekwereudoai@gmail.com &nbsp;|&nbsp; linkedin.com/in/udoonyekwere',
  utg: {
    company: 'UTG Media',
    location: 'Dallas, TX',
    dates: 'Jan 2023 &ndash; Present',
    title: 'Founder &amp; Lead Software Engineer',
    bullets: [
      'Architected and developed an enterprise AI Automation Platform using React, Next.js, TypeScript, Python, FastAPI, PostgreSQL, and Microsoft Azure, enabling organizations to automate business workflows, AI-assisted decision making, document processing, CRM operations, and customer engagement through a unified cloud application.',
      'Designed and implemented AI automation workflows integrating OpenAI, Claude, LangChain, Make, Zapier, n8n, Airtable, HubSpot, Slack, and enterprise REST APIs, orchestrating multi-step business processes that significantly reduced manual effort and improved operational efficiency.',
      'Engineered AI agents powered by Retrieval-Augmented Generation (RAG), vector embeddings, semantic search, prompt orchestration, and contextual memory to automate document analysis, knowledge retrieval, customer support, content generation, and internal business operations.',
      'Developed scalable backend microservices exposing secure REST APIs for prompt management, conversation history, document ingestion, vector indexing, workflow execution, and enterprise system integrations while supporting multi-tenant cloud deployments.',
      'Built responsive React and Next.js dashboards providing real-time visibility into AI workflow execution, automation status, LLM usage, approval pipelines, analytics, and operational metrics for business users and administrators.',
      'Implemented enterprise security using OAuth 2.0, JWT, RBAC, and Azure Active Directory, protecting AI services, APIs, workflow automation, and customer data while supporting secure authentication across integrated enterprise applications.',
      'Containerized cloud-native services with Docker and implemented automated CI/CD pipelines using GitHub Actions, deploying applications to Azure App Services and Azure Functions while improving deployment reliability, scalability, and release efficiency.',
      'Delivered enterprise AI automation solutions for clients including Goldman Sachs and Fortezsa, reducing manual business operations by approximately 40%, accelerating digital transformation initiatives, and improving productivity through intelligent workflow automation and AI-powered business processes.',
    ],
  },
  aafes: {
    company: 'AAFES &mdash; Army &amp; Air Force Exchange Service, Department of Defense',
    location: 'Dallas, TX',
    dates: 'Oct 2022 &ndash; Present',
    title: 'Data Security Analyst',
    bullets: [
      'Monitored and analyzed Cisco FMC security logs to identify, investigate, and respond to security incidents, documenting root cause and remediation steps in ServiceNow to streamline tracking and resolution across the security operations team.',
      'Configured and maintained Cisco ASA firewalls via CLI/SSH, including rule changes, access-control policies, and scripted automation for repeatable configuration tasks.',
      'Designed, implemented, and maintained firewall and network security architecture supporting Army and Air Force database systems worldwide, ensuring secure, reliable, and compliant network operations across a globally distributed infrastructure.',
      'Built backend APIs integrating Cisco FMC, Cisco ASA, ServiceNow, Microsoft Graph API, and Azure Active Directory to automate security monitoring and incident management.',
      'Automated firewall log normalization, security event correlation, and compliance reporting using Python, reducing manual investigation effort.',
      'Developed a Security Operations Dashboard using React, TypeScript, and Node.js, providing centralized visibility into firewall health, security incidents, and compliance metrics.',
      'Implemented enterprise authentication (Azure AD, OAuth 2.0, JWT, RBAC) to secure internal security tooling and applications.',
    ],
  },
  purvis: {
    company: 'Purvis Industries',
    location: 'Dallas, TX',
    dates: 'June 2019 &ndash; July 2022',
    title: 'Full Stack Developer',
    bullets: [
      'Designed a centralized Inventory Management Platform using React, Node.js, Express.js, and SQL Server, replacing spreadsheet-based inventory tracking with a scalable enterprise web application.',
      'Developed RESTful APIs supporting inventory transactions, procurement workflows, warehouse transfers, supplier management, and real-time inventory synchronization.',
      'Implemented backend business services handling inventory validation, approval workflows, transactional processing, and business rules.',
      'Optimized SQL Server schemas, indexing strategies, and stored procedures supporting high-volume inventory operations and reporting.',
      'Deployed production applications through Azure App Services using Git and Azure DevOps CI/CD pipelines, improving deployment consistency and release quality.',
      'Collaborated with Agile Scrum teams throughout requirements gathering, development, testing, code reviews, and production releases, improving inventory accuracy and operational efficiency.',
    ],
  },
  uttyler_it: {
    company: 'University of Texas at Tyler',
    location: 'Tyler, TX',
    dates: 'Aug 2021 &ndash; Apr 2022',
    title: 'Information Technology Support Specialist',
    bullets: [
      'Provided Tier 1 and Tier 2 technical support for Microsoft 365, Windows, networking, and endpoint issues across academic and administrative departments.',
      'Administered user provisioning, identity management, and access control through Azure Active Directory and Active Directory.',
      'Utilized ServiceNow and PowerShell to automate administrative tasks, resolve incidents, and document technical solutions following ITSM best practices.',
      'Supported Microsoft Teams, Zoom, VPN connectivity, endpoint deployments, and enterprise IT operations while assisting faculty, staff, and students.',
    ],
  },
  education: {
    degree: 'Bachelor of Science',
    school: 'The University of Texas at Tyler',
    dates: '2018 &ndash; 2022',
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
${jobBlock(BASE.utg.company, BASE.utg.dates, job.utg_title, BASE.utg.location, job.utg_bullets)}
${jobBlock(BASE.aafes.company, BASE.aafes.dates, BASE.aafes.title, BASE.aafes.location, BASE.aafes.bullets)}
${jobBlock(BASE.purvis.company, BASE.purvis.dates, BASE.purvis.title, BASE.purvis.location, BASE.purvis.bullets)}
${jobBlock(BASE.uttyler_it.company, BASE.uttyler_it.dates, BASE.uttyler_it.title, BASE.uttyler_it.location, BASE.uttyler_it.bullets)}
<div class="section-header">Education</div>
<p>${edu.degree} &mdash; ${edu.school} &nbsp;|&nbsp; ${edu.dates} &nbsp;|&nbsp; ${edu.honors}</p>
</body>
</html>`;
}
