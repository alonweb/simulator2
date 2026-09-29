// Session configuration. Everything a run of the session needs to change lives here.
// The devices edition's own spreadsheet and Apps Script deployment (2026-09-28). Never point
// it at the women's server: the rows would mix, and Reset on either would wipe both.
export const ENDPOINT =
  'https://script.google.com/macros/s/AKfycbwQKBiQ-Vhjt1WwTgdA5FRKqVZINGj00O6_9owAtIGFy1YQApMpGPdAuZz813OovU0eIg/exec';

// No categories in the devices game: each matchup asks one question, "Which is the one?"
// (flow.js), and Alon asked for nothing more (2026-09-29). The women's game keeps its four.
// The code still takes categories here, in the women's shape, if they are ever wanted back.
export const CATEGORIES = [];

// Ten pairs from Alon's "product head to head" folder (2026-09-29), in the folder's order.
// The ids are what the sheet stores, so they are the names in plain letters, readable in a
// raw row. The "air max" photo shows a Nike Air Jordan 1, so that side is called Nike.
const side = (id, name) => ({ id, name, photo: `photos/${id}.jpg` });
export const MATCHUPS = [
  { id: 'm1',  a: side('ronaldo', 'Ronaldo'),         b: side('messi', 'Messi') },
  { id: 'm2',  a: side('cappuccino', 'Cappuccino'),   b: side('beer', 'Beer') },
  { id: 'm3',  a: side('lamborghini', 'Lamborghini'), b: side('ferrari', 'Ferrari') },
  { id: 'm4',  a: side('burger-king', 'Burger King'), b: side('mcdonalds', "McDonald's") },
  { id: 'm5',  a: side('xbox', 'Xbox'),               b: side('ps5', 'PS5') },
  { id: 'm6',  a: side('bmw', 'BMW'),                 b: side('ducati', 'Ducati') },
  { id: 'm7',  a: side('adidas', 'Adidas'),           b: side('nike', 'Nike') },
  { id: 'm8',  a: side('omega', 'Omega'),             b: side('rolex', 'Rolex') },
  { id: 'm9',  a: side('seychelles', 'Seychelles'),   b: side('hawaii', 'Hawaii') },
  { id: 'm10', a: side('g-class', 'G-Class'),         b: side('escalade', 'Escalade') }
];

// Every row this build writes carries this label; closing the round applies to it. The
// presenter page shows the whole sheet regardless, and Reset wipes it. Nobody types it.
export const SESSION_LABEL = 'DEVICES1';

// The survey is its own page on the women's site, offered once a phone has finished both
// games (finish.js). This game marks itself done under DONE_KEY. Both sites share the
// alonweb.github.io address, which is what lets one see that the other is finished.
export const DONE_KEY = 'theone.done.devices';
export const SURVEY_URL = '/the-one-simulator/survey.html';

// Not asked in this game: the survey lives on the women's site (SURVEY_URL). Kept here only
// for load.mjs's survey wave. From Mati's focus-group brief (2026-09-26).
// type: 'scale' (min..max), 'choice' (one of options), or 'text'. required defaults to true.
// `short` is the column heading on the presenter page. Edit freely before the day.
export const SURVEY = [
  { key: 'challenge', type: 'text', short: 'Challenge whom',
    label: 'Would you challenge another fan on a result? Who, and why?' },
  { key: 'return', type: 'choice', short: 'Come back',
    label: 'Would you come back to see who won the challenge?', options: ['Yes', 'Maybe', 'No'] },
  { key: 'choose', type: 'choice', short: 'Would choose',
    label: 'Now that you have seen the screens, what would you choose?',
    options: ['A free matchup', 'A matchup with stars I bought', 'A reply from the contestant', 'Something in the results', 'Nothing'] },
  { key: 'chooseWhy', type: 'text', short: 'Why', label: 'Why that one?' },
  { key: 'maxPrice', type: 'text', short: 'Max price',
    label: 'What is the most you would pay for a first pack of stars?' },
  { key: 'packSize', type: 'text', short: 'Pack size',
    label: 'What pack size feels like fun, without putting you off?' },
  { key: 'buyAgain', type: 'choice', short: 'Buy after loss',
    label: 'Would you buy again after losing?', options: ['Yes', 'Maybe', 'No'] },
  { key: 'firstUse', type: 'choice', short: 'First use of stars',
    label: 'If you won stars, what would you do first?',
    options: ['Play again', 'Get a personal reply from the contestant', 'Be seen by the crowd', 'Save them for a prize'] },
  { key: 'prize', type: 'text', short: 'Prize wanted', label: 'Which prize would really interest you?' },
  { key: 'trust', type: 'choice', short: 'Trust hurt',
    label: 'You vote, and you also play matchups on the result. Does that hurt your trust in the game?',
    options: ['Yes', 'A little', 'No'] },
  { key: 'trustFix', type: 'text', short: 'What builds trust',
    label: 'What would make you believe the votes are counted properly?' },
  { key: 'other', type: 'text', short: 'Other', label: 'Anything else?', required: false }
];
