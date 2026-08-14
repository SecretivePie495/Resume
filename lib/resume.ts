export const BASE = {
  name: 'Udo Onyekwere',
  location: 'Denton, TX',
  phone: '(940) 350-9142',
  email: 'udo.onyekwere.resume@gmail.com',
  linkedinUrl: 'https://linkedin.com/in/udoonyekwere',
  githubUrl: 'https://github.com/SecretivePie495',
  skills: [
    { cat: 'AI &amp; Automation', items: 'OpenAI, Claude, Claude Code, LangChain, MCPs, AI Agents, Retrieval-Augmented Generation (RAG), Prompt Engineering, Context Engineering, Custom Workflow Automation' },
    { cat: 'AI Fundamentals', items: 'Transformer Architecture, Neural Network Fundamentals, Agentic Loops &amp; Tool-Use Patterns, Context Window Management, Model Capability/Limitation Analysis' },
    { cat: 'Automation Platforms', items: 'React, Next.js, TypeScript, Redux, Tailwind CSS, Bootstrap, Responsive Web Design' },
    { cat: 'Enterprise Systems &amp; Integration', items: 'Node.js, Express.js, FastAPI, Microservices, REST APIs, Webhooks' },
    { cat: 'Automation &amp; Integration', items: 'Make, Zapier, n8n, Airtable Automations, ServiceNow, Slack, HubSpot, Microsoft Teams' },
    { cat: 'Languages', items: 'PostgreSQL, SQL Server, Redis, Airtable' },
    { cat: 'Cloud &amp; DevOps', items: 'Microsoft Azure, Azure App Services, Azure Functions' },
    { cat: 'Security', items: 'OAuth 2.0, JWT, RBAC, Azure Active Directory, Microsoft Graph API' },
    { cat: 'AI &amp; Generative AI', items: 'OpenAI, Claude, LangChain, Retrieval-Augmented Generation (RAG), AI Agents, Prompt Engineering' },
    { cat: 'Software Engineering', items: 'Object-Oriented Design (OOD), SOLID Principles, Design Patterns, Unit Testing, Integration Testing, Code Reviews, Git Workflow, Performance Optimization, API Design, System Integration' },
  ],
  utg: {
    company: 'UTG Media',
    dates: 'Jan 2023 &ndash; Present',
    title: 'Founder &amp; Lead Software Engineer',
    bullets: [
      'Use Claude Code as primary development environment to design, build, and ship full-stack AI applications (React/Next.js, FastAPI, PostgreSQL) from scratch to production in days rather than weeks, including agent orchestration, RAG pipelines, and CI/CD deployment to Azure.',
      'Founded and run an AI consultancy designing and implementing custom AI automation systems for clients, using React, Next.js, TypeScript, Python, FastAPI, PostgreSQL, and Microsoft Azure to automate business workflows, AI-assisted decision making, document processing, CRM operations, and customer engagement.',
      'Design and implement AI automation workflows for client engagements, integrating OpenAI, Claude, LangChain, Make, Zapier, n8n, Airtable, HubSpot, Slack, and REST APIs to orchestrate multi-step business processes and reduce manual effort.',
      'Build AI agents powered by Retrieval-Augmented Generation (RAG), vector embeddings, semantic search, prompt orchestration, and contextual memory for clients needing automated document analysis, knowledge retrieval, customer support, and content generation.',
      'Develop backend microservices exposing secure REST APIs for prompt management, conversation history, document ingestion, vector indexing, and workflow execution as part of each client engagement.',
      'Build React and Next.js dashboards giving client teams real-time visibility into AI workflow execution, automation status, LLM usage, approval pipelines, and operational metrics.',
      'Implement enterprise security (OAuth 2.0, JWT, RBAC, Azure Active Directory) to protect client AI services, APIs, and data across every engagement.',
      'Containerize services with Docker and set up CI/CD pipelines with GitHub Actions, deploying client systems to Azure App Services and Azure Functions.',
      'Delivered AI automation systems for clients including Goldman Sachs and Fortezsa, reducing manual business operations by approximately 40% and accelerating digital transformation for each.',
    ],
  },
  aafes: {
    company: 'Army &amp; Airforce Exchange Service - AAFES',
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
    dates: 'Aug 2021 &ndash; Apr 2022',
    title: 'Information Technology Support Specialist',
    bullets: [
      'Provided Tier 1 and Tier 2 technical support for Microsoft 365, Windows, networking, and endpoint issues across academic and administrative departments.',
      'Administered user provisioning, identity management, and access control through Azure Active Directory and Active Directory.',
      'Utilized ServiceNow and PowerShell to automate administrative tasks, resolve incidents, and document technical solutions following ITSM best practices.',
      'Supported Microsoft Teams, Zoom, VPN connectivity, endpoint deployments, and enterprise IT operations while assisting faculty, staff, and students.',
    ],
  },
  projects: [
    {
      title: 'Goldman Sachs &ndash; AI Automation for Inventory Management',
      bullets: [
        'Led the design and implementation of AI-driven automation agents leveraging OpenAI and Claude to optimize inventory workflows, reducing manual tracking efforts by 40%.',
        'Built experimental prompt chains and multi-agent workflows to monitor and predict inventory needs, integrating structured data pipelines from internal systems.',
        'Developed secure full-stack application components using React, Node.js, REST APIs, and PostgreSQL, integrating enterprise inventory systems with AI services while providing real-time dashboards, workflow management, and operational reporting.',
      ],
    },
  ],
  education: {
    degree: 'Bachelor of Science',
    school: 'The University of Texas at Tyler',
    dates: '2018 &ndash; 2022',
    honors: 'Presidential Fellowship (Full-ride academic scholarship)',
  },
};

