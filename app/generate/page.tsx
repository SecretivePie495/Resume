'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ResumePicker from '@/components/ResumePicker';

interface JobResult {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companyEmployeesCount?: number;
  location: string;
  url: string;
  linkedinUrl?: string;
  description: string;
  salary?: string;
  postedAt?: string;
  workplaceType?: string;
  employmentType?: string;
  seniorityLevel?: string;
  applicantsCount?: string;
  industries?: string;
  jobFunction?: string;
  recruiterName?: string;
  recruiterTitle?: string;
  recruiterUrl?: string;
  locationMatch: boolean;
  skillScore: number;
  alreadyTailored: boolean;
  source: string;
  matchedSkills: string[];
}

type Step = 'resume' | 'skills' | 'jobs';

function daysAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return '1 week ago';
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

export default function GeneratePage() {
  const [step, setStep]                     = useState<Step>('resume');
  const [resume, setResume]                 = useState('');
  const [fileName, setFileName]             = useState('');
  const [parsing, setParsing]               = useState(false);
  const [extracting, setExtracting]         = useState(false);
  const [searching, setSearching]           = useState(false);

  const [skills, setSkills]                 = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole]     = useState('');
  const [country, setCountry]               = useState('United States');
  const [jobLimit, setJobLimit]             = useState<number>(25);
  const [customLimit, setCustomLimit]       = useState('');
  const [searchesLeft, setSearchesLeft]     = useState<number | null>(null);

  const [jobs, setJobs]                     = useState<JobResult[]>([]);
  const [tailoring, setTailoring]           = useState<string | null>(null);
  const [tailoredIds, setTailoredIds]       = useState<Set<string>>(new Set());
  const [showTailored, setShowTailored]     = useState(false);
  const [showDebug, setShowDebug]           = useState(false);
  const [error, setError]                   = useState('');

  const [filterKeyword, setFilterKeyword]           = useState('');
  const [filterDays, setFilterDays]                 = useState<number | null>(null);
  const [filterRemote, setFilterRemote]             = useState(false);
  const [filterHasSalary, setFilterHasSalary]       = useState(false);
  const [filterMinSkill, setFilterMinSkill]         = useState(0);

  const fileInputRef    = useRef<HTMLInputElement>(null);
  const cancelTailorAll = useRef(false);
  void cancelTailorAll;

  useEffect(() => {
    fetch('/api/usage')
      .then(r => r.json())
      .then(d => {
        if (d.plan_def?.searches === -1) { setSearchesLeft(-1); return; }
        const used = d.searches_used ?? 0;
        const max  = (d.plan_def?.searches ?? 0) + (d.extra_resumes ?? 0);
        setSearchesLeft(Math.max(0, max - used));
      })
      .catch(() => {});
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setParsing(true);
    setFileName(file.name);
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch('/api/resume/parse', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to read file');
      setResume(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read file');
      setFileName('');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleExtractSkills() {
    if (!resume.trim()) { setError('Please add your resume first.'); return; }
    setError('');
    setExtracting(true);
    try {
      const res  = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');
      setSkills(data.skills ?? []);
      setSelectedSkills(new Set());
      setSuggestedRoles(data.roleTypes ?? []);
      setSelectedRole(data.roleTypes?.[0] ?? '');
      setCountry(data.country ?? 'United States');
      setStep('skills');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setExtracting(false);
    }
  }

  function toggleSkill(skill: string) {
    setSelectedSkills(prev => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill); else next.add(skill);
      return next;
    });
  }

  async function handleFindJobs() {
    if (!selectedRole.trim()) { setError('Enter a role type to search for.'); return; }
    setError('');
    setSearching(true);
    try {
      const res  = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: Array.from(selectedSkills),
          roleType: selectedRole,
          country,
          limit: jobLimit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setJobs(data.jobs);
      window.dispatchEvent(new Event('resumeos:usage-updated'));
      setTailoredIds(new Set());
      setSearchesLeft(prev => prev !== null && prev !== -1 ? Math.max(0, prev - 1) : prev);
      setFilterKeyword('');
      setFilterDays(null);
      setFilterRemote(false);
      setFilterHasSalary(false);
      setFilterMinSkill(0);
      setStep('jobs');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSearching(false);
    }
  }

  async function tailorForJob(job: JobResult) {
    setTailoring(job.id);
    setError('');
    try {
      const res  = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company:    job.company,
          jobTitle:   job.title,
          jd:         job.description,
          url:        job.url,
          userResume: resume,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tailoring failed');
      setTailoredIds(prev => new Set([...prev, job.id]));
      window.dispatchEvent(new Event('resumeos:usage-updated'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tailoring failed');
    } finally {
      setTailoring(null);
    }
  }

  const filteredJobs = useMemo(() => {
    const now = Date.now();
    return jobs.filter(job => {
      if (!showTailored && job.alreadyTailored) return false;
      if (filterRemote) {
        const loc = job.location.toLowerCase();
        if (!['remote', 'worldwide', 'anywhere', 'global'].some(w => loc.includes(w))) return false;
      }
      if (filterHasSalary && !job.salary) return false;
      if (filterMinSkill > 0 && (job.skillScore ?? 0) < filterMinSkill) return false;
      if (filterDays !== null && job.postedAt) {
        const diff = (now - new Date(job.postedAt).getTime()) / 86400000;
        if (diff > filterDays) return false;
      }
      if (filterKeyword.trim()) {
        const kw = filterKeyword.toLowerCase();
        if (!job.title.toLowerCase().includes(kw) && !job.company.toLowerCase().includes(kw)) return false;
      }
      return true;
    });
  }, [jobs, showTailored, filterRemote, filterHasSalary, filterMinSkill, filterDays, filterKeyword]);

  const STEPS: Step[]                    = ['resume', 'skills', 'jobs'];
  const STEP_LABELS: Record<Step, string> = { resume: 'Resume', skills: 'Profile', jobs: 'Jobs' };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resume Builder</h1>
        <p className="text-slate-500 text-sm mt-1">
          {step === 'resume' && 'Upload your resume — Claude will build your job search profile'}
          {step === 'skills' && 'Confirm your profile — role, location, and skills'}
          {step === 'jobs'   && 'Most recent matching jobs — tailor your resume in one click'}
        </p>
      </div>

      {/* Search countdown */}
      {step === 'resume' && searchesLeft !== null && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${
          searchesLeft === -1  ? 'bg-green-50 border-green-200 text-green-700' :
          searchesLeft === 0   ? 'bg-red-50 border-red-200 text-red-700' :
          searchesLeft <= 3    ? 'bg-amber-50 border-amber-200 text-amber-700' :
          'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {searchesLeft === -1 ? '∞' : searchesLeft === 0 ? '🚫' : searchesLeft <= 3 ? '⚠️' : '🔍'}
            </span>
            <span className="font-medium">
              {searchesLeft === -1 && 'Unlimited job searches this month'}
              {searchesLeft === 0  && 'No job searches left this month'}
              {searchesLeft > 0    && `${searchesLeft} job search${searchesLeft === 1 ? '' : 'es'} remaining this month`}
            </span>
          </div>
          {searchesLeft > 0 && searchesLeft !== -1 && (
            <div className="flex gap-1">
              {Array.from({ length: Math.min(searchesLeft, 10) }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-current opacity-70" />
              ))}
              {searchesLeft > 10 && <span className="text-xs opacity-70">+{searchesLeft - 10}</span>}
            </div>
          )}
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-slate-200" />}
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === s               ? 'bg-blue-600 text-white' :
                STEPS.indexOf(step) > i ? 'bg-green-500 text-white' :
                'bg-slate-200 text-slate-400'
              }`}>{i + 1}</span>
              <span className={`font-medium ${
                step === s               ? 'text-blue-600' :
                STEPS.indexOf(step) > i ? 'text-green-600' :
                'text-slate-400'
              }`}>{STEP_LABELS[s]}</span>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* ── Step 1: Resume ── */}
      {step === 'resume' && (
        <div className="space-y-4">
          <ResumePicker
            currentResume={resume}
            currentFileName={fileName}
            onSelect={(content, name) => { setResume(content); setFileName(name); }}
          />

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Or upload a new resume</h2>

            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFile} className="hidden" id="resume-upload" />
            <label
              htmlFor="resume-upload"
              className={`flex items-center justify-center gap-3 w-full border-2 border-dashed rounded-xl py-6 cursor-pointer transition-colors ${
                parsing  ? 'border-blue-300 bg-blue-50'  :
                fileName ? 'border-green-300 bg-green-50' :
                'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {parsing ? (
                <>
                  <span className="w-5 h-5 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-sm font-medium text-blue-600">Reading file...</span>
                </>
              ) : fileName ? (
                <>
                  <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-green-700 truncate max-w-xs">{fileName}</span>
                  <span className="text-xs text-green-600 underline shrink-0">Change</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <div className="text-center">
                    <span className="text-sm font-medium text-slate-700">Upload PDF or DOCX</span>
                    <span className="text-slate-400 text-sm"> — click to browse</span>
                  </div>
                </>
              )}
            </label>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">or paste manually</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <textarea
              value={resume}
              onChange={e => { setResume(e.target.value); if (fileName) setFileName(''); }}
              placeholder="Paste the full text of your resume here..."
              rows={12}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono leading-relaxed"
            />

            <button
              onClick={handleExtractSkills}
              disabled={extracting || parsing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm shadow-sm"
            >
              {extracting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Building your profile...
                </span>
              ) : 'Build My Profile →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Profile ── */}
      {step === 'skills' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Your Job Search Profile</h2>
            <button onClick={() => setStep('resume')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Back
            </button>
          </div>

          {/* Role type */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Role Type
              <span className="text-slate-400 font-normal ml-1.5">— used as the LinkedIn search keyword</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedRoles.map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedRole === role
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              placeholder="Or type a custom role..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Location */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Location
              <span className="text-slate-400 font-normal ml-1.5">— passed to LinkedIn as the job location</span>
            </label>
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="e.g. United States, New York, Remote"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-[11px] text-slate-400">Can be a country, city, or "Remote"</p>
          </div>

          {/* Skills */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Skills
              <span className="text-slate-400 font-normal ml-1.5">— used to score and rank results</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedSkills.has(skill)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">{selectedSkills.size} of {skills.length} selected</p>
          </div>

          {/* Job count */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <label className="block text-sm font-semibold text-slate-800">How many jobs?</label>
            <div className="flex items-center gap-2 flex-wrap">
              {[10, 25, 50].map(n => (
                <button
                  key={n}
                  onClick={() => { setJobLimit(n); setCustomLimit(''); }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    jobLimit === n && !customLimit
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={10}
                max={100}
                value={customLimit}
                onChange={e => {
                  const v = Math.min(100, Math.max(10, Number(e.target.value)));
                  setCustomLimit(e.target.value);
                  setJobLimit(v);
                }}
                placeholder="Custom (10–100)"
                className={`flex-1 min-w-[140px] bg-slate-50 border rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  customLimit ? 'border-blue-400' : 'border-slate-200'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-400">More jobs = longer search. 25 is a good starting point.</p>
          </div>

          <button
            onClick={handleFindJobs}
            disabled={searching}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm shadow-sm"
          >
            {searching ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Searching LinkedIn for {jobLimit} jobs...
              </span>
            ) : `Find ${jobLimit} Jobs on LinkedIn →`}
          </button>
        </div>
      )}

      {/* ── Step 3: Jobs ── */}
      {step === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {filteredJobs.length} of {jobs.length} Jobs
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedRole} · {country}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {tailoredIds.size > 0 && (
                <Link href="/jobs" className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
                  View Resumes ({tailoredIds.size}) →
                </Link>
              )}
              <button
                onClick={() => setShowTailored(v => !v)}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                  showTailored
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                }`}
              >
                {showTailored ? 'Hiding done' : 'Show done'}
              </button>
              <button
                onClick={() => setShowDebug(v => !v)}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                  showDebug
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                }`}
              >
                {showDebug ? 'Hide why' : 'Why these?'}
              </button>
              <button onClick={() => setStep('skills')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                ← Edit Profile
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={filterKeyword}
                onChange={e => setFilterKeyword(e.target.value)}
                placeholder="Search title or company..."
                className="flex-1 min-w-[180px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                <span className="text-xs text-slate-400 shrink-0">Posted:</span>
                <input
                  type="range"
                  min={1}
                  max={90}
                  value={filterDays ?? 90}
                  onChange={e => setFilterDays(Number(e.target.value))}
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
                <button
                  onClick={() => setFilterDays(null)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg border shrink-0 transition-colors ${
                    filterDays === null
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {filterDays === null ? 'All' : `≤ ${filterDays}d`}
                </button>
              </div>

              <button
                onClick={() => setFilterRemote(v => !v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  filterRemote
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                Remote only
              </button>

              <button
                onClick={() => setFilterHasSalary(v => !v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  filterHasSalary
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                Has salary
              </button>

              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400 shrink-0">Skill match:</span>
                <div className="flex items-center gap-1 text-xs bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                  {[0, 1, 2, 3].map(n => (
                    <button
                      key={n}
                      onClick={() => setFilterMinSkill(n)}
                      className={`px-2.5 py-1.5 font-medium transition-colors ${
                        filterMinSkill === n ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {n === 0 ? 'Any' : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>

              {(filterKeyword || filterDays !== null || filterRemote || filterHasSalary || filterMinSkill > 0) && (
                <button
                  onClick={() => {
                    setFilterKeyword('');
                    setFilterDays(null);
                    setFilterRemote(false);
                    setFilterHasSalary(false);
                    setFilterMinSkill(0);
                  }}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {filteredJobs.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl px-6 py-12 text-center text-slate-400 text-sm shadow-sm">
              {jobs.length === 0
                ? 'No jobs found. Try a different role or location.'
                : 'No jobs match your filters. Try adjusting them.'}
            </div>
          )}

          {filteredJobs.map(job => {
            const workplaceColor =
              job.workplaceType?.toLowerCase().includes('remote') ? 'bg-green-50 text-green-700 border-green-200' :
              job.workplaceType?.toLowerCase().includes('hybrid') ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-slate-50 text-slate-500 border-slate-200';

            return (
              <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-colors space-y-4">

                {/* Top row: logo + title + actions */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Company logo */}
                    {job.companyLogo ? (
                      <img src={job.companyLogo} alt={job.company} className="w-10 h-10 rounded-lg object-contain border border-slate-100 shrink-0 bg-white" />
                    ) : (
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100">
                        <span className="text-xs font-bold text-blue-600">{job.company.slice(0, 2).toUpperCase()}</span>
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 leading-tight">{job.title}</h3>
                      {/* Company name + website */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {job.companyWebsite ? (
                          <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:underline">
                            {job.company}
                          </a>
                        ) : (
                          <span className="text-xs font-medium text-slate-700">{job.company}</span>
                        )}
                        {job.companyEmployeesCount && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-[11px] text-slate-400">{job.companyEmployeesCount.toLocaleString()} employees</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {tailoredIds.has(job.id) ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        Tailored ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => tailorForJob(job)}
                        disabled={tailoring === job.id}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                      >
                        {tailoring === job.id ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Tailoring...
                          </span>
                        ) : 'Tailor Resume'}
                      </button>
                    )}
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-400 hover:text-blue-600 transition-colors">
                      {job.linkedinUrl && job.linkedinUrl !== job.url ? 'Apply on site ↗' : 'Apply on LinkedIn ↗'}
                    </a>
                    {job.linkedinUrl && job.linkedinUrl !== job.url && (
                      <a href={job.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-400 hover:text-blue-600 transition-colors">
                        View on LinkedIn ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap gap-1.5">
                  {job.workplaceType && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${workplaceColor}`}>
                      {job.workplaceType}
                    </span>
                  )}
                  {job.employmentType && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                      {job.employmentType}
                    </span>
                  )}
                  {job.seniorityLevel && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                      {job.seniorityLevel}
                    </span>
                  )}
                  {job.industries && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                      {job.industries}
                    </span>
                  )}
                  {job.location && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                      📍 {job.location}
                    </span>
                  )}
                </div>

                {/* Meta row: salary, posted, applicants */}
                <div className="flex items-center gap-3 flex-wrap">
                  {job.salary && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {job.salary}
                    </span>
                  )}
                  {job.postedAt && (
                    <span className="text-[11px] text-slate-400">{daysAgo(job.postedAt)}</span>
                  )}
                  {job.applicantsCount && (
                    <span className="text-[11px] text-slate-400">{job.applicantsCount} applicants</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{job.description}</p>

                {/* Recruiter */}
                {job.recruiterName && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700">{job.recruiterName}</p>
                      {job.recruiterTitle && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{job.recruiterTitle}</p>
                      )}
                    </div>
                    {job.recruiterUrl && (
                      <a
                        href={job.recruiterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-3 py-1 rounded-lg transition-all shrink-0 ml-3"
                      >
                        Connect on LinkedIn ↗
                      </a>
                    )}
                  </div>
                )}

                {/* Debug */}
                {showDebug && (
                  <div className="flex flex-wrap gap-1.5 items-center pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {job.source}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Score: {job.skillScore}
                    </span>
                    {job.matchedSkills.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                        ✓ {s}
                      </span>
                    ))}
                    {job.matchedSkills.length === 0 && (
                      <span className="text-[10px] text-slate-400 italic">matched on role title only</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {tailoredIds.size > 0 && (
            <div className="flex justify-center pt-2">
              <Link
                href="/jobs"
                className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
              >
                View All Tailored Resumes ({tailoredIds.size}) →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
