# Wonder Journal V1 Product Spec

## 1. Product Thesis

Wonder Journal is a child-friendly curiosity product for ages 3-6.

Its core job is simple:

- a child asks a real question in their own voice
- the app answers with a short, trustworthy, age-appropriate explanation
- the explanation is delivered as a magical story moment with narration and visuals
- the answer ends with one more "I wonder..." prompt to keep curiosity alive

The product is not a chatbot and not just a story generator.
It is a curiosity ritual for parent-child use.

## 2. Why This Product Should Exist

Young children ask constant "why" and "how" questions, but parents often do not have:

- the exact explanation ready
- the energy to answer beautifully every time
- the confidence to simplify without being wrong

Wonder Journal helps in that gap.

It gives families:

- trustworthy explanations
- a repeatable emotional ritual
- a record of what the child has wondered about over time

The strongest product belief is:

> Curiosity is a learning habit, and families need a better way to honor it in real life.

## 3. User Personas

### Parent

Primary needs:

- help answering hard kid questions well
- a safe, calm, age-appropriate experience
- low setup and low friction
- confidence that the content is accurate
- a way to revisit meaningful past questions

Pain points:

- "I do not know how to explain this"
- "I do not want to hand my kid open internet search"
- "I do not want a boring educational app or a chaotic kids app"

### Kid

Primary needs:

- ask questions naturally
- get delightful answers fast
- feel seen and engaged
- hear, see, and understand the answer
- keep asking

Pain points:

- long explanations
- boring interfaces
- too much text
- unclear interactions

## 4. Jobs To Be Done

### Functional Job

When my child asks a question I cannot answer well in the moment, help me deliver a beautiful, understandable explanation quickly.

### Emotional Job

Help me feel like I am nurturing my child's curiosity rather than shutting it down.

### Social Job

Help me be the kind of parent who treats my child's wonder seriously.

## 5. Core Value Proposition

For parents of children ages 3-6, Wonder Journal is a voice-first curiosity companion that turns real kid questions into short, trustworthy, story-led explanations with narration and visuals, so no little question goes unanswered.

## 6. Positioning

Wonder Journal should sit between:

- open-ended kids play apps
- generic AI chatbots
- bedtime story apps
- educational Q&A tools

It is not:

- a school product first
- a broad chatbot for children
- a passive content library
- a long-form storybook generator

It is:

- a question-to-explanation ritual
- for everyday curiosity moments
- designed for co-use by parent and child

## 7. V1 Product Scope

### In Scope

- family setup
- one child profile
- guide selection: Gargi or Nachi
- voice question input
- typed fallback input
- one generated answer experience per question
- short narration
- a follow-up wonder question
- local journal/history
- static image library matching
- local-first runtime with Ollama

### Out of Scope

- multi-child household management
- school mode
- social sharing
- community content
- long-form multi-page books
- open browsing
- general-purpose kid assistant features
- subscription/payments

## 8. Product Principles

1. Trust beats magic.
If the answer is beautiful but wrong, the product fails.

2. Child-facing surfaces must stay simple.
One dominant action per screen.

3. Parent control should be present but quiet.
The child should not see a dashboard.

4. Story is the wrapper, not the point.
The point is understanding.

5. Every answer should keep curiosity going.
End with one strong follow-up wonder.

6. Fast matters.
The answer should feel available in under a minute.

## 9. User Journey

### First-Time Parent Journey

1. Parent opens Wonder Journal
2. Enters parent name and child name
3. Chooses age and guide
4. Learns, briefly, why Gargi and Nachi were chosen
5. Enables microphone
6. Lands on signed-in home
7. Invites child to ask a question

### First-Time Kid Journey

1. Child sees a magical home screen
2. Child taps the wand or mic
3. Child asks a question
4. App listens
5. App thinks briefly
6. Story answer appears with image, narration, and fact
7. App asks one more "I wonder..." question

### Returning Journey

1. Open app
2. Land directly on home screen
3. Ask new question or revisit journal

## 10. Core Product Loop

