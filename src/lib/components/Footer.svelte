<footer>
  <h2>Building products that <br />people care about</h2>
  <p>
    <span class="contact-line">I love designing products and the stories behind</span>
    <span class="contact-line">them. I’d love to connect on <a class="social" href="https://linkedin.com/in/samfcheng" target="_blank" rel="noopener noreferrer"><span class="social-pill linkedin">LinkedIn</span></a>, <a class="social" href="https://x.com/samfcheng" target="_blank" rel="noopener noreferrer"><span class="social-pill twitter">X (Twitter)</span></a>,</span>
    <span class="contact-line">or <a class="social" href="https://instagram.com/samssamples" target="_blank" rel="noopener noreferrer"><span class="social-pill instagram">Instagram</span></a>. If you’d like to reach out, you can also</span>
    <span class="contact-line">send me an email at <a class="social" href="mailto:sam@samfcheng.com"><span class="social-pill email">sam@samfcheng.com</span></a>.</span>
  </p>
</footer>

<style>
  footer{background:#fff;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;padding:88px var(--page-gutter) 96px;gap:64px}
  h2{font-weight:400;font-size:48px;line-height:1.22;letter-spacing:-.02em}
  p{font-weight:400;width:max-content;max-width:100%;font-size:16px;line-height:1.55;padding-top:18px}
  .contact-line{display:block;white-space:nowrap}
  /* The anchor stays still. Padding expands its hit area; negative margins
     preserve the existing paragraph spacing and intentional line breaks. */
  .social{display:inline-block;position:relative;padding:4px 3px;margin:-4px -3px;line-height:1.2;text-decoration:none;border-radius:999px;white-space:nowrap}
  .social-pill{display:inline-block;padding:1px 9px 2px;border-radius:999px;color:#fff;pointer-events:none;transform-origin:center;transition:transform 180ms var(--ease-out),opacity 180ms ease}
  .linkedin{background:#1400ff}.twitter{background:#000}.instagram{background:#ec3293}.email{background:#f3742b}
  .social:focus-visible{outline-offset:3px}
  @media(hover:hover) and (pointer:fine){.social:hover .social-pill{transform:scale(.95) rotate(-2deg);opacity:.85}}
  @media(prefers-reduced-motion:reduce){.social-pill{transition:opacity 180ms ease}.social:hover .social-pill{transform:none}}
  @media(max-width:600px){
    footer{padding:56px 24px 64px;gap:32px}
    h2{font-size:32px;line-height:1.2;max-width:100%;text-wrap:balance}
    h2 br{display:none}
    p{width:100%;padding-top:0}
    .contact-line{display:inline;white-space:normal}
  }
</style>
