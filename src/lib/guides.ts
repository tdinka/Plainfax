// Search landing pages ("how do I fax from my iPhone?" and so on). Each one has the
// send form at the top, so a visitor from Google can fax without leaving the page.
// Keep every claim true to how the app works: no HIPAA claims, US and Canada only.
import { APP_NAME, MAX_DOC_PAGES, PRICE_TIERS, formatPrice } from "./config";

export type Guide = {
  slug: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  title: string;
  intro: string;
  steps: string[];
  sections: { heading: string; body: string[] }[];
  faqs: [string, string][];
  linkText: string; // how other pages link to this one
};

const price = formatPrice(PRICE_TIERS[0].cents);

const photoTips = {
  heading: "Tips for clear pages from photos",
  body: [
    "Lay the page flat in good light, with no shadow from your hand or phone across it.",
    "Hold the phone straight above the page so all four corners are in the picture.",
    "Take one photo per page, in order. Each photo becomes one fax page.",
  ],
};

const deliveredFaq: [string, string] = [
  "How do I know it arrived?",
  "The status page updates live while the fax is sent. Once it's delivered, you can download a confirmation PDF with the fax number, page count and delivery time.",
];

const failedFaq: [string, string] = [
  "What if the fax doesn't go through?",
  "If the line is busy or doesn't answer, we redial automatically. If it still can't be delivered, your payment is refunded automatically.",
];