export interface TailoredJob {
  name: string;
  location: string;
  phone: string;
  email: string;
  linkedinUrl: string;
  subtitle: string;
  summary: string;
  utg_title: string;
  utg_bullets: string[];
  aafes_bullets?: string[];
  purvis_bullets?: string[];
  skills_order?: string[];
}

export interface ResumeStyle {
  fontFamily: string;
  nameSize: number;
  subtitleSize: number;
  sectionSize: number;
  bodySize: number;
  accentColor: string;
  secondaryColor: string;
}

export const FONT_OPTIONS: Record<string, string> = {
  'Times New Roman': `'Times New Roman', Times, serif`,
  'Georgia': `Georgia, 'Times New Roman', serif`,
  'Calibri': `Calibri, 'Segoe UI', Arial, sans-serif`,
  'Arial': `Arial, Helvetica, sans-serif`,
  'Helvetica': `Helvetica, Arial, sans-serif`,
};

export const DEFAULT_STYLE: ResumeStyle = {
  fontFamily: 'Times New Roman',
  nameSize: 21,
  subtitleSize: 11,
  sectionSize: 12,
  bodySize: 10.5,
  accentColor: '#1f3a5f',
  secondaryColor: '#444444',
};

function buildCSS(style: ResumeStyle): string {
  const fontStack = FONT_OPTIONS[style.fontFamily] ?? FONT_OPTIONS['Times New Roman'];
  const contactSize = Math.max(7, style.bodySize - 1);
  const dateSize = Math.max(7, style.bodySize - 0.5);

  return `
  @page { margin-top: 0.45in; }
  @page :first { margin-top: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: ${fontStack};
    font-size: ${style.bodySize}pt;
    color: #000;
    padding: 0.55in 0.7in;
    line-height: 1.32;
  }
  .name { text-align: center; font-size: ${style.nameSize}pt; font-weight: bold; color: ${style.accentColor}; margin-bottom: 2px; }
  .subtitle { text-align: center; font-size: ${style.subtitleSize}pt; font-weight: bold; color: ${style.secondaryColor}; margin-bottom: 4px; }
  .contact { text-align: center; font-size: ${contactSize}pt; color: ${style.secondaryColor}; margin-bottom: 8px; }
  .contact a { color: #0000ff; text-decoration: underline; }
  .section-header { color: ${style.accentColor}; font-size: ${style.sectionSize}pt; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; margin-top: 10px; }
  .summary { text-align: justify; margin-bottom: 4px; }
  ul { margin-left: 16px; margin-bottom: 4px; }
  ul li { margin-bottom: 2px; list-style-type: disc; text-align: justify; }
  .job { margin-bottom: 8px; page-break-inside: avoid; break-inside: avoid; }
  .job-header { display: flex; justify-content: space-between; align-items: baseline; font-size: ${style.bodySize}pt; }
  .job-header b { color: ${style.accentColor}; }
  .job-date { font-style: italic; color: ${style.secondaryColor}; font-size: ${dateSize}pt; white-space: nowrap; margin-left: 10px; flex-shrink: 0; }
  .skill-line { margin-bottom: 3px; }
  .skill-line strong { color: ${style.accentColor}; }
  a { color: #000; }
  p { margin-bottom: 4px; }
`;
}

