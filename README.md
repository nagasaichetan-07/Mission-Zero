# 🚀 mission:zero — Study Tracker

A sleek, responsive dark-mode study tracker designed to help you conquer your semester with **zero backlogs and absolute mastery**.

![mission:zero logo](./public/logo.png)

---

## ✨ Features

- **8 Subjects & 242 Confirmed Topics**: Pre-loaded with complete syllabus breakdown organized unit-wise.
- **Dynamic Color Shifting Progress**:
  - 🔴 **0% - 35%**: Red / Crimson (Getting Started)
  - 🟡 **36% - 75%**: Amber / Gold (Good Momentum)
  - 🟢 **76% - 100%**: Emerald Green (Optimal Progress / Mastered 🎉)
- **Top Overall Progress Hero**:
  - Animated radial progress meter & global linear progress bar
  - Cleared count, remaining count, and subjects completed counter
  - Global "Expand All" & "Collapse All" controls
- **Subject Cards**:
  - Interactive checklist with custom animated checkboxes
  - Real-time subject progress bar & "x / y topics" indicator
  - Unit groupings (Unit I to Unit V) for crystal-clear clarity
  - Individual "Reset Subject" and "Mark All Done" actions with safety confirmations
- **Smart Filtering & Search**:
  - Live search across all 242 topics
  - "Pending Only" filter pill to focus solely on what's left
- **Coinskill-Inspired Opening Animation**:
  - Kinetic orbital energy rings
  - Logo elastic bounce reveal with metallic sheen sweep
  - Brand typography tracking with glowing golden accent colon `:`
  - Replay button in header to watch anytime
- **Study Buddy & Friend Tracking**:
  - **1-Click Share Link**: Send your progress URL or sync code over WhatsApp/Discord.
  - **Friend Mode**: View your friend's exact checklist in a dedicated, read-only tab.
  - **Study Buddy Duel**: Side-by-side comparison showing who has completed more topics and is leading the grind!
- **Local Storage Persistence**:
  - Only checked topic IDs are stored in `localStorage` (`mission_zero_completed_topic_ids`).
  - Syllabus data remains clean and untouched in code.

---

## 🛠️ How to Run the App

### Option A: Standard Vite Dev Server (Recommended with Node.js)
If Node.js and npm are installed on your machine:
```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Option B: Zero-Install Instant Server (Works Anywhere)
You can run `mission:zero` instantly using Python's built-in HTTP server without installing Node.js:
```bash
# In the project directory:
py -m http.server 3000
```
Then open [http://localhost:3000](http://localhost:3000) in Google Chrome or any modern browser.

---

## 📝 How to Edit `syllabus.js`

All syllabus data is stored in [`src/data/syllabus.js`](./src/data/syllabus.js) in the following structure:

```javascript
export const syllabus = [
  {
    id: "sub1",
    name: "Subject Code",
    fullName: "Subject Full Title",
    icon: "zap",
    topics: [
      { id: "sub1-t1", title: "Topic Title 1", unit: "Unit I: Unit Title" },
      { id: "sub1-t2", title: "Topic Title 2", unit: "Unit I: Unit Title" }
    ]
  }
];
```

### To Add a New Topic:
1. Open [`src/data/syllabus.js`](./src/data/syllabus.js).
2. Find the subject you want to update.
3. Add a new object inside its `topics` array with a unique `id` and `title`:
   ```javascript
   { id: "sub1-t35", title: "Your New Topic Title", unit: "Unit V: ..." }
   ```
4. Save the file. The app will immediately update total counts, percentages, and progress bars without affecting your previously saved checks!

### To Change a Subject Name:
Simply modify the `name` or `fullName` property in the respective subject object in [`src/data/syllabus.js`](./src/data/syllabus.js).
