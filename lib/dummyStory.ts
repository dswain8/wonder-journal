import { classifyTopicByKeywords } from './generateStory';
import { lookupBenchmark } from './benchmarks';
import { toGeneratedStory, validateGeneratedAnswerV1 } from './storyContract';
import { getSpecialStoryExperience } from './storyExperiences';
import { GeneratedAnswerV1, GeneratedStory, KidProfile, StoryTopic } from './types';
import { DEFAULT_KID_PROFILE } from './wonderGuides';

type TopicScript = {
  answer: string;
  detail: string;
  titles: string[];
  settings: string[];
  companions: string[];
  sensations: string[];
  wonderQuestions: string[];
};

const TOPIC_LIBRARY: Partial<Record<StoryTopic, TopicScript>> = {
  animals: {
    answer:
      'Animals look and act in special ways because each body part helps them live, move, find food, or stay safe.',
    detail:
      'Bright colors can warn, soft fur can keep a body warm, and long legs, wings, or fins help different animals travel through their homes.',
    titles: ['The Animal Clue Trail', 'Anvita and the Helpful Tails', 'The Secret of Feathers and Fur'],
    settings: ['a sunny zoo path', 'a tiny forest trail behind the swing set', 'a butterfly garden full of rustling leaves'],
    companions: ['a striped butterfly guide', 'a patient park ranger with a green hat', 'a cheerful rabbit who loved clues'],
    sensations: ['the air smelled grassy and sweet', 'soft feathers fluttered nearby and tiny feet pattered on the path', 'the leaves whispered and flowers nodded in the breeze'],
    wonderQuestions: ['I wonder why some animals sleep in the day and wake up at night?', 'I wonder how birds know where to fly?', 'I wonder why some animals have spots and others have stripes?'],
  },
  space: {
    answer:
      'Many things in space look bright because of sunlight, and the moon shines when light from the sun bounces off its dusty ground and travels to Earth.',
    detail:
      'As the moon moves around Earth, we see different lit parts, so it can look round one night and like a small silver slice on another.',
    titles: ['Moonbeam Map', 'The Sky Lantern Secret', 'Anvita and the Silver Moon'],
    settings: ['a moonlit rooftop garden', 'a blanket fort on the balcony with a cardboard telescope', 'a quiet sky path made of silver light'],
    companions: ['a gentle moonbeam named Mili', 'a paper rocket with twinkly buttons', 'a smiling star who loved explaining things'],
    sensations: ['the night air felt cool on Anvita\'s cheeks and the sky looked soft and blue-black', 'tiny stars blinked like pinpricks of sugar light', 'the moon looked pale and dusty, like a round flour chapati'],
    wonderQuestions: ['I wonder why the moon changes shape in the sky?', 'I wonder why stars twinkle but planets look steady?', 'I wonder how astronauts sleep in space?'],
  },
  nature: {
    answer:
      'Plants and places in nature change because sunlight, water, soil, and time all work together in quiet little steps.',
    detail:
      'Seeds split, roots drink, leaves catch light, and rivers, rocks, and wind keep shaping the world even when we cannot see it happening fast.',
    titles: ['The Garden of Small Steps', 'Anvita and the Growing Clues', 'The Secret Work of Sun and Rain'],
    settings: ['a damp garden bed after watering time', 'a leafy path with pebbles and moss', 'a meadow where tall grass swayed like waves'],
    companions: ['a tiny seed with a brave voice', 'a friendly gardener carrying a watering can', 'a dandelion puff that loved drifting slowly'],
    sensations: ['the soil felt cool and crumbly in small hands', 'the grass tickled little ankles and the sun felt warm on a small back', 'bees hummed while leaves rustled overhead'],
    wonderQuestions: ['I wonder how a tiny seed knows which way to grow?', 'I wonder why leaves change color?', 'I wonder how rivers keep moving all day long?'],
  },
  body: {
    answer:
      'Our bodies have many parts with different jobs, and they work together all the time to help us move, think, feel, and grow.',
    detail:
      'Lungs bring in air, the heart sends oxygen and energy around the body, bones hold us up, and the brain helps send messages from place to place.',
    titles: ['Inside Anvita\'s Amazing Body', 'The Busy Body Parade', 'The Little Helpers Inside'],
    settings: ['a pretend body museum made from pillows and scarves', 'a bright hallway full of glowing body signs', 'a tiny train ride through a body map'],
    companions: ['a giggling heartbeat drummer', 'a wise little lung balloon', 'a shining brain light with quick ideas'],
    sensations: ['a soft thump-thump and a whoosh of air filled the space', 'everything felt busy, warm, and full of motion', 'lights blinked like friendly signals all around'],
    wonderQuestions: ['I wonder why hearts beat faster when we run?', 'I wonder why we need sleep every night?', 'I wonder how bones grow as kids get taller?'],
  },
  food: {
    answer:
      'Food changes when it grows, cooks, melts, or mixes, and those changes happen because of heat, water, air, and tiny living things.',
    detail:
      'Bread rises when bubbles form inside dough, fruit ripens as it softens and sweetens, and cold treats melt when warmth reaches them.',
    titles: ['The Kitchen of Clues', 'Anvita and the Busy Bowl', 'Why Food Changes'],
    settings: ['a cozy kitchen with warm yellow light', 'a fruit market full of color and chatter', 'a tiny bakery where dough puffed like pillows'],
    companions: ['a wooden spoon who loved stirring', 'a baker with flour on her nose', 'a mango crate that smelled like summer'],
    sensations: ['the room smelled warm and buttery', 'steam curled up in soft white swirls', 'sweet fruit scents floated through the air'],
    wonderQuestions: ['I wonder why popcorn pops?', 'I wonder how honey gets so sweet?', 'I wonder why some fruits are crunchy and some are soft?'],
  },
  weather: {
    answer:
      'Weather happens because air, water, sunlight, and clouds keep moving around the sky in big patterns.',
    detail:
      'Warm air can rise, water can turn into tiny drops, clouds can gather, and wind can push everything from one place to another.',
    titles: ['The Sky\'s Busy Workshop', 'Anvita and the Rainy Clues', 'The Day the Wind Explained Itself'],
    settings: ['a breezy hill with a bright kite', 'a rainy window seat with a warm blanket', 'a cloud path high above the neighborhood'],
    companions: ['a puffy cloud with a round laugh', 'a dancing gust of wind', 'a raindrop that loved explaining the water cycle'],
    sensations: ['patter-patter tapped the glass and cool mist kissed a little nose', 'the wind tugged at loose hair and hummed in small ears', 'the sky smelled clean, wet, and bright'],
    wonderQuestions: ['I wonder how rainbows get their colors?', 'I wonder why thunder comes after lightning?', 'I wonder where puddles go when the sun comes out?'],
  },
  ocean: {
    answer:
      'The ocean keeps moving because of wind, waves, and tides, and it is full of living things that each have their own jobs and homes.',
    detail:
      'Some creatures swim near the top where sunlight reaches, while others hide below, and the moon also helps pull ocean water into tides.',
    titles: ['The Tide Pool Treasure', 'Anvita and the Moving Sea', 'The Ocean\'s Gentle Pull'],
    settings: ['a sandy beach with tiny shells', 'a clear tide pool sparkling in the sun', 'a little blue boat rocking softly near shore'],
    companions: ['a crab who walked sideways and smiled', 'a silver fish with quick fins', 'a patient sea turtle who loved slow answers'],
    sensations: ['the air smelled salty and fresh', 'waves made hush-hush sounds against the shore', 'cool foam swirled around little toes'],
    wonderQuestions: ['I wonder why the sea has waves all day?', 'I wonder how fish breathe underwater?', 'I wonder why some shells are spiral shaped?'],
  },
  transport: {
    answer:
      'Vehicles move in different ways because they are built to roll, float, glide, or push through air with wheels, wings, or engines.',
    detail:
      'Cars use wheels on roads, boats float because water pushes up on them, and planes stay up when fast-moving air lifts their wings.',
    titles: ['The Wheels, Wings, and Waves Tour', 'Anvita Builds a Route Map', 'How Things Go'],
    settings: ['a busy train platform with echoes and whistles', 'a toy garage that opened into a giant road map', 'a windy airfield with paper planes dancing'],
    companions: ['a bright red bus with kind headlights', 'a paper plane captain', 'a train conductor who loved explaining wheels'],
    sensations: ['the tracks hummed under small shoes', 'soft engine rumbles mixed with happy bell dings', 'the breeze pushed gently against little arms'],
    wonderQuestions: ['I wonder how airplanes stay up?', 'I wonder why trains stay on the track?', 'I wonder how boats carry heavy things without sinking?'],
  },
  colors: {
    answer:
      'Colors appear when light bounces off things in different ways, and sounds happen when something shakes or vibrates.',
    detail:
      'A red apple reflects red light to our eyes, a prism can spread light into a rainbow, and a drum makes sound because its skin wiggles fast when tapped.',
    titles: ['The Rainbow Workshop', 'Anvita and the Dancing Light', 'The Secret of Color and Sound'],
    settings: ['an art table with jars of paint', 'a sunny room with a glass prism', 'a music corner with drums, bells, and bright ribbons'],
    companions: ['a rainbow ribbon that loved twirling', 'a drum with a deep friendly boom', 'a beam of sunlight that split into many colors'],
    sensations: ['splashes of color gleamed like candy', 'music bounced softly through the room', 'light sparkled on the wall in bright little stripes'],
    wonderQuestions: ['I wonder why shadows look dark?', 'I wonder how mixing colors makes new ones?', 'I wonder why some sounds are loud and some are soft?'],
  },
  wonder: {
    answer:
      'Big questions are often solved by collecting small clues, looking carefully, and trying ideas one by one.',
    detail:
      'When we wonder, we notice patterns, ask more questions, and slowly turn a mystery into something we can understand.',
    titles: ['The Wonder Trail', 'Anvita and the Clue Lantern', 'A Pocket Full of Questions'],
    settings: ['a paper map covered with stars and arrows', 'a quiet library corner with tall books', 'a backyard path with magnifying glasses hanging from hooks'],
    companions: ['a tiny notebook with brave pages', 'a librarian who loved curious kids', 'a lantern that glowed brighter with each clue'],
    sensations: ['everything felt calm, bright, and full of possibility', 'pages rustled softly and little lights shimmered nearby', 'the world seemed full of secret signs waiting to be noticed'],
    wonderQuestions: ['I wonder what other clue we could look for next?', 'I wonder how scientists test their ideas?', 'I wonder why asking questions feels so exciting?'],
  },
};

