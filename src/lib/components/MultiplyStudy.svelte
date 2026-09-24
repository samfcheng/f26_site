<script>
  import CaseStudyFigure from './CaseStudyFigure.svelte';
  const assets = '/work/multiply/case-study';
</script>

<article aria-label="Multiply case study">
  <div class="intro copy">
    <p class="lead">Helping loan officers know what to do next.</p>
    <p>Over the summer, I redesigned Multiply’s internal command center and CRM, working on the tools our loan officers used to manage loans and stay in touch with borrowers. I wanted someone logging in to know what needed their attention and how to get it done.</p>
    <h3>A main project, and a little bit of everything</h3>
    <p>I owned the product design for the CRM and command center. Our PM helped set direction, engineering built the designs, and the other designer gave feedback while focusing primarily on our rebrand and marketing work. I worked within an existing design system, but had room to establish new interactions and navigation patterns.</p>
    <p>I really enjoyed having one project I could go deep on while also working on whatever came up along the way. If a loan officer got stuck, something needed fixing, or product wanted to add a feature, I got to jump in.</p>
    <nav class="contents" aria-label="In this case study">
      <a href="#command-center">01 Command center <span aria-hidden="true">↗</span></a>
      <a href="#crm">02 CRM <span aria-hidden="true">↗</span></a>
      <a href="#emails">03 Emails <span aria-hidden="true">↗</span></a>
      <a href="#reflections">04 Reflections <span aria-hidden="true">↗</span></a>
    </nav>
  </div>

  <section id="command-center" aria-labelledby="command-center-title">
    <div class="copy">
      <h2 id="command-center-title"><span class="section-number" aria-hidden="true">01<span class="rule"></span></span>A command center<br />that grew up</h2>
      <p>The command center had grown organically. New tools kept getting added, but the navigation was still built around one or two use cases. Each tool had its own layout, and the experience felt fragmented.</p>
      <p>There wasn’t really a dashboard yet—just a starting point with links to different tools. As the product grew, helping loan officers find a feature was only part of the problem. We also needed to help them figure out what to do when they got there.</p>
    </div>
    <div class="visual narrow-visual">
      <CaseStudyFigure src={`${assets}/dashboard-before.webp`} width={2400} height={2392} alt="Original command center with a welcome message and a short list of tools, including rate quotes and loan applications." label="Before · a list of tools" caption="The original starting point asked loan officers what they wanted to do, but offered little context about what needed attention." />
    </div>
    <div class="copy">
      <h3>Understanding how people actually worked</h3>
      <p>I watched dozens of session replays, looked at usage metrics, and talked individually with loan officers. I first met with them to understand the problems they were running into, then came back with variations and potential directions.</p>
      <p>This was especially useful because what a loan officer wanted to do wasn’t always the same as what product wanted to encourage. I had to understand both: make the tool useful in their day-to-day work, while helping drive outcomes like more consistent borrower outreach.</p>
      <h3>Finding a structure the product could grow into</h3>
      <p>I explored top navigation, sidebars, and combinations of the two. A lot of the work was figuring out a layout and framework that could bring the tools together and still give us room to move things around as the product changed.</p>
      <p>I landed on a mix of top navigation and a sidebar. The sidebar gave the different tools a consistent home, so moving between prospects, applications, and loans felt like working within one product.</p>
    </div>
    <div class="visual">
      <CaseStudyFigure src={`${assets}/navigation-explorations.webp`} width={2400} height={1773} alt="Nine navigation explorations comparing top navigation, sidebars, and combinations around a loan management screen." label="Exploration · bringing the tools together" caption="Different approaches to navigation, explored around the same loan management workflow. Select any screenshot in this case study to view it at full size." />
    </div>
    <div class="copy">
      <h3>From a starting page to a plan for the day</h3>
      <p>The dashboard became a place to see actionable tasks, borrowers who needed attention, and the status of active loans. Each section connected to the relevant tool or next action.</p>
      <p>Working with product and the loan officers helped determine what belonged here. One example was surfacing a borrower who hadn’t been contacted in the past week. That gave the officer a reason to reach out and helped keep people from falling through the cracks.</p>
    </div>
    <div class="visual dashboard-pair">
      <CaseStudyFigure src={`${assets}/dashboard-after.webp`} width={2400} height={3292} alt="Redesigned desktop dashboard with sidebar navigation, actionable tasks, people needing outreach, loan counts, and recent activity." label="After · a clearer next step" caption="Tasks, outreach, and loan status give the day a starting point." />
      <CaseStudyFigure src={`${assets}/mobile-dashboard.webp`} width={720} height={1560} alt="Mobile dashboard showing tools and actionable tasks above bottom navigation." label="On mobile" caption="The mobile layout brings tools and tasks into a narrower view." />
    </div>
    <div class="visual">
      <CaseStudyFigure placeholder="Dashboard explorations: add the Figma variations that led to this layout." caption="Show what changed between the early dashboard directions and the final design." />
    </div>
    <div class="copy">
      <h3>Shipping, listening, and going back in</h3>
      <p>I presented the redesign at Integral, our weekly company-wide all hands, and kept iterating after feedback. One small change was adding names on hover to the collapsed sidebar. With the sidebar open, the labels were obvious; when it collapsed, the icons had to do all the work. The hover labels made it possible to check what each icon meant.</p>
      <p>The entire dashboard and navigation redesign shipped, and I had time to keep refining it. Getting to see the work used—and then improve it—was one of the most valuable parts of the summer.</p>
    </div>
    <div class="visual pair">
      <CaseStudyFigure src={`${assets}/prospects.webp`} width={2400} height={1769} alt="Prospect list in the command center with the shared sidebar visible." label="One navigation across tools" caption="The shared sidebar carries through to the prospect list." />
      <CaseStudyFigure src={`${assets}/loan-pipeline.webp`} width={2400} height={1769} alt="Loan processing board with loans grouped by stage alongside the shared sidebar." label="Loan pipeline" caption="The same structure supports a different workflow and layout." />
    </div>
    <div class="visual">
      <CaseStudyFigure placeholder="A short recording or close-up of the collapsed sidebar with a hover label visible." caption="Capture the interaction added after feedback, rather than just the collapsed state." />
    </div>
  </section>

  <section id="crm" aria-labelledby="crm-title">
    <div class="copy">
      <h2 id="crm-title"><span class="section-number" aria-hidden="true">02<span class="rule"></span></span>A shared picture<br />of each borrower</h2>
      <p>Multiply already had a basic CRM, but it was fragmented and difficult to use. Notes and marketing emails were there, while conversations between loan officers and borrowers lived in individual inboxes. Usage data also showed gaps: activity wasn’t being logged, and many borrower records had little activity.</p>
      <p>This mattered because one borrower could be supported by a team of loan officers, and branch managers sometimes needed to check in too. An individual inbox couldn’t give everyone the same picture of what was happening.</p>
      <h3>Bringing the conversation into the CRM</h3>
      <p>I redesigned the activity log and cleaned up the surrounding experience, bringing loan officer and borrower emails alongside notes and marketing emails. The goal was to give the team one place to understand the relationship and pick up where someone else left off.</p>
    </div>
    <div class="visual pair">
      <CaseStudyFigure src={`${assets}/crm-before.webp`} width={2400} height={1720} alt="Original CRM activity modal with notes, contact outcomes, and save buttons." label="Before · the existing activity log" caption="The original CRM provided a basic place to record contact and notes." />
      <CaseStudyFigure src={`${assets}/crm-after.webp`} width={2400} height={2358} alt="Redesigned borrower record with an activity timeline, a note composer, and user information alongside it." label="After · more context in one place" caption="A fuller activity history sits alongside borrower information and a place to add a new entry." />
    </div>
    <div class="visual dashboard-pair">
      <CaseStudyFigure src={`${assets}/activity-log.webp`} width={2400} height={2844} alt="Loan activity log showing notes, borrower emails, marketing emails, and other events in a timeline." label="Within a loan" caption="The activity log brings different types of communication into one history." />
      <CaseStudyFigure src={`${assets}/mobile-activity-log.webp`} width={720} height={1624} alt="Mobile activity log with borrower emails and notes arranged chronologically." label="On mobile" caption="The same history, adapted to a smaller screen." />
    </div>
    <div class="copy">
      <div class="outcome">
        <p class="metric">4×</p>
        <h3>More contacts with leads</h3>
        <p>One of the results I’m most proud of was seeing four times as many contacts with leads following the dashboard, navigation, and CRM improvements. The changes made it easier for loan officers to see who needed attention and work through their outreach.</p>
        <div class="contact-rate"><span>Under 70% <span aria-hidden="true">→</span> ~95%</span><p>Contacted by a loan officer within 24 hours of signing up or asking a question.</p></div>
        <p class="measurement-note">Comparing the week before the redesign with the two weeks after. Contact volume counts loan officers contacting leads; the 24-hour rate measures how promptly leads received a response.</p>
      </div>
      <p>Just as meaningful was hearing directly from the people using it. Paul, one of our loan officers, described how the redesign helped the team manage its pipeline and stay on top of outreach.</p>
      <blockquote>
        <p>“This redesign made navigation extremely smooth, allowing our sales team to manage its pipeline and really dial-in our client outreach cadence and tracking.”</p>
        <footer>Paul Gresh <span>Loan officer, Multiply</span></footer>
      </blockquote>
    </div>
  </section>

  <section id="emails" aria-labelledby="emails-title">
    <div class="copy">
      <h2 id="emails-title"><span class="section-number" aria-hidden="true">03<span class="rule"></span></span>A detour into emails</h2>
      <p>While working on the product, I took a short break to redesign our emails. We were switching to a more modern email platform during the rebrand, which meant rebuilding emails, workflows, and customer journeys.</p>
      <p>I owned the email redesign and came up with several new designs. Then we had another problem: there were dozens of individual emails to implement in code.</p>
      <h3>Making the next email easier to build</h3>
      <p>I worked with the marketing team to develop reusable email components and implemented them in code. Then I created a custom Claude skill with instructions for our design system, the components, and how to use them together.</p>
      <p>The marketing team could use a simple prompt or a screenshot of a design to create a new email. That gave them a way to keep building with the system after the initial redesign.</p>
    </div>
    <div class="visual pair">
      <CaseStudyFigure src={`${assets}/email-before.webp`} width={963} height={1641} alt="Earlier Multiply Mortgage email with a logo header, a text introduction to refinancing, a call-to-action button, and an adviser signature." label="Before · reference to confirm" caption="An earlier email from the supplied screenshots. Confirm this is the right baseline for the redesign." />
      <CaseStudyFigure label="After" placeholder="The matching redesigned email, ideally with the same content so the changes are easy to compare." />
    </div>
    <div class="visual">
      <CaseStudyFigure placeholder="The email workflow: a prompt or design reference, reusable components, and the resulting email." caption="Add a real example of how the marketing team used the Claude skill." />
    </div>
    <div class="copy">
      <blockquote>
        <p>“Sam built a custom Claude skill that cut the project timeline from several months down to just a few weeks.”</p>
        <footer>Madison <span>Marketing, Multiply</span></footer>
      </blockquote>
    </div>
  </section>

  <section id="reflections" aria-labelledby="reflections-title">
    <div class="copy">
      <h2 id="reflections-title"><span class="section-number" aria-hidden="true">04<span class="rule"></span></span>What I’m taking<br />with me</h2>
      <h3>Designing with the people using it</h3>
      <p>Being able to talk directly with loan officers, watch how they worked, and come back with something new made the process feel immediate. I got to move quickly, but also go deep. Almost everything I worked on shipped, and hearing that people loved the new experience meant a lot to me.</p>
      <h3>Learning to hand off, and stay involved</h3>
      <p>This was my first time working with a full engineering team instead of developing my own designs. I learned to communicate through more detailed Figma wireframes and prototypes, and to think through the states and interactions someone else would need to build.</p>
      <p>Having experience building products helped a lot: I could speak the engineers’ language and jump into the codebase during QA to help get the details right. Handoff became another part of the collaboration.</p>
      <h3>New doesn’t always mean most important</h3>
      <p>One lesson that stuck with me was recency bias in design. When we’re working on a new feature, it’s easy to want to make it the most visible thing in the product. But stepping back and looking at the whole experience, that isn’t always the right decision. Designing the command center made me think more carefully about where a feature belongs in someone’s actual workflow.</p>
      <p class="closing">I came away really enjoying this kind of work: owning something substantial, staying close to the people using it, and getting to help with the smaller things that make the whole product better.</p>
    </div>
  </section>
