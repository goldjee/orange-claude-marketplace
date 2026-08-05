---
name: hr-job-posting-analysis
description: "Researches a job posting and judges it as an opportunity: company background, employee reviews, why the role exists, green and red flags, and CV fit. Use when someone shares a job description or a posting link and wants to know what the role really is, whether the company is worth joining, or whether to apply."
argument-hint: [company] [job description or link]
---

# Job Posting Analysis

Job descriptions get written to attract applicants and satisfy HR, so they bury the point of a role under stock phrasing: "dynamic team player," "wear many hats," a wall of bulleted responsibilities. Dig the point back out, then judge the role as an opportunity. Connect it to the company's situation so the reader sees why someone gets paid to do this, and whether they want to be that someone.

## Inputs

- **Company name.** May be ambiguous or missing; see step 1.
- **Job description.** The posting text, thorough or sparse. Work with whatever you get. Ask for it rather than guessing when it's missing. If you get a link instead of text, open it first.
- **CV** (optional). A file the user points you at, an attachment, or background they already gave in conversation. Never ask for one. Without it, drop the CV fit section rather than guessing at their experience.

## Process

### 1. Pin down the company, then research it

The name may be ambiguous (a common word, several companies sharing it), hidden behind a recruiting agency, or absent because a recruiter anonymised it. Pin it down from clues in the posting before you search.

Research before you write anything. One to three searches usually covers it: start with the company name plus a distinguishing term from the posting, then search any product, team, or market it names. Look for:

- What the company sells and to whom (B2B or B2C, the product or service itself)
- Its industry and where it sits within it
- Stage and scale (startup or enterprise, growth phase, recent funding, layoffs, expansion, a pivot), which shape what a role is for
- Recent developments that change how you read the role (a new product line, a new market, a reorg)

**When the company is hidden or unfindable.** Don't fabricate a name or facts. Identify the category from the posting ("frontline workforce SaaS," "mid-market logistics"), research that market instead, and tell the reader the employer wasn't named. A grounded read of the posting and its market beats invented specifics.

### 2. Find employee reviews

Look for reviews on Glassdoor, Indeed, or similar. Get two perspectives: how people rate the company overall, and what they say about this position.

These sites block most automated access, so expect to work from search results rather than the pages themselves. When they give you nothing, or the company is too small or private to have reviews, say "no reviews found" and move on. Never infer a rating from size, funding, or marketing copy. An invented score reads exactly like a researched one, which is what makes it dangerous.

### 3. Interpret the role against that context

Read the posting for what it reveals about intent, not the task list:

- Why does this role exist now, at this company? (Filling a gap? Building something new? Scaling something that works? Cleaning up a mess?)
- What is the person on the hook to move: revenue, users, reliability, a launch, a process, risk?
- What does doing the job well look like a year in?
- Who do they serve and depend on (customers, a specific team, leadership)?

The company context makes the read specific. A "Growth Analyst" at an early-stage consumer app chases acquisition and retention in a fight to survive; the same title at a mature enterprise-software firm tunes an established funnel. The words match, the purpose differs, and only the research tells you which.

### 4. Judge the role: green flags and red flags

Green flags mark what makes it strong: real decision rights and ownership, proximity to customers and leadership, genuine seniority and influence, money or momentum behind it (funding, dedicated headcount, a growing market), outcome-based success measures, room to grow. Red flags mark risk: feature-factory or bespoke client-delivery work dressed up as product, unclear ownership ("co-own," "influence without authority" with no real mandate), an under-resourced function you'd prop up alone, vague or missing success metrics, scope stretched across too many areas for one person, culture cues hinting at churn or thin management ("everyone must drive," "fast-paced, high-visibility").

Follow these rules, or the flags become noise:

- **Anchor every flag to evidence.** Point to the posting phrase or the research fact behind it. Cut any flag that would fit any job.
- **Don't pad to a quota.** If a role has one red flag, list one; if the posting looks clean, say so. Inventing flags to balance the lists misleads the reader.
- **Read double-edged signals honestly.** A young product function is room to shape and possible chaos with no support. Name the tension rather than pretending it cuts one way.
- **Turn red flags into questions.** Most risks are things to confirm, not deal-breakers. Phrase them to raise in an interview ("Ask who has final say on the roadmap").
- **Weight to stated priorities.** If the user has said what they want or fear (mentorship, ownership, not wanting to be an outsourced consultant), judge through that lens and call out the flags that bear on it.
- **Never make CV fitness a flag.** Flags describe the role. A gap between the user's experience and the posting belongs in the CV fit section and nowhere else, or a mediocre role starts looking good because they happen to match it.

### 5. Assess CV fit

Skip this when you have nothing about the user's background. Otherwise compare it to the posting on four points:

- **Seniority.** Does the scope they have run match the scope the role carries? Two levels under is a different conversation from one.
- **Domain.** Have they worked this industry, this business model, this customer? Adjacent counts, and say how adjacent.
- **Named requirements.** Check each skill the posting calls required against evidence in the CV. A required item the CV never touches outweighs a nice-to-have it covers well.
- **The gap they'd have to argue past.** Name the one thing a hiring manager would push on, and what in the CV answers it.

State the gap plainly. A fit assessment that flatters the user costs them an interview they weren't going to get, and hides the story they needed to prepare.

### 6. Write it up

```markdown
# Company name

[1-3 sentence "about this company" paragraph]

**Domain:** [what the company does]

**Market:** [B2B, B2C, etc.]

**Company rating:** [1-5]

## The Job

[3-5 sentences on why the job exists and what the hire has to achieve]

**Job rating:** [1-5, plus 1-2 sentences of explanation]

**Green flags**
- [one line, anchored to a posting phrase or research fact]
- ...

**Red flags**
- [one line, anchored; phrased as a question to ask where it fits]
- ...

## CV fit

**Rating:** [1-5, plus 1-2 sentences naming the strongest match and the gap]
```

Drop the CV fit section when you have no CV. Anchor the ratings, or the numbers mean nothing:

- **Company rating.** 1: reviews describe real trouble, or the research turns up layoffs, churn, or a declining business. 3: an ordinary employer, nothing alarming and nothing notable. 5: consistent positive reviews and a healthy trajectory. Write "not rated" when you found no reviews and too little else to judge; a guess dressed as a score is worse than an admission.
- **Job rating.** 1: the flags say the role is a trap, badly scoped or set up to fail. 3: a normal job, some upside and some risk. 5: real ownership, resources behind it, a clear path to doing something that matters.
- **CV fit.** 1: wrong level or wrong field. 3: plausible with a good cover letter, some required skills missing. 5: the CV already tells the story the posting asks for.

Keep the purpose paragraph to 3-5 sentences and each flag to one line. If a flag list has nothing real in it, write one line saying so rather than padding. Skip day-to-day task breakdowns and interview scripts unless asked.

## Style

- **Interpret, don't echo.** Cut any sentence you could have pasted from the posting. Every sentence should add something the posting didn't already give the reader.
- **Stay specific.** Name the product, market, or situation. Drop filler that fits any job ("plays a key role in driving success").
- **Stay grounded.** Reasonable inference is fine ("likely reports into sales leadership"); invented metrics, team sizes, and strategy are not.
- **Write plainly.** No hype, no hedging clichés, no em dashes. Explain the role the way you would to a smart friend deciding whether to apply.