const SPECIAL_MATCHES: Array<{
  match: RegExp;
  title: string;
  topic: StoryTopic;
  answer: string;
  detail: string;
  wonderQuestion: string;
}> = [
  {
    match: /\bpeacock\b|\bpeacocks\b/i,
    title: 'The Rainy Feather Dance',
    topic: 'animals',
    answer:
      'Peacocks often spread their feathers and dance in rainy season to show other peacocks they are strong and healthy.',
    detail:
      'The rain does not make them dance like magic. Wet weather is simply a time when peacocks are more likely to show off their bright feathers.',
    wonderQuestion: 'I wonder why peacock feathers shine with so many colors?',
  },
  {
    match: /\bheart\b.*\b(run|running|faster)\b|\b(run|running)\b.*\bheart\b/i,
    title: 'The Thump-Thump Helper',
    topic: 'body',
    answer:
      'When you run, your muscles need more oxygen and energy, so your heart beats faster to send help around your body.',
    detail:
      'That is why your breathing can speed up too. Your body is working as a helpful team while you move.',
    wonderQuestion: 'I wonder why breathing gets faster when we run?',
  },
  {
    match: /\bmoon\b.*\bshine\b|\bshine\b.*\bmoon\b/i,
    title: 'Moonbeam Steps',
    topic: 'space',
    answer:
      'The moon does not make its own light. Sunlight hits the moon and bounces to Earth, so the moon looks bright at night.',
    detail:
      'That is also why the moon seems to change shape. We only see the part that sunlight is lighting up from where we stand on Earth.',
    wonderQuestion: 'I wonder why the moon looks orange near the ground sometimes?',
  },
  {
    match: /\brainbow\b/i,
    title: 'The Color Bridge',
    topic: 'weather',
    answer:
      'A rainbow appears when sunlight enters raindrops, bends, and then spreads into many colors before coming back out.',
    detail:
      'Each color bends a tiny bit differently, so our eyes see red, orange, yellow, green, blue, and more lined up in the sky.',
    wonderQuestion: 'I wonder why rainbows look like arches instead of straight lines?',
  },
  {
    match: /\bairplane\b|\bairplanes\b|\bplane\b|\bplanes\b/i,
    title: 'Wings in the Wind',
    topic: 'transport',
    answer:
      'Airplanes stay up because their wings are shaped to move air in a way that creates lift while the engines push them forward.',
    detail:
      'Fast-moving air helps hold the plane up, and the pilot balances speed, direction, and height all at the same time.',
    wonderQuestion: 'I wonder why our ears feel funny on airplanes?',
  },
];

