# InvoiceGen — Free Invoice Generator

A free, client-side invoice generator. Create professional invoices in seconds:
add your business details, line items, tax and discount, then download as PDF.
No signup, no backend — your data never leaves the browser.

**Live:** https://invoicegen.pages.dev/

## Features

- Business / client profiles (saved in browser localStorage)
- Line items with quantity × rate, live totals
- Tax % and flat discount
- Currencies: INR, USD, EUR, GBP
- Download as PDF (client-side) or print
- Auto invoice numbering, issue/due dates

## Deploy

Static site — drop it on Cloudflare Pages, GitHub Pages, Netlify or Vercel as-is.
No build step. Connect the repo and deploy.

## Stack

Vanilla HTML/CSS/JS + [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) via CDN.