1. Ask
2. Explain
3. Delight
4. Follow up
5. Save
6. Return

This loop matters more than any single feature.

## 11. V1 Experience Architecture

### Screen 1: Setup

Collect:

- parent name
- child name
- child age

Goal:

- make setup feel warm and lightweight

### Screen 2: Guide Selection

Choices:

- Gargi
- Nachi

Goal:

- make the product feel rooted, thoughtful, and culturally intentional

### Screen 3: Ready / Microphone

Goal:

- get permission and move quickly into use

### Screen 4: Home

Required elements:

- one big voice action
- a few great sample questions
- subtle typed input
- quiet journal access

### Screen 5: Listening / Thinking

Goal:

- turn waiting into delight

### Screen 6: Story Answer

Required elements:

- question
- short fact answer
- visual scene
- short story text
- narration
- one follow-up wonder

### Screen 7: Journal

Goal:

- let parents revisit past wonders

## 12. The Actual Wedge

The strongest wedge is not "AI stories for kids."

The strongest wedge is:

> real child questions -> trustworthy short explanations -> emotionally memorable delivery

That is much sharper than:

- generic storytelling
- generic AI tutoring
- generic kids education

## 13. V1 Benchmark Question Set

These questions should be used as the first quality bar.

### Space

- Why does the moon follow our car?
- Why do stars twinkle?
- Why does the moon change shape?
- Why is the sky dark at night?

### Weather / Nature

- Why do peacocks dance in the rain?
- Where does the rain go after a storm?
- Why do rainbows have colors?
- Why does thunder come after lightning?

### Body

- Why do we get hiccups?
- Why do our hearts beat faster when we run?
- Why do we need sleep?
- Why do tears come out when we cry?

### Animals

- Why do butterflies have colors?
- Why do birds fly in a V?
- Why do cats purr?
- Why do elephants have trunks?

### Everyday Science

- Why does ice melt?
- Why does popcorn pop?
- Why do shadows move?
- Why do bubbles shine with many colors?

Each benchmark question needs:

- correct fact explanation
- allowed simplification
- blocked simplifications
- story angle
- scene tags
- follow-up wonder

## 14. LLM Product Contract

The model should not write the whole UI experience freely.

It should return a strict schema that the app controls.

### Suggested Schema

```json
{
  "question": "Why does the moon follow our car?",
  "topic": "space",
  "fact_answer": "The moon is so far away that it seems to stay with us while nearby things move quickly past.",
  "story_title": "The Moon Outside the Window",
  "story_text": "A short 120-180 word child-friendly story.",
  "narration_text": "A shorter spoken version optimized for read aloud.",
  "wonder_question": "I wonder why the moon looks bigger near the horizon?",
  "scene_tags": ["moon", "car", "night", "trees", "distance"],
  "safety_flags": [],
  "confidence": 0.92
}
```

### Required Rules

- fact answer must be true
- story must stay age-appropriate
- narration must be shorter than the story
- wonder question must invite continued inquiry
- scene tags must support image matching
- output must be JSON only

## 15. Answer System Design

The product should be built as a pipeline, not a single prompt.

### Recommended Flow

1. Classify question topic
2. Retrieve benchmark guidance if question is in known set
3. Generate structured answer
4. Validate schema
5. Run safety checks
6. Match scene/image
7. Save result
8. Render experience

### For Harder Accuracy

Use a hybrid answer strategy:

- benchmark answers for common questions
- model generation for long-tail questions
- fallback to parent-safe retry if confidence is low

## 16. Trust and Safety Requirements

### Content Safety

- no scary or violent content
- no age-inappropriate detail
- no medical or scientific fabrication
- no emotionally destabilizing language

### Product Safety

- no open web access for the child
- no ads
- no random external content
- parent-visible history

### Behavioral Safety

- avoid pretending certainty where the model is unsure
- prefer simple truth over magical nonsense
- if uncertain, use a graceful fallback

## 17. Image Strategy

Do not build the image system as a pile of random assets.

Build it as a reusable scene library.

### V1 Image Library Plan

Start with 30-50 reusable scenes across major topics.

