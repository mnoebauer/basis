# Note

A cross-platform, offline-first note-taking application inspired by modern block-based editors. Built with React, Electron, and TipTap, it focuses on providing a clean, minimalist UI with a native macOS aesthetic.

## Features

- **Block-based Editor**: Powered by TipTap, offering a flexible and rich text editing experience similar to Notion.
- **Offline First**: All notes are stored locally as JSON, ensuring your data is always accessible without an internet connection.
- **Cross-Platform**: Built on Electron, running natively on macOS, Windows, and Linux.
- **Modern UI**: Styled with Tailwind CSS and Framer Motion for smooth animations and a premium look and feel.
- **Developer Experience**: Fast iteration with Vite and TypeScript.

## Tech Stack

- [React](https://react.dev/)
- [Electron](https://www.electronjs.org/)
- [TipTap](https://tiptap.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [pnpm](https://pnpm.io/)

## Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed along with `pnpm`.

```bash
npm install -g pnpm
```

## Getting Started

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/note.git
cd note
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Start the development server:**

This will start both the React frontend (via Vite) and the Electron app.

```bash
pnpm run dev
```

## Building for Production

To build the application for production, run:

```bash
pnpm run build
```

The compiled binaries will be available in the `release/` or `dist/` directory depending on your Electron Builder configuration.

## License

MIT License
