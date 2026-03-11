# 🎯 Reed Job Finder

A powerful, modern job search and resume tailoring tool designed specifically for Data Analysts in the UK. This application fetches the latest job postings from Reed.co.uk and uses AI (Claude 3.5 Sonnet) to tailor your resume for each specific role.

## ✨ Features

- **Automated Job Search:** Searches Reed across multiple keyword variations for "Junior Data Analyst" roles.
- **Smart Scoring:** Ranks jobs based on alignment with your core technical skills (Python, SQL, Power BI, etc.).
- **AI Resume Tailoring:** Generates a complete, ATS-optimized resume tailored to any job description using the Claude API.
- **One-Click Export:** Download your job matches as a CSV or your tailored resumes as text files.
- **Modern UI:** A sleek, responsive dashboard with glassmorphism and real-time progress tracking.

## 🚀 Getting Started

### Prerequisites

- **Python 3.x** (for the backend proxy and local server)
- **Anthropic API Key** (to use the Claude resume tailoring feature)

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/Devikkkk/job-finder.git
   cd job-finder
   ```

2. Start the backend proxy server:
   ```bash
   python proxy_server.py
   ```
   *The proxy is required to bypass CORS restrictions for the Reed API and to handle authentication securely.*

3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## 🛠️ Configuration

To use the **Tailor Resume** feature, you will need to enter your Anthropic API key in the input field located in the top-right corner of the dashboard. Your key is stored securely in your browser's `localStorage` and never leaves your machine except to reach the official Anthropic API.

## 🔒 Security

All API keys are handled with care:
- The **Reed API Key** is managed strictly on the server-side via `proxy_server.py`.
- The **Anthropic API Key** is input through the UI and handled by the browser directly.

## 👤 Author

**Devik Balabhadruni**
*Junior Data Analyst | Python · SQL · Power BI*