function jobBlock(company: string, title: string, dates: string, bullets: string[]): string {
  const bulletsHtml = bullets.map(b => `<li>${b}</li>`).join('\n    ');
  return `
<div class="job">
  <div class="job-header">
    <b>${company} &mdash; ${title}</b>
    <span class="job-date">${dates}</span>
  </div>
  <ul>${bulletsHtml}</ul>
</div>`;
}

function projectBlock(title: string, bullets: string[]): string {
  const bulletsHtml = bullets.map(b => `<li>${b}</li>`).join('\n    ');
  return `
<div class="job">
  <div class="job-header"><b>${title}</b></div>
  <ul>${bulletsHtml}</ul>
</div>`;
}

export function buildHTML(job: TailoredJob, style: ResumeStyle = DEFAULT_STYLE): string {
  const orderedSkills = job.skills_order && job.skills_order.length === BASE.skills.length
    ? job.skills_order
        .map(cat => BASE.skills.find(s => s.cat === cat))
        .filter((s): s is (typeof BASE.skills)[number] => !!s)
    : BASE.skills;
  const skillsHtml = (orderedSkills.length === BASE.skills.length ? orderedSkills : BASE.skills)
    .map(s => `<p class="skill-line"><strong>${s.cat}:</strong> ${s.items}</p>`).join('\n');
  const edu = BASE.education;
  const projectsHtml = BASE.projects.map(p => projectBlock(p.title, p.bullets)).join('\n');
  const aafesBullets = job.aafes_bullets?.length ? job.aafes_bullets : BASE.aafes.bullets;
  const purvisBullets = job.purvis_bullets?.length ? job.purvis_bullets : BASE.purvis.bullets;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>${buildCSS(style)}</style></head>
<body>
<div class="name">${job.name}</div>
<div class="subtitle">${job.subtitle}</div>
<div class="contact">${job.location} &nbsp;|&nbsp; ${job.phone} &nbsp;|&nbsp; ${job.email} &nbsp;|&nbsp; <a href="${job.linkedinUrl}">LinkedIn</a> &nbsp;|&nbsp; <a href="${BASE.githubUrl}">GitHub</a></div>
<div class="section-header">Professional Summary</div>
<p class="summary">${job.summary}</p>
<div class="section-header">Technical Skills</div>
${skillsHtml}
<div class="section-header">Experience</div>
${jobBlock(BASE.utg.company, job.utg_title, BASE.utg.dates, job.utg_bullets)}
${jobBlock(BASE.aafes.company, BASE.aafes.title, BASE.aafes.dates, aafesBullets)}
${jobBlock(BASE.purvis.company, BASE.purvis.title, BASE.purvis.dates, purvisBullets)}
${jobBlock(BASE.uttyler_it.company, BASE.uttyler_it.title, BASE.uttyler_it.dates, BASE.uttyler_it.bullets)}
<div class="section-header">Education</div>
<div class="job-header"><b>${edu.degree} &mdash; ${edu.school}</b><span class="job-date">${edu.dates}</span></div>
<p>${edu.honors}</p>
<div class="section-header">Key Projects</div>
${projectsHtml}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildCoverLetterHTML(text: string, style: ResumeStyle = DEFAULT_STYLE): string {
  const fontStack = FONT_OPTIONS[style.fontFamily] ?? FONT_OPTIONS['Times New Roman'];
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(block => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>
  @page { margin: 0.9in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: ${fontStack}; font-size: ${style.bodySize}pt; color: #000; line-height: 1.5; }
  p { margin-bottom: 12px; white-space: pre-wrap; }
</style></head>
<body>
${paragraphs}
</body>
</html>`;
}
