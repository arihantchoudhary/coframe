# Web — Petryk's Face

This is how you talk to Petryk. The web app is the primary interface for feeding data into the system and seeing what Petryk already knows.

Petryk is a hyperactive kid — restless, enthusiastic, always ready for more. The frontend reflects that energy: a fast, dark-themed interface where you can write data, upload files, browse everything that's been collected, and edit it all in place. No friction, no gatekeeping. Just send it.

## Pages

### `/` — Home
Petryk introduces himself. A landing page with his status (he's always online), what he can do, and quick links to start sending data.

### `/write` — Send Data
The main intake form. This is where data enters the system:
- **Message/notes** — free text for anything
- **Custom fields** — add as many key-value pairs as you need, no fixed schema
- **File attachments** — drag and drop images, video, audio, documents. They upload to S3 in the background with progress tracking.
- **Email** — required, so Petryk can confirm he got everything

Also doubles as an edit page — existing items can be loaded and updated.

### `/read` — Browse Data
Everything Petryk knows, laid out in expandable cards. Search, filter, preview files inline, edit any item, or delete it. This is Petryk's memory, browsable.

### `/upload` — Upload Files
A dedicated drag-and-drop zone for bulk file uploads. Progress bars, status badges, and a table of everything that's been uploaded with direct download links.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library (56 components)
- **React Hook Form** + **Zod** for validation
- **Lucide** icons

## Running Locally

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to point at a backend instance, or it defaults to the production App Runner URL.

## The Bigger Picture

A self-improving system is only as good as the data it can access. This frontend makes it dead simple for humans to pour information in — structured, unstructured, multimedia, whatever. The easier the intake, the richer the data. The richer the data, the smarter Petryk gets.

---

# Mobile — Petryk in Your Pocket

The React Native (Expo) app is a lighter interface for quick data pushes and lookups from your phone. Same backend, same Petryk — just portable.

- Push JSON data on the go
- Fetch items by ID
- iOS + Android via Expo

```bash
cd ../mobile
npm install
npx expo start
```
