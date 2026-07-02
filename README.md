# 🎵 MelodyMind AI

MelodyMind AI is an intelligent music composition web application that generates original melodies based on user preferences such as genre, mood, tempo, instrument, creativity level, and composition length.

The application provides an interactive interface where users can generate, preview, visualize, and download AI-generated musical compositions in MIDI format.

---

## ✨ Features

- 🎼 AI-powered melody generation
- 🎹 Multiple virtual instruments
- 🎭 Mood-based music creation
- 🎵 Genre selection
- ⚡ Adjustable tempo and creativity level
- 🎚️ Custom composition length
- ▶️ Play, Pause and Stop playback
- 📈 Real-time audio waveform visualization
- 💾 Export compositions as MIDI files
- 📱 Responsive modern UI
- 🌙 Clean and intuitive interface

---

## 🛠️ Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Motion
- Lucide React

### Backend
- Node.js
- Express.js

### Music Libraries
- Tone.js
- MIDI Writer JS

### AI
- Generative AI API

---

## 📂 Project Structure

```
melodymind-ai/
│
├── src/
│   ├── components/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── server.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/melodymind-ai.git
```

### 2. Navigate to the project

```bash
cd melodymind-ai
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create an environment file

Create a `.env` file in the project root and add your API key.

```env
GEMINI_API_KEY=your_api_key_here
```

### 5. Start the development server

```bash
npm run dev
```

The application will be available at:

```
http://localhost:5173
```

---

## 🚀 Build for Production

```bash
npm run build
```

---

## ▶️ Run Production Build

```bash
npm start
```

---

## 🎮 How to Use

1. Select a music genre.
2. Choose an instrument.
3. Pick the desired mood.
4. Adjust the tempo.
5. Set the creativity level.
6. Choose the composition length.
7. Click **Generate Music**.
8. Listen to the generated melody.
9. Download the composition as a MIDI file if desired.

---

## 📦 Available Scripts

| Command | Description |
|----------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run lint` | Type checking |

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | API key used for music generation |

---

## 🎯 Future Improvements

- Multi-track compositions
- Additional instrument libraries
- WAV and MP3 export
- User accounts and saved compositions
- Playlist management
- Music sharing
- AI-assisted chord progression suggestions
- Piano roll editor
- Dark/Light theme toggle

---

## 📄 License

This project is intended for educational and learning purposes.

---

## 👨‍💻 Author

Developed as an AI-powered music generation application using modern web technologies.
