// Spiritual and Productivity Quotes Database
// Used on the Unified Dashboard to inspire and guide users daily

export interface Quote {
  text: string;
  author: string;
  category: 'spiritual' | 'motivation' | 'wisdom';
}

export const quotes: Quote[] = [
  {
    text: "Indeed, with hardship [will be] ease.",
    author: "Noble Quran (94:6)",
    category: "spiritual"
  },
  {
    text: "The best of people are those who are most beneficial to others.",
    author: "Prophet Muhammad ﷺ",
    category: "spiritual"
  },
  {
    text: "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.",
    author: "Paul J. Meyer",
    category: "motivation"
  },
  {
    text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.",
    author: "Jalaluddin Rumi",
    category: "wisdom"
  },
  {
    text: "What has reached you was never meant to miss you, and what has missed you was never meant to reach you.",
    author: "Prophet Muhammad ﷺ",
    category: "spiritual"
  },
  {
    text: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
    category: "motivation"
  },
  {
    text: "Establish prayer, and give zakah, and bow with those who bow in worship and obedience.",
    author: "Noble Quran (2:43)",
    category: "spiritual"
  },
  {
    text: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
    category: "motivation"
  },
  {
    text: "Great things are done by a series of small things brought together.",
    author: "Vincent Van Gogh",
    category: "wisdom"
  },
  {
    text: "Verily, in the remembrance of Allah do hearts find rest.",
    author: "Noble Quran (13:28)",
    category: "spiritual"
  },
  {
    text: "Your time is limited, so don't waste it living someone else's life.",
    author: "Steve Jobs",
    category: "motivation"
  },
  {
    text: "The tongue is like a lion, if you let it loose, it will wound someone.",
    author: "Ali Ibn Abi Talib (R.A)",
    category: "wisdom"
  }
];

export function getDailyQuote(): Quote {
  if (typeof window === 'undefined') {
    return quotes[0];
  }
  
  // Use current date (day of year) as seed to lock the quote for the entire day
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const index = dayOfYear % quotes.length;
  return quotes[index];
}