Each scene should have:

- image path
- topic
- scene tags
- mood
- action tags
- palette/style family

### Example Scene Entries

- `night-drive-moon`
- `rainy-peacock-field`
- `sleepy-child-stars`
- `garden-butterfly-closeup`
- `rainbow-after-rain`

### V1 Recommendation

- begin with a tightly curated static library
- use one art direction only
- add more only after the first experience is working

## 18. Voice and Narration Strategy

Voice is central to the product.

### V1

- browser speech recognition for input
- browser speech synthesis for narration

### Later

- better child-friendly narration voices
- guide-specific narration tone
- optional parent voice cloning or familiar narrator voice

## 19. Success Metrics

### Product Metrics

- question-to-answer completion rate
- median time to first answer
- repeat questions per family per week
- narration play rate
- journal revisit rate

### Quality Metrics

- factual correctness score on benchmark set
- parent trust score
- child delight score
- story relevance score
- image match quality score

### Early Validation Metrics

- "Would you use this weekly?" %
- "Would your child ask again?" %
- "Did this answer help you?" %

## 20. What Must Be Tested With Real Families

Test with at least 5-10 parents and children on:

- one first-time onboarding session
- one benchmark science question
- one repeat use session
- one failed or confusing answer case

Questions to ask:

- Did the answer feel right?
- Was it too long?
- Did the child stay engaged?
- Did the parent trust it?
- Would they use it again in real life?

## 21. Phased Roadmap

### Phase 0: Prototype Quality Bar

Goal:

- prove one golden-path experience is good

Build:

- 3-5 polished benchmark questions
- static image scenes
- narration
- onboarding

### Phase 1: V1 Local Product

Goal:

- reliable home use with Ollama

Build:

- 25-50 benchmark questions
- structured LLM contract
- local evaluation harness
- stronger scene library
- basic journal

### Phase 2: Trust and Depth

Goal:

- make quality reliable enough for regular family use

Build:

- confidence/fallback handling
- better voice
- stronger image matching
- guide-specific narration styles

### Phase 3: Broader Productization

Goal:

- package for wider consumer use

Build:

- app version
- account system
- multiple children
- analytics
- payments

## 22. Biggest Risks

### 1. Wrong Answers

This is the biggest product risk.

Mitigation:

- benchmark set
- structured schema
- evaluation before expansion

### 2. Novelty Without Habit

If families use it twice and stop, the product is weak.

Mitigation:

- optimize for repeated daily-life questions
- make speed and delight strong

### 3. Inconsistent Visual Style

If the image library feels random, the app feels cheap.

Mitigation:

- one reusable art direction

### 4. Overbuilding Too Early

Too many features will blur the value.

Mitigation:

- stay focused on the curiosity loop

## 23. Immediate Next Steps

### Product

- finalize the v1 benchmark question set
- define the fact answer for each benchmark question
- decide the target session length
- decide whether the product is more "night ritual" or "everyday question helper"

### Content

- write benchmark truth notes
- write benchmark narration notes
- define scene tags for each benchmark question

### AI / Engineering

- change generation to a structured JSON contract
- add answer validation
- add low-confidence fallback behavior
- separate benchmark mode from long-tail generation mode

### Design

- lock one art direction
- design the story answer screen as the product centerpiece
- create the first 30-50 scene library plan

### User Research

- run parent interviews
- run 5-10 family sessions on the benchmark flow

## 24. Open Questions

- Is the primary use case bedtime, commute, or anytime curiosity?
- Should the answer feel more "storybook" or more "explain-like-I-am-4"?
- How much should Gargi and Nachi influence the narration style?
- Should journal be parent-facing only, or visible to the child too?
- When the app is uncertain, should it retry silently or tell the parent?

## 25. Current Recommendation

The right next move is not to expand the feature set.

The right next move is to lock one narrow quality bar:

- 25 benchmark questions
- one structured generation contract
- one reusable scene system
- one repeatable parent-child ritual

If that works, Wonder Journal has real product merit.
If it does not, more features will not save it.
