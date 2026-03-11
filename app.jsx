const { useState, useCallback, useRef } = React;

const REED_API_KEY = "5b56acde-52c1-452e-bbfc-7b9c780cddd5";

const RESUME = {
  name: "Devik Satya Venkat Balabhadruni",
  title: "Data Analyst | Python · SQL · Power BI | NLP & AI Automation",
  email: "deviksatya.work@gmail.com",
  phone: "+44 7707158299",
  location: "Leicester, GB",
  summary: `Data Analyst with an MSc in Data Science (Merit, Coventry University) and 1+ year of hands-on industry experience building AI chatbots, NLP pipelines, and Power BI dashboards that improved business efficiency by 15-30%. Reduced manual processing time by 40% at NLPBAY by deploying production-grade automation handling 100+ queries per session.`,
  experience: [
    {
      title: "Data Science Analyst", company: "NLPBAY", location: "Swindon, GB", period: "May 2024 – April 2025",
      bullets: [
        "Deployed 3 production AI chatbots using OpenAI GPT-3.5-Turbo and Zapier automations, eliminating ~8 hours/week of manual processing and reducing workflow time by 40%.",
        "Built and maintained end-to-end data pipelines (ingestion, transformation, modelling, evaluation) cutting reporting turnaround by 20%.",
        "Led integration testing and performance benchmarking across 100+ queries per session, reducing AI output inconsistencies by 30%.",
        "Translated stakeholder business requirements into automated data solutions, contributing to 15-30% improvement in operational efficiency."
      ]
    },
    {
      title: "Data Analyst Intern", company: "Innomatics Research Labs", location: "Hyderabad, IN", period: "Feb 2023 – May 2023",
      bullets: [
        "Performed EDA and data visualisation on 5+ real-world business datasets using Python (Pandas, Seaborn) and SQL.",
        "Delivered full data science pipelines across multiple projects, reducing data preparation time by ~25%.",
        "Finished top 1% out of 7,000+ participants in a national Machine Learning hackathon."
      ]
    }
  ],
  education: { degree: "MSc Data Science (Merit)", university: "Coventry University, GB", period: "Sep 2023 – Sep 2025" },
  skills: "Python, SQL, Power BI, Tableau, Excel, Machine Learning, NLP, OpenAI API, LangChain, ETL Pipelines, Statistical Analysis, Data Visualisation, Flask, Streamlit, AWS, Docker, Git",
  projects: [
    "Business Performance Reporting Dashboard (Power BI) – Reduced exec reporting time by 3hrs/week",
    "Marketing Campaign Dashboard (Excel) – 500+ campaigns, 6 KPIs, 15% ROI improvement",
    "Sentiment Analysis on 570K Amazon Reviews – NLP pipeline with scalable ML",
    "Conversational AI Tutor (Streamlit/GPT) – 85% response relevance"
  ],
  achievements: [
    "Top 1% of 7,000+ ML Hackathon participants (2023)",
    "CMI Level 7 Certificate in Strategic Management (Dec 2025)",
    "Power BI & Tableau Certifications (Simplilearn, Feb 2026)"
  ]
};

const KEYWORDS = ["junior data analyst", "entry level data analyst", "graduate data analyst", "junior BI analyst", "data analyst graduate", "junior business intelligence analyst"];

