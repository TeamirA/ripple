export const SEED_PASSWORD = 'ripple-demo-2026';

export const users = [
  {
    username: 'demo',
    displayName: 'Demo Explorer',
    bio: 'The account you are using right now. Look around, post something, break nothing important.',
    bannerColor: '#6366f1',
  },
  {
    username: 'maya_codes',
    displayName: 'Maya Okafor',
    bio: 'Backend engineer. Postgres enthusiast. Writes about queries that got 100x faster.',
    bannerColor: '#0ea5e9',
  },
  {
    username: 'liamdesigns',
    displayName: 'Liam Chen',
    bio: 'Product designer obsessed with type, grids and making forms less painful.',
    bannerColor: '#f97316',
  },
  {
    username: 'sofia.lens',
    displayName: 'Sofia Martínez',
    bio: 'Street & travel photographer. Currently chasing golden hour in Lisbon.',
    bannerColor: '#e11d48',
  },
  {
    username: 'dev_noah',
    displayName: 'Noah Williams',
    bio: 'Frontend dev. Accessibility advocate. Will review your aria-labels for free.',
    bannerColor: '#22c55e',
  },
  {
    username: 'amara_reads',
    displayName: 'Amara Bekele',
    bio: 'Librarian by day, sci-fi reviewer by night. 52 books a year or bust.',
    bannerColor: '#a855f7',
  },
  {
    username: 'kenji.runs',
    displayName: 'Kenji Tanaka',
    bio: 'Marathoner, data nerd, spreadsheet of every run since 2016.',
    bannerColor: '#14b8a6',
  },
  {
    username: 'priya_ml',
    displayName: 'Priya Sharma',
    bio: 'ML engineer. Turning messy data into slightly less messy predictions.',
    bannerColor: '#f59e0b',
  },
  {
    username: 'oliver_bakes',
    displayName: 'Oliver Brooks',
    bio: 'Home baker. Sourdough starter is named Gerald and he is thriving.',
    bannerColor: '#d97706',
  },
  {
    username: 'zara.green',
    displayName: 'Zara Ahmed',
    bio: 'Urban gardener and climate optimist. Balcony tomatoes are a lifestyle.',
    bannerColor: '#16a34a',
  },
  {
    username: 'lucas_dev',
    displayName: 'Lucas Ferreira',
    bio: 'Indie hacker shipping tiny tools. Currently: a habit tracker nobody asked for.',
    bannerColor: '#2563eb',
  },
  {
    username: 'hana.music',
    displayName: 'Hana Kim',
    bio: 'Pianist and producer. Lo-fi beats, jazz chords, too many synths.',
    bannerColor: '#db2777',
  },
  {
    username: 'ethan_ops',
    displayName: 'Ethan Clarke',
    bio: 'SRE. I make the pager quiet. Observability > hope.',
    bannerColor: '#475569',
  },
  {
    username: 'nia.writes',
    displayName: 'Nia Johnson',
    bio: 'Tech writer. Docs are a product. Fight me (politely).',
    bannerColor: '#7c3aed',
  },
  {
    username: 'mateo_trails',
    displayName: 'Mateo Rossi',
    bio: 'Hiker, map collector, occasional bad camper. Dolomites forever.',
    bannerColor: '#65a30d',
  },
];