export const GUIDES: Guide[] = [
  {
    slug: "fax-from-iphone",
    metaTitle: `How to send a fax from your iPhone, no app needed | ${APP_NAME}`,
    description: `Send a fax from your iPhone in Safari. Photograph the pages or pick a PDF, enter the fax number, and pay ${price} once. No app, no subscription.`,
    eyebrow: "Fax from iPhone",
    title: "Send a fax from your iPhone, no app needed",
    intro: `You don't need a fax app or a weekly subscription. Open this page in Safari, photograph your pages or pick a PDF, and send it for ${price}.`,
    steps: [
      "Open faxjustonce.com in Safari or any browser on your iPhone.",
      "Tap Take a photo for each page, or Choose files to pick a PDF or photos.",
      "Enter the fax number, and add a free cover page if you want one.",
      `Pay ${price} by card and watch the fax go through.`,
    ],
    sections: [
      photoTips,
      {
        heading: "If a photo won't upload",
        body: [
          "iPhone saves photos in a format called HEIC. If you pick the photo from your Photos library, your iPhone turns it into a JPG for you. If you saved it to the Files app first, save it as a JPG and try again.",
        ],
      },
      {
        heading: "Why not a fax app?",
        body: [
          "Many fax apps start a subscription, often around $9.99 a week, that keeps charging until you cancel. If you only fax now and then, paying once per fax costs far less.",
        ],
      },
    ],
    faqs: [
      ["Do I need to download anything?", "No. It works in Safari, Chrome or any other browser on your iPhone."],
      deliveredFaq,
      failedFaq,
    ],
    linkText: "Fax from an iPhone",
  },
  {
    slug: "fax-from-android",
    metaTitle: `How to send a fax from your Android phone | ${APP_NAME}`,
    description: `Send a fax from an Android phone in Chrome. Photograph the pages or pick a PDF, enter the fax number, and pay ${price} once. No app, no subscription.`,
    eyebrow: "Fax from Android",
    title: "Send a fax from your Android phone",
    intro: `Skip the fax app. Open this page in Chrome, photograph your pages or pick a PDF, and send it for ${price}.`,
    steps: [
      "Open faxjustonce.com in Chrome or any browser on your phone.",
      "Tap Take a photo for each page, or Choose files to pick a PDF or photos.",
      "Enter the fax number, and add a free cover page if you want one.",
      `Pay ${price} by card and watch the fax go through.`,
    ],
    sections: [
      photoTips,
      {
        heading: "Why not a fax app?",
        body: [
          "Many fax apps start a subscription, often around $9.99 a week, that keeps charging until you cancel. If you only fax now and then, paying once per fax costs far less.",
        ],
      },
    ],
    faqs: [
      ["Do I need to download anything?", "No. It works in Chrome, Samsung Internet or any other browser."],
      deliveredFaq,
      failedFaq,
    ],
    linkText: "Fax from an Android phone",
  },
  {
    slug: "fax-without-fax-machine",
    metaTitle: `How to send a fax without a fax machine | ${APP_NAME}`,
    description: `No fax machine or phone line? Upload a PDF or photos, enter the fax number, and pay ${price} once. We send it over a real fax line and refund you if it can't be delivered.`,
    eyebrow: "No fax machine needed",
    title: "Send a fax without a fax machine",
    intro: `The office asking for a fax only sees a normal fax arrive. Upload your document here and we send it over a real fax line for ${price}.`,
    steps: [
      "Upload a PDF, or take photos of the pages with your phone.",
      "Enter the US or Canada fax number, and add a free cover page if you want one.",
      `Pay ${price} once.`,
      "Watch it go through, then download a delivery confirmation.",
    ],
    sections: [
      {
        heading: "When people still need to fax",
        body: [
          "Signed forms for a doctor's office, pharmacy or insurance company.",
          "Paperwork for a government office, court or school.",
          `Forms that say "return by fax". You can fax your own forms. ${APP_NAME} isn't set up for healthcare offices that need a HIPAA business associate agreement.`,
        ],
      },
      {
        heading: "Other ways to send a fax",
        body: [
          "Print and shipping stores can fax for you, but it means a trip and a per-page fee.",
          "Fax apps often need a subscription you have to remember to cancel.",
          "Sending it here takes about a minute, and you pay once for that fax.",
        ],
      },
    ],
    faqs: [
      ["Do I need a phone line or a scanner?", "No. We send the fax from our line. If you don't have a scanner, clear photos from your phone work: each photo becomes one page."],
      deliveredFaq,
      failedFaq,
    ],
    linkText: "Fax without a fax machine",
  },
  {
    slug: "fax-a-pdf-online",
    metaTitle: `Fax a PDF online, pay once | ${APP_NAME}`,
    description: `Fax a PDF online to any US or Canada number. Up to ${MAX_DOC_PAGES} pages, free cover page, delivery confirmation, and ${price} for up to 10 pages. No subscription.`,
    eyebrow: "Fax a PDF",
    title: "Fax a PDF online",
    intro: `Upload the PDF, enter the fax number and pay once. Up to ${MAX_DOC_PAGES} pages, with a free cover page.`,
    steps: [
      "Choose your PDF. You can add more PDFs or photos and they're sent together as one fax.",
      "Enter the US or Canada fax number, and add a free cover page if you want one.",
      "Preview exactly what will be sent, then pay once.",
      "Watch it go through, then download a delivery confirmation.",
    ],
    sections: [
      {
        heading: "Before you send",
        body: [
          "If the form needs a signature, sign it before you upload it.",
          `Files can be up to 20 MB in total and ${MAX_DOC_PAGES} pages.`,
          "The preview shows every page as it will print on the other end, so you can check it before paying.",
        ],
      },
      {
        heading: "What it costs",
        body: PRICE_TIERS.map(
          (t, i) => `${i === 0 ? 1 : PRICE_TIERS[i - 1].upTo + 1} to ${t.upTo} pages: ${formatPrice(t.cents)}. The cover page is free.`,
        ),
      },
    ],
    faqs: [
      ["Can I fax a Word or Google Docs file?", "Save it as a PDF first. In Word, Google Docs or Pages, use Download or Export and pick PDF."],
      deliveredFaq,
      failedFaq,
    ],
    linkText: "Fax a PDF online",
  },
  {
    slug: "fax-without-subscription",
    metaTitle: `Send one fax without a subscription | ${APP_NAME}`,
    description: `Need to send just one fax? Pay ${price} for that fax and nothing else. No account, no free trial that turns into a weekly charge, nothing to cancel.`,
    eyebrow: "One fax, no subscription",
    title: "Send one fax without a subscription",
    intro: `If you only fax now and then, a weekly or monthly plan is money wasted. Pay ${price} for this fax and that's it.`,
    steps: [
      "Upload a PDF, or take photos of the pages with your phone.",
      "Enter the US or Canada fax number.",
      `Pay ${price} once. There's no account to create.`,
      "Watch it go through, then download a delivery confirmation.",
    ],
    sections: [
      {
        heading: "Watch out for free trials",
        body: [
          "Many fax apps start with a free trial that turns into a weekly or monthly charge unless you cancel in time.",
          "Here there's no trial and nothing to cancel. You pay when you send a fax, and only then.",
        ],
      },
      {
        heading: "What's included in every fax",
        body: [
          "A free cover page, an automatic redial if the line is busy, a delivery confirmation PDF, and an automatic refund if the fax can't be delivered. No ads or branding are added to your fax.",
        ],
      },
    ],
    faqs: [
      ["Will you charge me again later?", "No. Each payment covers one fax. Nothing renews."],
      ["Do I need an account?", "No. You get a private link to check the status of your fax. Save it if you want to come back later."],
      failedFaq,
    ],
    linkText: "One fax, no subscription",
  },
  {
    slug: "fax-from-computer",
    metaTitle: `How to send a fax from your computer | ${APP_NAME}`,
    description: `Send a fax from a Mac or Windows computer in your browser. Drag in a PDF, enter the fax number, and pay ${price} once. No software, no fax line, no subscription.`,
    eyebrow: "Fax from a computer",
    title: "Send a fax from your computer",
    intro: `No fax software, modem or phone line needed. Drag your document into this page, enter the number, and send it for ${price}.`,
    steps: [
      "Drag a PDF onto the form, or click Choose files.",
      "Enter the US or Canada fax number, and add a free cover page if you want one.",
      "Preview exactly what will be sent, then pay once.",
      "Watch it go through, then download a delivery confirmation.",
    ],
    sections: [
      {
        heading: "Turning a document into a PDF",
        body: [
          "On a Mac: choose File, then Print, then PDF, then Save as PDF.",
          "On Windows: choose File, then Print, and pick Microsoft Print to PDF as the printer.",
          "In Word or Google Docs: use File, then Download or Export, and pick PDF.",
        ],
      },
      {
        heading: "Paper only?",
        body: [
          "If the document is on paper and you don't have a scanner, open this page on your phone and photograph each page instead. Each photo becomes one fax page.",
        ],
      },
    ],
    faqs: [
      ["Do I need to install anything?", "No. It works in Chrome, Safari, Edge or Firefox on any computer."],
      deliveredFaq,
      failedFaq,
    ],
    linkText: "Fax from a computer",
  },
  {
    slug: "fax-to-doctors-office",
    metaTitle: `How to fax a form to a doctor's office | ${APP_NAME}`,
    description: `Need to fax a signed form to a doctor's office, pharmacy or insurer? Upload it or photograph it, enter their fax number, and pay ${price} once. No fax machine needed.`,
    eyebrow: "Fax to a doctor's office",
    title: "Fax a form to your doctor's office",
    intro: `Doctors' offices, pharmacies and insurers still ask for forms by fax. Upload or photograph yours and send it for ${price}, with a delivery confirmation you can keep.`,
    steps: [
      "Fill in and sign the form, then upload it as a PDF or take a photo of each page.",
      "Enter the office's fax number, and add a free cover page with your name and date of birth if they ask for one.",
      `Pay ${price} once.`,
      "Download the delivery confirmation in case the office says it never arrived.",
    ],
    sections: [
      {
        heading: "Forms people often fax",
        body: [
          "Records release and authorization forms.",
          "New patient paperwork and consent forms.",
          "Forms a pharmacy or insurance company asks you to return by fax.",
        ],
      },
      {
        heading: "Before you send",
        body: [
          "Check the fax number with the office. A wrong digit sends your form to someone else, and a delivered fax can't be refunded.",
          "Use the cover page to say who the form is for and how to reach you.",
          `${APP_NAME} is for people faxing their own forms. It isn't set up for healthcare offices that need a HIPAA business associate agreement.`,
        ],
      },
    ],
    faqs: [
      [
        "What happens to my form after it's sent?",
        "It's deleted from our servers as soon as the fax is delivered or the attempt ends. The status page keeps only the fax number, page count and file names.",
      ],
      deliveredFaq,
      failedFaq,
    ],
    linkText: "Fax to a doctor's office",
  },
  {
    slug: "fax-a-photo",
    metaTitle: `How to fax a photo or picture of a document | ${APP_NAME}`,
    description: `Fax a photo of a document straight from your phone. Each photo becomes one fax page. JPG or PNG, US and Canada numbers, ${price} once, no subscription.`,
    eyebrow: "Fax a photo",
    title: "Fax a photo of a document",
    intro: `No scanner? Photograph each page with your phone and we fax the photos as pages, for ${price}.`,
    steps: [
      "Tap Take a photo for each page, or Choose files to pick JPG or PNG photos you already took.",
      "Enter the US or Canada fax number.",
      "Preview the pages to check every one is readable, then pay once.",
      "Watch it go through, then download a delivery confirmation.",
    ],
    sections: [
      photoTips,
      {
        heading: "What faxed photos look like",
        body: [
          "Fax machines print in black and white at a fairly low resolution. Typed and handwritten pages come through fine; color photos of people or places come out grainy, so fax documents, not snapshots.",
        ],
      },
      {
        heading: "If an iPhone photo won't upload",
        body: [
          "Pick the photo from your Photos library and your iPhone turns it into a JPG for you. If you saved it to the Files app first, save it as a JPG and try again.",
        ],
      },
    ],
    faqs: [
      ["Can I mix photos and PDFs?", "Yes. Add them in the order you want, and they're sent together as one fax."],
      deliveredFaq,
      failedFaq,
    ],
    linkText: "Fax a photo",
  },
];

export function getGuide(slug: string): Guide {
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) throw new Error(`No guide called ${slug}`);
  return guide;
}
