# Abyssal Website Theme

This file documents the visual language for Abyssal so new sections feel like parts of the same website.

## Brand header

- Put a small circular accent dot at the upper left, followed by the word **Abyssal**.
- Keep the brand mark calm and minimal. The dot is a recognizable piece of the identity, not a large logo.
- Place a short, rotating quote at the upper right. The displayed quote must be chosen only from the approved list in `quotes.md`.
- Do not maintain a second independent quote list in this document. Edit `quotes.md` to manage approved quotes.
- Allow the quote to wrap neatly on narrow screens without colliding with the brand.

## Section bar

- Place a slim horizontal bar directly beneath the brand header.
- The bar can change for each section while the underlying layout stays consistent.
- The Pride section uses a rainbow gradient as a nod to the Pride flag.
- Choose colors that suit the meaning of each future section, while keeping the bar restrained rather than turning it into a large banner.

## Core visual style

- Background: near-black (`#050505` or black).
- Main text: soft white (`#f7f7f7`).
- Secondary text: muted gray (`#aaa`).
- Primary interaction accent: fluorescent teal (`#00ffc8`).
- Use thin gray borders, understated panels, rounded corners, and generous spacing.
- Keep the experience minimal, calm, and readable. Avoid unnecessary decoration.
- Use the same system font stack as the Pride page unless a specific section has a good reason not to.

## Layout and interaction

- Design mobile-first, then expand content comfortably for wider screens.
- Keep headings clear, forms easy to tap, and text readable against the dark background.
- Give keyboard-focused controls a visible teal outline.
- Respect `prefers-reduced-motion`; do not make essential information depend on animation.
- Section-specific accents may change, but contrast, spacing, and accessibility should remain consistent.

## Quote behavior

- The top-right header text is a randomly selected quote from `quotes.md`, not an unrestricted random quote generator.
- Only explicitly approved entries in `quotes.md` may be displayed.
- The quote list is loaded from that Markdown file so edits to the approved list can update the website without editing the visual theme.
- Keep a small in-code fallback list so the header still works if the Markdown file cannot be fetched.

## Reusable website template

- The reusable component showcase lives at `template/index.html` and is available from the site at `/template/`.
- Use it as a starting point for new pages. It shows the shared header, section bar, placeholder title and body text, notice box, cards, form field, three button styles, tags, output panel, and footer.
- The template keeps its HTML, CSS, and JavaScript in clearly labeled sections so page content, visual style, and behavior are easy to find.
- Its first CSS block contains theme variables for background, text, accent color, section bar, borders, card corners, button corners, and content width.
- The optional on-page preview controls change the accent color and section bar live. Those controls are a template aid and may be removed from a new page.
- Button examples display their demo behavior in the JavaScript section. Replace the handler or its `data-message` text when adapting a button to a real task.

## Reusing the theme

When adding or redesigning a section, preserve the brand dot, Abyssal wordmark, slim section bar, and rotating quote placement. Change the section bar’s colors to suit the section, but keep the overall black, white, gray, and teal visual language.
