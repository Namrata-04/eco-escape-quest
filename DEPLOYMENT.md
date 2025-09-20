# Eco Escape Quest - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project directory:**
   ```bash
   cd /Users/namratasmacbook/Downloads/eco-escape-quest-main
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? **Yes**
   - Which scope? **Your personal account**
   - Link to existing project? **No**
   - Project name: **eco-escape-quest** (or your preferred name)
   - Directory: **./** (current directory)
   - Override settings? **No**

### Option 2: Deploy via Vercel Dashboard

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Eco Escape Quest game"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/eco-escape-quest.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project
   - Click "Deploy"

## 📁 Project Structure

```
eco-escape-quest/
├── src/
│   ├── components/
│   │   ├── rooms/          # Game rooms (Energy, Waste, Water, Shelter, Policy)
│   │   ├── ui/             # Shadcn UI components
│   │   └── ...
│   ├── pages/              # Main pages
│   ├── multiplayer/        # Multiplayer functionality
│   └── ...
├── public/                 # Static assets
├── vercel.json            # Vercel configuration
└── package.json
```

## ⚙️ Configuration Files

- **vercel.json**: Vercel deployment configuration
- **.vercelignore**: Files to exclude from deployment
- **vite.config.ts**: Build configuration optimized for production

## 🎮 Features Deployed

- ✅ 5 Interactive Climate Crisis Rooms
- ✅ Photo Upload with Smart Validation
- ✅ Persistent Scoreboard System
- ✅ Multiplayer Lobby (Local Simulation)
- ✅ Dramatic Animations & UI Effects
- ✅ Real-world Challenge Integration

## 🔧 Build Commands

- **Development**: `npm run dev`
- **Production Build**: `npm run build`
- **Preview**: `npm run preview`

## 🌐 Environment

- **Framework**: Vite + React + TypeScript
- **UI**: Shadcn/ui + Tailwind CSS
- **Routing**: React Router DOM
- **State**: React Hooks + Local Storage

## 📱 Mobile Responsive

The game is fully responsive and works on:
- Desktop browsers
- Mobile devices
- Tablets

## 🎯 Live Demo

Once deployed, your game will be available at:
`https://eco-escape-quest.vercel.app` (or your custom domain)

## 🐛 Troubleshooting

If deployment fails:
1. Check that all dependencies are in `package.json`
2. Ensure build completes locally: `npm run build`
3. Verify `vercel.json` configuration
4. Check Vercel build logs for specific errors

## 📞 Support

For deployment issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)