export const postsByUser = {
  demo: [
    'Just joined Ripple. What should I check out first?',
    'Testing the post editor: 500 characters feels like the right amount of room for a thought.',
  ],
  maya_codes: [
    'Reminder: OFFSET pagination gets slower the deeper you scroll. Cursor pagination on (created_at, id) keeps every page equally fast.',
    'Added a composite index today and a dashboard query went from 2.3s to 18ms. EXPLAIN ANALYZE is the best debugger I own.',
    'Hot take: most "we need NoSQL" problems are really "we need an index" problems.',
    'Denormalized counters are fine as long as you update them in the same transaction as the source row. Ask me how I learned that.',
    'Postgres full-text search is criminally underrated for small apps. tsvector + GIN index and you are done.',
  ],
  liamdesigns: [
    'A good empty state answers three questions: what is this, why is it empty, and what can I do now?',
    'Spent the morning tightening our spacing scale to 4/8/12/16/24/32. Everything suddenly feels intentional.',
    'Dark mode is not just inverting colors. Lower the contrast of surfaces, keep the contrast of text.',
    'Skeleton loaders that match the real layout reduce perceived wait time more than any spinner ever will.',
  ],
  'sofia.lens': [
    'Lisbon at 7am: empty trams, warm light, and the smell of pastéis de nata everywhere.',
    'Shot an entire roll on a 35mm prime today. Constraints make you see differently.',
    'The best camera settings tip I ever got: expose for the highlights, the shadows will forgive you.',
    'Rainy day in Porto. Reflections on the cobblestones made every street look like a movie set.',
  ],
  dev_noah: [
    'If your custom button is a div, it is not a button. Use <button>. Your keyboard users will thank you.',
    'Tab through your app with the mouse unplugged once a week. You will find bugs you never knew existed.',
    'Focus rings are a feature, not a bug. Style them, do not remove them.',
    'Event delegation: one listener on the list instead of 500 on the items. Fewer listeners, less memory, simpler code.',
  ],
  amara_reads: [
    'Finished "The Left Hand of Darkness" again. Somehow it gets better every time.',
    'Book 41 of 52 this year. Currently reading a novel about a library that exists between dimensions. Very on brand.',
    'Unpopular opinion: it is completely fine to stop reading a book you are not enjoying.',
    'Looking for sci-fi recommendations with great worldbuilding and short chapters. Go!',
  ],
  'kenji.runs': [
    'Long run done: 28km at an easy pace. Negative splits for the last 5k felt amazing.',
    'Plotted my weekly mileage for 8 years. The best predictor of a good race is boring consistency.',
    'Rest days are training days. Took me three injuries to believe that.',
    'Marathon in 6 weeks. Taper strategy: trust the plan, ignore the panic.',
  ],
  priya_ml: [
    'Before tuning your model, check your data. 80% of my "model bugs" were label bugs.',
    'Trained a tiny classifier that beats our old rules engine. Explaining the confusion matrix to stakeholders was the hard part.',
    'Baselines first. If logistic regression gets you 90%, a transformer needs to justify its cost.',
    'Feature leakage is sneaky. If your validation score looks too good to be true, it is.',
  ],
  oliver_bakes: [
    'Gerald (my sourdough starter) produced the best loaf yet. Open crumb, crackly crust, zero regrets.',
    'Cinnamon rolls this weekend. The secret is a tangzhong roux: impossibly soft for days.',
    'Baking is just chemistry you can eat. Weigh your flour, people.',
    'Tried a 72-hour cold ferment for pizza dough. Never going back.',
  ],
  'zara.green': [
    'First balcony tomato of the season! Tiny, slightly lopsided, absolutely perfect.',
    'Composting update: the worms are happy and the kitchen scraps are disappearing fast.',
    'Planted basil next to the tomatoes. Companion planting is real and delicious.',
    'Small climate wins count: switched to a community solar plan this month.',
  ],
  lucas_dev: [
    'Shipped v0.3 of my habit tracker. 14 users, and 12 of them are my friends. Still counts.',
    'Vanilla JS in 2026 is genuinely pleasant. ES modules + fetch + a tiny store gets you surprisingly far.',
    'The hardest part of indie hacking is not the code. It is writing the landing page copy.',
    'Rewrote my side project without a framework. Bundle went from 280kb to 24kb.',
  ],
  'hana.music': [
    'Finished a lo-fi track built entirely around a single Rhodes sample. Sometimes less really is more.',
    'Practicing Bill Evans voicings until my left hand gives up.',
    'Producer tip: high-pass everything that is not the kick or the bass. Instant clarity.',
    'Recorded rain on my window and turned it into a texture layer. Free ambience!',
  ],
  ethan_ops: [
    'Our pager was silent all weekend. That is not luck, that is three months of alert tuning.',
    'If an alert does not require a human action, it is not an alert. It is a log line.',
    'Health checks should check dependencies, not just return 200. Ask the database if it is alive.',
    'Postmortems should be blameless and boring. Boring means the process worked.',
  ],
  'nia.writes': [
    'Every README should answer: what is it, why should I care, how do I run it, where do I get help.',
    'Wrote the docs before the feature today. Found two API design issues before a single line of code.',
    'Error messages are documentation. "Something went wrong" is a missed opportunity.',
    'Screenshots in docs age fast. Annotated diagrams age slower.',
  ],
  mateo_trails: [
    'Sunrise from Seceda this morning. Worth every switchback and the 4am alarm.',
    'New rule: always pack one more layer than you think you need.',
    'Found a hand-drawn 1970s trail map at a flea market. The trails are still there.',
    'Hut-to-hut hiking is the best way to travel. Every evening ends with soup and strangers who become friends.',
  ],
};

export const commentTexts = [
  'This is such a good point.',
  'Saving this for later, thank you!',
  'Totally agree. Learned this the hard way too.',
  'Love this so much.',
  'Wait, how did you figure that out?',
  'Can you share more details?',
  'This made my day.',
  'Underrated advice right here.',
  'I needed to hear this today.',
  'Beautiful!',
  'Okay, trying this tonight.',
  'Strong agree on this one.',
  'This is the content I am here for.',
  'Bookmarking this immediately.',
  'Great tip, thanks for sharing.',
  'I have so many questions about this.',
  'Counterpoint: it depends. But mostly yes.',
  'Ha! Been there.',
];

export const replyTexts = [
  'Thank you!',
  'Glad it helped!',
  'Exactly what I was thinking.',
  'Happy to share more, DM me.',
  'Ha, same here.',
  'Good question, I will write a follow-up.',
  'Appreciate it!',
  'Let me know how it goes!',
];