</article>

<style>
  article{padding:44px 0 112px;font-weight:400}
  .copy{width:560px;max-width:calc(100% - 64px);margin-inline:auto}
  p{font-size:16px;line-height:1.6;font-weight:400;text-wrap:pretty}
  .copy>p+p{margin-top:20px}
  .lead{font-size:30px;line-height:1.25;letter-spacing:-.025em;margin-bottom:24px}
  h3{font-size:18px;font-weight:500;line-height:1.4;margin:32px 0 12px}
  .contents{display:grid;grid-template-columns:1fr 1fr;gap:0 28px;border-top:1px solid #dcd9e2;margin-top:36px}
  .contents a{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;padding:16px 0;border-bottom:1px solid #dcd9e2}
  .contents a:hover{text-decoration:underline;text-underline-offset:4px}
  .contents span{color:#776c8d}
  section{margin-top:112px;scroll-margin-top:40px}
  h2{position:relative;font-size:48px;font-weight:400;line-height:1.12;letter-spacing:-.03em;margin-bottom:32px}
  .section-number{position:absolute;right:calc(100% + 16px);top:0;display:flex;align-items:center;gap:16px;white-space:nowrap}
  .rule{width:64px;height:1px;background:currentColor}
  .visual{width:1000px;max-width:calc(100% - 64px);margin:44px auto}
  .narrow-visual{width:720px}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
  .dashboard-pair{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,1fr);gap:32px;align-items:start}
  .outcome{padding:32px;background:#eeebf8;border-radius:8px;margin-top:44px;margin-bottom:28px}
  .metric{font-size:80px;line-height:1;letter-spacing:-.06em}
  .outcome h3{margin:14px 0}
  .contact-rate{border-top:1px solid #d0c9df;margin-top:24px;padding-top:24px}
  .contact-rate>span{font-size:32px;line-height:1.2;letter-spacing:-.035em}
  .contact-rate p{font-size:14px;margin-top:8px}
  .measurement-note{font-size:13px;line-height:1.5;color:#685678;margin-top:24px}
  blockquote{margin:36px 0 0;padding:0 0 0 24px;border-left:2px solid #b3a2d3}
  blockquote p{font-size:23px;line-height:1.45;letter-spacing:-.015em}
  blockquote footer{font-size:14px;font-weight:500;margin-top:20px}
  blockquote footer span{display:block;color:#62606a;font-weight:400;margin-top:4px}
  .closing{padding-top:28px;border-top:1px solid #dcd9e2;margin-top:32px!important}
  @media(max-width:900px){
    .section-number{position:static;font-size:15px;margin-bottom:16px;gap:12px}
    .rule{width:36px}
    .dashboard-pair{gap:24px}
  }
  @media(max-width:600px){
    article{padding-top:32px;padding-bottom:72px}
    section{margin-top:72px}
    h2{font-size:38px}
    .lead{font-size:27px}
    .visual{margin-block:32px;max-width:calc(100% - 32px)}
    .pair,.dashboard-pair{grid-template-columns:1fr;gap:28px}
    .dashboard-pair :global(figure:last-child){width:240px;max-width:100%;justify-self:center}
    .contents{grid-template-columns:1fr}
    .outcome{padding:24px}
    blockquote p{font-size:21px}
  }
</style>