function scoreJob(job) {
  const text = ((job.jobTitle || "") + " " + (job.jobDescription || "")).toLowerCase();
  const kws = ["python", "sql", "power bi", "tableau", "data analyst", "nlp", "machine learning", "analytics", "excel", "bi analyst", "visuali"];
  return Math.min(kws.filter(k => text.includes(k)).length * 9 + 10, 99);
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function toCSV(jobs) {
  const headers = ["No", "Job Title", "Company", "Location", "Min Salary", "Max Salary", "Posted Date", "Job URL", "Match %", "Description"];
  const rows = jobs.map((j, i) => [
    i + 1,
    `"${(j.jobTitle || "").replace(/"/g, "'")}"`,
    `"${(j.employerName || "").replace(/"/g, "'")}"`,
    `"${(j.locationName || "").replace(/"/g, "'")}"`,
    j.minimumSalary || "",
    j.maximumSalary || "",
    `"${(j.jobUrl || `https://www.reed.co.uk/jobs/${j.jobId}`)}"`,
    `"${stripHtml(j.jobDescription).slice(0, 300).replace(/"/g, "'")}"`
  ].join(","));
  return [headers.join(","), ...rows].join("\n");
}

const STEPS = ["Search", "Results", "Resume"];

function App() {
  const [phase, setPhase] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [tailored, setTailored] = useState("");
  const [generating, setGenerating] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("anthropic_key") || "");
  const logRef = useRef(null);

  const handleApiKeyChange = (e) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem("anthropic_key", val);
  };

  const log = (msg) => {
    setLogs(p => [...p, { msg, time: new Date().toLocaleTimeString() }]);
    setTimeout(() => logRef.current?.scrollTo(0, 99999), 50);
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true); setLogs([]); setJobs([]); setProgress(0);
    const all = []; const seen = new Set();
    for (let i = 0; i < KEYWORDS.length; i++) {
      const kw = KEYWORDS[i];
      log(`Searching: "${kw}"…`);
      setProgress(Math.round((i / KEYWORDS.length) * 55));
      try {
        const r = await fetch(
          `/api/reed/search?keywords=${encodeURIComponent(kw)}&locationName=uk&resultsToTake=10`,
          { headers: { Authorization: "Basic " + btoa(REED_API_KEY + ":") } }
        );
        if (!r.ok) { log(`⚠ ${kw}: HTTP ${r.status}`); continue; }
        const d = await r.json();
        (d.results || []).forEach(j => { if (!seen.has(j.jobId)) { seen.add(j.jobId); all.push(j); } });
        log(`✓ ${d.results?.length || 0} results`);
      } catch (e) { log(`✗ ${e.message}`); }
    }
    log(`Fetching details for top ${Math.min(all.length, 25)} jobs…`);
    const top = all.slice(0, 25); const detailed = [];
    for (let i = 0; i < top.length; i++) {
      setProgress(55 + Math.round((i / top.length) * 40));
      try {
        const r = await fetch(`/api/reed/jobs/${top[i].jobId}`,
          { headers: { Authorization: "Basic " + btoa(REED_API_KEY + ":") } });
        detailed.push(r.ok ? { ...top[i], ...(await r.json()) } : top[i]);
      } catch { detailed.push(top[i]); }
    }
    detailed.sort((a, b) => scoreJob(b) - scoreJob(a));
    log(`✅ Complete! ${detailed.length} jobs ready.`);
    setJobs(detailed); setProgress(100); setLoading(false); setPhase(1);
  }, []);

  const tailorResume = async (job) => {
    setSelectedJob(job); setTailored(""); setGenerating(true); setPhase(2);
    const jd = stripHtml(job.jobDescription).slice(0, 800);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20240620", max_tokens: 1000,
          messages: [{
            role: "user", content: `Tailor this resume for the job below. Be specific and strategic.

JOB: ${job.jobTitle} at ${job.employerName}
JD: ${jd}

RESUME:
${RESUME.name} | ${RESUME.title}
Summary: ${RESUME.summary}
Skills: ${RESUME.skills}
Experience:
${RESUME.experience.map(e => `${e.title} @ ${e.company} (${e.period})\n${e.bullets.map(b => "- " + b).join("\n")}`).join("\n\n")}
Education: ${RESUME.education.degree}, ${RESUME.education.university}
Projects: ${RESUME.projects.join("; ")}
Achievements: ${RESUME.achievements.join("; ")}

Output a complete tailored resume with these sections:
WHY THIS ROLE (2 sentences fit statement)
PROFESSIONAL SUMMARY (rewritten for this job)
KEY SKILLS (reordered/highlighted for this JD)
EXPERIENCE (same roles, subtly reworded bullets to match JD keywords)
EDUCATION
PROJECTS
ACHIEVEMENTS
Keep all facts 100% accurate. Make it ATS-optimised.`
          }]
        })
      });
      const d = await r.json();
      setTailored(d.content?.find(b => b.type === "text")?.text || "Generation failed.");
    } catch (e) { setTailored("Error: " + e.message); }
    setGenerating(false);
  };

  const downloadCSV = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([toCSV(jobs)], { type: "text/csv" }));
    a.download = "Devik_Job_Matches_Reed.csv";
    a.click();
  };

  const downloadResume = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([tailored], { type: "text/plain" }));
    a.download = `Devik_Resume_${(selectedJob?.employerName || "Job").replace(/\s+/g, "_")}.txt`;
    a.click();
  };

  const scoreColor = (s) => s >= 70 ? "#22c55e" : s >= 45 ? "#f59e0b" : "#94a3b8";

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderBottom: "1px solid #1e293b", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.3px" }}>
            🎯 Reed Job Finder
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Devik Balabhadruni · Junior Data Analyst · UK</div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* API Key Input */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0f172a", padding: "6px 12px", borderRadius: 8, border: "1px solid #334155" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>🔑 Claude API Key:</span>
            <input 
              type="password" 
              value={apiKey} 
              onChange={handleApiKeyChange}
              placeholder="sk-ant-..." 
              style={{ background: "transparent", border: "none", color: "#f8fafc", fontSize: 12, width: 140, outline: "none" }}
            />
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                onClick={() => { if (i === 1 && jobs.length) setPhase(1); if (i === 2 && tailored) setPhase(2); if (i === 0) setPhase(0); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20,
                  background: phase === i ? "#3b82f6" : phase > i ? "#1d4ed8" : "#1e293b",
                  color: phase >= i ? "#fff" : "#475569", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: phase > i ? "#22c55e" : phase === i ? "#93c5fd" : "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                  {phase > i ? "✓" : i + 1}
                </span>
                {s}
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 20, height: 1, background: "#1e293b" }} />}
            </div>
          ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>

        {/* PHASE 0: Search */}
        {phase === 0 && (
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ background: "#1e293b", borderRadius: 16, padding: 32, border: "1px solid #334155" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#f8fafc" }}>Find Your Best Matches</h2>
              <p style={{ color: "#64748b", margin: "0 0 28px", fontSize: 14 }}>
                Searches Reed.co.uk across 6 keyword variations, deduplicates results, fetches full job details, and ranks by skills match.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
                {[["📍 Location", "UK Only"], ["🎓 Level", "Junior / Entry / Graduate"], ["🔢 Results", "Top 25 matches"], ["🧠 Ranked by", "Skills alignment"]].map(([l, v]) => (
                  <div key={l} style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px", border: "1px solid #1e293b" }}>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>Searching for:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {KEYWORDS.map(k => (
                    <span key={k} style={{ background: "#0f172a", border: "1px solid #1e3a5f", color: "#93c5fd", padding: "4px 10px", borderRadius: 6, fontSize: 11 }}>{k}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={fetchJobs}
                disabled={loading}
                style={{
                  width: "100%", padding: "15px", background: loading ? "#1e293b" : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  color: loading ? "#475569" : "#fff", border: loading ? "1px solid #334155" : "none",
                  borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.3px", transition: "all 0.2s"
                }}
              >
                {loading ? "⏳ Searching Reed.co.uk…" : "🚀 Find My Jobs"}
              </button>

              {loading && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Progress</span>
                    <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>{progress}%</span>
                  </div>
                  <div style={{ background: "#0f172a", borderRadius: 8, height: 6, overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(90deg, #3b82f6, #818cf8)", height: "100%", width: `${progress}%`, transition: "width 0.4s ease", borderRadius: 8 }} />
                  </div>
                  <div ref={logRef} style={{ marginTop: 16, background: "#0f172a", borderRadius: 8, padding: 12, maxHeight: 160, overflowY: "auto", border: "1px solid #1e293b" }}>
                    {logs.map((l, i) => (
                      <div key={i} style={{ fontSize: 11, color: l.msg.startsWith("✓") ? "#22c55e" : l.msg.startsWith("✗") ? "#f87171" : "#94a3b8", padding: "2px 0", display: "flex", gap: 8 }}>
                        <span style={{ color: "#334155", flexShrink: 0 }}>{l.time}</span>
                        <span>{l.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHASE 1: Results */}
        {phase === 1 && jobs.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, color: "#f8fafc" }}>
                  {jobs.length} Jobs Found
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Click "Tailor Resume" on any job to generate a customised CV</p>
              </div>
              <button
                onClick={downloadCSV}
                style={{ background: "#166534", border: "1px solid #16a34a", color: "#4ade80", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                📥 Download Excel (CSV)
              </button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {jobs.map((job, i) => {
                const score = scoreJob(job);
                return (
                  <div key={job.jobId} style={{ background: "#1e293b", borderRadius: 12, padding: "16px 20px", border: "1px solid #334155", display: "flex", alignItems: "center", gap: 16, transition: "border-color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#334155"}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#475569", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <a href={job.jobUrl || `https://www.reed.co.uk/jobs/${job.jobId}`} target="_blank" rel="noreferrer"
                          style={{ fontSize: 14, fontWeight: 700, color: "#93c5fd", textDecoration: "none" }}>
                          {job.jobTitle}
                        </a>
                        <span style={{ fontSize: 11, background: "#0f172a", border: `1px solid ${scoreColor(score)}`, color: scoreColor(score), padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                          {score}% match
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        <span style={{ color: "#94a3b8" }}>{job.employerName || "Company"}</span>
                        <span style={{ margin: "0 8px" }}>·</span>
                        <span>{job.locationName || "UK"}</span>
                        {(job.minimumSalary || job.maximumSalary) && <>
                          <span style={{ margin: "0 8px" }}>·</span>
                          <span style={{ color: "#4ade80" }}>
                            {job.minimumSalary ? `£${job.minimumSalary.toLocaleString()}` : ""}
                            {job.minimumSalary && job.maximumSalary ? " – " : ""}
                            {job.maximumSalary ? `£${job.maximumSalary.toLocaleString()}` : ""}
                          </span>
                        </>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <a href={job.jobUrl || `https://www.reed.co.uk/jobs/${job.jobId}`} target="_blank" rel="noreferrer"
                        style={{ background: "#0f172a", border: "1px solid #334155", color: "#94a3b8", padding: "7px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer", textDecoration: "none" }}>
                        View Job ↗
                      </a>
                      <button
                        onClick={() => tailorResume(job)}
                        style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        ✍️ Tailor Resume
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PHASE 2: Tailored Resume */}
        {phase === 2 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, color: "#f8fafc" }}>Tailored Resume</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  {selectedJob?.jobTitle} @ {selectedJob?.employerName}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setPhase(1)}
                  style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", padding: "9px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                  ← Back to Jobs
                </button>
                {tailored && (
                  <button onClick={downloadResume}
                    style={{ background: "linear-gradient(135deg, #0369a1, #0284c7)", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    📄 Download Resume
                  </button>
                )}
              </div>
            </div>

            {generating ? (
              <div style={{ background: "#1e293b", borderRadius: 16, padding: 60, textAlign: "center", border: "1px solid #334155" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✍️</div>
                <div style={{ fontSize: 16, color: "#93c5fd", fontWeight: 600, marginBottom: 8 }}>Tailoring your resume…</div>
                <div style={{ fontSize: 13, color: "#475569" }}>Analysing job description and matching your skills</div>
                <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", animation: `pulse ${0.8 + i * 0.2}s ease-in-out infinite alternate` }} />
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: "#1e293b", borderRadius: 12, padding: 24, border: "1px solid #334155" }}>
                  <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Job Details</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", marginBottom: 6 }}>{selectedJob?.jobTitle}</div>
                  <div style={{ fontSize: 13, color: "#93c5fd", marginBottom: 12 }}>{selectedJob?.employerName}</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, maxHeight: 200, overflowY: "auto" }}>
                    {stripHtml(selectedJob?.jobDescription).slice(0, 500)}…
                  </div>
                  <a href={selectedJob?.jobUrl || `https://www.reed.co.uk/jobs/${selectedJob?.jobId}`} target="_blank" rel="noreferrer"
                    style={{ display: "inline-block", marginTop: 16, background: "#0f172a", border: "1px solid #1e3a5f", color: "#93c5fd", padding: "8px 16px", borderRadius: 8, fontSize: 12, textDecoration: "none" }}>
                    Apply on Reed ↗
                  </a>
                </div>
                <div style={{ background: "#0f172a", borderRadius: 12, padding: 24, border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Your Tailored Resume</div>
                  <pre style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, maxHeight: 480, overflowY: "auto" }}>
                    {tailored}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { from { opacity: 0.3; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }
      `}</style>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