const TIMES = ['morning', 'afternoon', 'evening'];

function hashString(value: string): number {
  return Array.from(value).reduce((total, char, index) => {
    return total + char.charCodeAt(0) * (index + 1);
  }, 0);
}

function pickItem<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

function uppercaseFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function personalize(value: string, childName: string): string {
  return value.replaceAll('Anvita', childName);
}

export function generateDummyStory(
  question: string,
  profile: KidProfile = DEFAULT_KID_PROFILE,
): GeneratedStory {
  return toGeneratedStory(generateDummyAnswer(question, profile));
}

export function generateDummyAnswer(
  question: string,
  profile: KidProfile = DEFAULT_KID_PROFILE,
): GeneratedAnswerV1 {
  const cleanQuestion = question.trim();
  const childName = profile.childName.trim() || DEFAULT_KID_PROFILE.childName;
  const benchmark = lookupBenchmark(cleanQuestion);
  const specialExperience = getSpecialStoryExperience(cleanQuestion, childName);

  if (specialExperience) {
    return validateGeneratedAnswerV1({
      question: cleanQuestion,
      benchmark_id: specialExperience.key === 'moon-car' ? 'BQ-01' : null,
      topic: specialExperience.topic,
      fact_answer: specialExperience.fact,
      story_title: specialExperience.title,
      story_text: specialExperience.story,
      narration_text: specialExperience.narrationText,
      wonder_question: specialExperience.wonderQuestion,
      scene_tags: ['moon', 'car', 'night', 'trees', 'distance'],
      safety_flags: ['none'],
      confidence: 0.98,
    }, {
      question: cleanQuestion,
      topic: specialExperience.topic,
      source: benchmark ? 'benchmark' : 'model',
    });
  }

  const specialMatch = SPECIAL_MATCHES.find(({ match }) => match.test(cleanQuestion));
  const topic = benchmark?.expectedTopic ?? specialMatch?.topic ?? classifyTopicByKeywords(cleanQuestion);
  const script = TOPIC_LIBRARY[topic] ?? TOPIC_LIBRARY.wonder;

  if (!script) {
    throw new Error('Missing fallback wonder topic script');
  }
  const seed = hashString(cleanQuestion.toLowerCase());

  const title = personalize(specialMatch?.title ?? pickItem(script.titles, seed), childName);
  const setting = personalize(pickItem(script.settings, seed + 1), childName);
  const companion = personalize(pickItem(script.companions, seed + 2), childName);
  const sensation = personalize(pickItem(script.sensations, seed + 3), childName);
  const answer = benchmark?.coreFact ?? specialMatch?.answer ?? script.answer;
  const detail = specialMatch?.detail ?? script.detail;
  const wonderQuestion =
    specialMatch?.wonderQuestion ?? pickItem(script.wonderQuestions, seed + 4);
  const timeOfDay = pickItem(TIMES, seed + 5);

  const story = [
    `One bright ${timeOfDay}, ${childName} asked, "${cleanQuestion}" The answer was ready to show itself with a tiny pop of wonder.`,
    `${childName} stepped into ${setting}. ${uppercaseFirst(
      sensation,
    )}.`,
    `Soon, ${childName} met ${companion}, who made a silly little sound and pointed to the first clue.`,
    `${answer}`,
    `${childName} looked again and saw how the clue worked. ${detail}`,
    `Now the big question felt smaller, brighter, and easier to hold. It was like a puzzle piece clicking into place: tik!`,
    `${childName} gave a happy little spin and said, "Wow!"`,
  ].join(' ');

  return validateGeneratedAnswerV1({
    question: cleanQuestion,
    benchmark_id: null,
    topic,
    fact_answer: answer,
    story_title: title,
    story_text: story,
    narration_text: `${answer} ${detail} ${childName} found the answer by following one bright clue at a time.`,
    wonder_question: wonderQuestion.startsWith('I wonder')
      ? wonderQuestion
      : `I wonder ${wonderQuestion}`,
    scene_tags: benchmark?.sceneTags ?? [
      topic,
      ...setting.split(/\s+/).slice(0, 3),
      ...cleanQuestion.toLowerCase().split(/\s+/).slice(0, 3),
    ],
    safety_flags: ['none'],
    confidence: benchmark || specialMatch ? 0.9 : 0.78,
  }, {
    question: cleanQuestion,
    topic,
    source: benchmark ? 'benchmark' : 'model',
  });
}
