export const faqCategories = [
  {
    category: "General",
    questions: [
      {
        q: "What is Retrace?",
        a: "Retrace is a local-first screen recording and search application for macOS. It continuously captures your screen, extracts text using OCR, and lets you search through your entire screen history using search queries. Unlike cloud-based alternatives, all data stays on your Mac.",
      },
      {
        q: "How is it different from Rewind AI?",
        a: "Retrace is free, 100% open source and local-first. While Rewind stores data in the cloud, Retrace keeps everything on your Mac. You can audit the code, verify no data leaves your device, and have complete control over your screen history. Plus, it's free and licensed under MIT.",
      },
      {
        q: "Is it really free and open source?",
        a: "Yes! Retrace is licensed under MIT, which means the source code is publicly available, you can modify it, and it will always remain free. You can view the code on GitHub and even build it yourself from source.",
      },
    ],
  },
  {
    category: "Privacy & Security",
    questions: [
      {
        q: "Where is my data stored?",
        a: "All your personal data is stored locally on your Mac in ~/Library/Application Support/Retrace/. Screen captures are saved as image files, and extracted text is stored in a local SQLite database.",
      },
      {
        q: "Can anyone else access my screen history?",
        a: "No. Since all data is stored locally on your Mac, only you (with your Mac login credentials) can access your screen history.",
      },
      {
        q: "Do you send data to any servers?",
        a: "Absolutely not. Retrace the app has no backend logic on servers. All processing happens on your device. You can verify this by monitoring your network traffic or reviewing the source code on GitHub.",
      },
      {
        q: "How do I verify no data leaves my device?",
        a: "You can use network monitoring tools like Little Snitch or Wireshark to verify Retrace makes no network connections. You can also audit the source code on GitHub or build the app yourself from source.",
      },
    ],
  },
  {
    category: "Technical",
    questions: [
      {
        q: "What are the system requirements?",
        a: "Minimum: macOS 13.0 (Ventura), 4GB RAM, 2GB free disk space. Strongly Recommended: Apple Silicon Mac (M1 or later), 8GB+ RAM, 10GB+ free disk space for history storage.",
      },
      {
        q: "How much disk space does it use?",
        a: "On average, expect about 10-20 GB per month of continuous recording. You can configure capture frequency and automatic deletion of old captures in settings.",
      },
      {
        q: "Does it slow down my Mac?",
        a: "On Apple Silicon, it should not slow down your Mac.",
      },
      {
        q: "How much battery does it consume?",
        a: "Since this is the first version, there is no conclusive data on battery consumption. This will be tracked in the future.",
      },
      {
        q: "Can I use it on Intel Macs?",
        a: "Retrace has only been tested on Apple Silicon Macs and cannot guarantee that it will work on Intel Macs. All operations are optimized for Apple Silicon.",
      },
      {
        q: "Does it work with multiple monitors?",
        a: "Yes! However Retrace only captures the active display. Which means if you have multiple monitors, it will only capture the active one.",
      },
    ],
  },
  {
    category: "Usage",
    questions: [
      {
        q: "How do I search my history?",
        a: "Use search queries in the search bar. You can search for any text that you think you might have seen in the past and it will pull it up.",
      },
      {
        q: "Can I exclude certain apps from recording?",
        a: "Yes. You can configure app exclusions in Settings > Privacy. For example, you might want to exclude password managers, banking apps, or private browsing windows.",
      },
      {
        q: "How do I pause recording?",
        a: "Click the Retrace menu bar icon and select 'Pause Recording'. You can also set up keyboard shortcuts in Settings.",
      },
      {
        q: "Can I import data from Rewind or other apps?",
        a: "Yes! Retrace allows you to scroll through even your Rewind data. Timescroll and Screenmemory imports are coming soon.",
      },
      {
        q: "How far back does the history go?",
        a: "This depends on your storage settings. By default, Retrace keeps all data by default. You can configure retention windows in Settings to keep more or less history based on your available disk space.",
      },
      {
        q: "Does Retrace record audio?",
        a: "Not yet. Audio recording is a coming soon feature that will be added in a future update.",
      },
    ],
  },
  {
    category: "Troubleshooting",
    questions: [
      {
        q: "Screen recording permission not working",
        a: "Go to System Settings > Privacy & Security > Screen Recording and ensure Retrace is checked. You may need to restart the app after granting permission. If issues persist, try removing and re-adding the permission.",
      },
      {
        q: "Search returns no results",
        a: "This usually means OCR processing is still in progress for recent captures. Wait a few minutes and try again. You can check indexing progress in Settings > Database. Also verify that recording is not paused.",
      },
      {
        q: "How to completely uninstall",
        a: "1) Quit Retrace, 2) Delete /Applications/Retrace.app, 3) Delete ~/Library/Application Support/Retrace/, 4) Delete ~/Library/Preferences/com.retrace.app.plist (optional). All data will be permanently removed.",
      },
    ],
  },
  {
    category: "Development",
    questions: [
      {
        q: "How can I contribute?",
        a: "Check out our GitHub repository at https://github.com/haseab/retrace! We welcome pull requests for bug fixes, new features, documentation improvements, and translations. Read CONTRIBUTING.md for guidelines.",
      },
      {
        q: "Where do I report bugs?",
        a: "Please email support@retrace.to with detailed steps to reproduce the bug, your macOS version, and Retrace version. Logs from Settings > Advanced > Export Logs are helpful too.",
      },
      {
        q: "Can I request features?",
        a: "Absolutely! Submit a feature request on Featurebase at https://retrace.featurebase.app. Describe your use case and why it would benefit other users. Popular requests are more likely to be implemented.",
      },
      {
        q: "How do I build from source?",
        a: "Clone the repository, install dependencies with the package manager, and run the build script. Detailed build instructions are in BUILD.md in the GitHub repository.",
      },
    ],
  },
];

export const supportInfo = {
  email: "support@retrace.to",
  featurebase: "https://retrace.featurebase.app",
};
