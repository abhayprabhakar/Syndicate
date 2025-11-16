# TrackShift Frontend - Production Build

## Overview
React + TypeScript frontend for the TrackShift Visual Intelligence Engine. Features F1-themed UI with real-time analysis visualization, PDF report downloads, and comprehensive vehicle inspection workflows.

## Features
- 🎨 **F1 Theme**: Professional racing aesthetics with red/black/white palette
- 📊 **Live Analysis**: Real-time change detection visualization
- 📄 **PDF Reports**: One-click download of detailed analysis reports
- 🖼️ **Image Comparison**: Side-by-side before/after with annotations
- ⚡ **Fast Performance**: Optimized React components with Vite
- 📱 **Responsive**: Works across desktop and tablet devices

## Tech Stack
- **React 18** + **TypeScript**
- **Vite** - Fast build tooling
- **TailwindCSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon system
- **Sonner** - Toast notifications

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
cd frontend2
npm install
```

### Running Development Server
```bash
npm run dev
```

Open http://localhost:5173

### Building for Production
```bash
npm run build
```

Build output in `dist/`

### Preview Production Build
```bash
npm run preview
```

## Configuration

Update API endpoint in `src/services/api.ts`:
```typescript
const API_BASE_URL = 'https://your-api-domain.com';
```

## Project Structure
```
frontend2/
├── src/
│   ├── components/          # React components
│   │   ├── DashboardPage.tsx
│   │   ├── UploadAnalyzePage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── ...
│   ├── services/
│   │   └── api.ts          # API client
│   ├── styles/
│   │   └── globals.css     # Global styles
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── index.html
└── vite.config.ts
```

## Deployment

### Static Hosting (Vercel, Netlify, etc.)
```bash
npm run build
# Deploy dist/ folder
```

### Docker
```bash
# Build
docker build -t trackshift-frontend .

# Run
docker run -p 80:80 trackshift-frontend
```

### Environment Variables
Create `.env.production`:
```
VITE_API_URL=https://api.trackshift.com
```

## Performance
- **Bundle Size**: ~200-300 KB (gzipped)
- **First Load**: <2s
- **Lighthouse Score**: 90+

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Attribution
See [Attributions.md](Attributions.md) for third-party assets and libraries.

---

**Version**: 1.0.0 (Production)  
**Last Updated**: November 16, 2025
