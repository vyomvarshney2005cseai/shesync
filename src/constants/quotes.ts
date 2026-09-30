export interface Quote {
  id: string;
  quote: string;
  author: string;
  role?: string;
  category: 'feminism' | 'empowerment' | 'wellness' | 'strength';
}

export const FEMINIST_QUOTES: Quote[] = [
  {
    id: '1',
    quote: 'Each time a woman stands up for herself, without knowing it possibly, without claiming it, she stands up for all women.',
    author: 'Maya Angelou',
    role: 'Poet & Civil Rights Activist',
    category: 'feminism',
  },
  {
    id: '2',
    quote: 'There is no limit to what we, as women, can accomplish.',
    author: 'Michelle Obama',
    role: 'Former First Lady & Author',
    category: 'empowerment',
  },
  {
    id: '3',
    quote: 'I am deliberate and afraid of nothing.',
    author: 'Audre Lorde',
    role: 'Writer & Philosopher',
    category: 'strength',
  },
  {
    id: '4',
    quote: 'Feminism isn’t about making women stronger. Women are already strong. It’s about changing the way the world perceives that strength.',
    author: 'G.D. Anderson',
    role: 'Feminist Author',
    category: 'feminism',
  },
  {
    id: '5',
    quote: 'A woman is like a tea bag—you never know how strong she is until you put her in hot water.',
    author: 'Eleanor Roosevelt',
    role: 'Human Rights Champion',
    category: 'strength',
  },
  {
    id: '6',
    quote: 'Women belong in all places where decisions are being made. It shouldn’t be that women are the exception.',
    author: 'Ruth Bader Ginsburg',
    role: 'Supreme Court Justice',
    category: 'feminism',
  },
  {
    id: '7',
    quote: 'Caring for myself is not self-indulgence, it is self-preservation, and that is an act of political warfare.',
    author: 'Audre Lorde',
    role: 'Civil Rights Activist',
    category: 'wellness',
  },
  {
    id: '8',
    quote: 'I raise up my voice—not so that I can shout, but so that those without a voice can be heard.',
    author: 'Malala Yousafzai',
    role: 'Nobel Peace Prize Laureate',
    category: 'empowerment',
  },
  {
    id: '9',
    quote: 'A feminist is anyone who recognizes the equality and full humanity of women and men.',
    author: 'Gloria Steinem',
    role: 'Journalist & Organizer',
    category: 'feminism',
  },
  {
    id: '10',
    quote: 'Your body is not a machine to force into silence; it is a sacred rhythm to listen to and honor.',
    author: 'SheSync Philosophy',
    role: 'Bio-Adaptive Feminine Health',
    category: 'wellness',
  },
  {
    id: '11',
    quote: 'We realize the importance of our voices only when we are silenced.',
    author: 'Malala Yousafzai',
    role: 'Nobel Peace Prize Laureate',
    category: 'strength',
  },
  {
    id: '12',
    quote: 'I have chosen to no longer be apologetic for my femaleness and my femininity. And I want to be respected in all of my femaleness.',
    author: 'Chimamanda Ngozi Adichie',
    role: 'Author of We Should All Be Feminists',
    category: 'feminism',
  }
];

export function getRandomQuote(excludeId?: string): Quote {
  const filtered = excludeId
    ? FEMINIST_QUOTES.filter((q) => q.id !== excludeId)
    : FEMINIST_QUOTES;
  const index = Math.floor(Math.random() * filtered.length);
  return filtered[index] || FEMINIST_QUOTES[0];
}

export function getQuotesByCategory(category: Quote['category']): Quote[] {
  return FEMINIST_QUOTES.filter((q) => q.category === category);
}
