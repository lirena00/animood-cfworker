import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

app.get("/", async (c) => {
  const mood = c.req.query("mood");

  if (!mood) {
    return c.json({ error: "Mood parameter is required" }, 400);
  }

  const content = `
# Role and Objective
You are an AI specializing in mood analysis and anime recommendations. Your task is to analyze a user's mood input, determine their dominant emotional state, and return an anime recommendation in the form of a genre and a tag.

# Instructions
- Only select genres from this list: [Action, Adventure, Comedy, Drama, Ecchi, Fantasy, Horror, Mahou Shoujo, Mecha, Music, Mystery, Psychological, Romance, Sci-Fi, Slice of Life, Sports, Supernatural, Thriller]
- Only select tags from this list: ["Age Regression", "Aliens", "Amnesia", "Angels", "Chuunibyou", "Cosplay", "Delinquents", "Dissociative Identities", "Dragons", "Fairy", "Gods", "Kuudere", "Maids", "Nekomimi", "Ninja", "Nudity", "Orphan", "Pirates", "Robots", "Samurai", "Tsundere", "Vampire", "Werewolf", "Witch", "Yandere", "Zombie", "Josei", "Kids", "Seinen", "Shoujo", "Shounen", "Dystopian", "Historical", "Time Skip", "Post-Apocalyptic", "Space", "Archery", "Martial Arts", "Swordplay", "Parody", "Satire", "Slapstick", "Surreal Comedy", "Coming Of Age", "Conspiracy", "Kingdom Management", "Rehabilitation", "Revenge", "Suicide", "Tragedy", "Alchemy", "Cultivation", "Isekai", "Magic", "Mythology", "Necromancy", "Super Power", "Acrobatics", "American Football", "Athletics", "Badminton", "Baseball", "Basketball", "Boxing", "Cheerleading", "Cycling", "Football", "Swimming", "Volleyball", "Wrestling", "Animals", "Astronomy", "Crime", "Death Game", "Gambling", "Gore", "Lost Civilization", "Medicine", "Pandemic", "Philosophy", "Politics", "Reincarnation", "Religion", "Royal Affairs", "Slavery", "Survival", "Terrorism", "Travel", "War", "Assassins", "Criminal Organization", "Cult", "Firefighters", "Gangs", "Mafia", "Military", "Police", "Yakuza", "Boys' Love", "Female Harem", "Love Triangle", "Male Harem", "Time Loop", "Time Manipulation", "Agriculture", "Cute Boys Doing Cute Things", "Cute Girls Doing Cute Things", "Family Life", "Horticulture", "Iyashikei"]
- Always interpret the user's text holistically and identify the dominant emotional theme.
- Understand and decode slang, emojis, expressive phrasing, and casual language.
- Do not add any additional text or explanations to your response.
- Do not invent new genres or tags; choose only from the lists.
- Return your response in valid JSON format exactly like this:

{"emotion": "<Detected Emotion>","genre": "<Suggested Genre>",tags": "<Suggested Tag>"}

# Output Format

Return only a JSON object:

* "emotion": User's emotional state as interpreted from the input.
* "genre": One genre from the list.
* "tags": One tag from the list.

# Input 
User Input: "${mood}"

# Examples

**User Input:** "ugh I feel so drained and empty 😞 nothing makes sense"
{"emotion": "Empty","genre": "Psychological","tags": "Dissociative Identities"}

**User Input:** "feelin' chaotic and reckless today 💥😈"
{"emotion": "Reckless","genre": "Action","tags": "Gangs"}

**User Input:** "Just wanna curl up with something wholesome 🥺💗"
{"emotion": "Comfort-Seeking","genre": "Slice of Life","tags": "Iyashikei"}

**User Input:** "😎😎😶"
{"emotion": "Cool and Unbothered", "genre": "Action", "tags": "Assassins"}



  `;
  const result = await c.env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", {
    messages: [{ role: "user", content: content }],
  });
  // Extract only the response content from the result
  return c.json(JSON.parse((result as any).response));
});

app.get("/aud", async (c) => {
  const audiourl = c.req.query("audiourl") ?? "";

  const res = await fetch(audiourl.toString());
  const blob = await res.arrayBuffer();

  const base64 = arrayBufferToBase64(blob);

  const results = await c.env.AI.run("@cf/openai/whisper-large-v3-turbo", {
    audio: base64,
    language: "en",
  });

  return c.json({ text: results.text });
});

app.get("/fol", async (c) => {
  const stuff = c.req.query("stuff");

  if (!stuff) {
    return c.json({ error: "stuff parameter is required" }, 400);
  }
  // const stuff = {
  //   idea: "the most common obstacles that people actually face is the ability to do it, people fear it because they see it as challenge but they are not aware that it takes only half actual effort and twice the emotional effort, it's that emotional effort that is actually hard",
  //   followup: [
  //     "How can the concept of iteration be applied to different areas of life, such as business or personal growth?",
  //     "What are some common obstacles that prevent people from iterating and improving their ideas?",
  //     "Can you think of any examples of successful projects or products that have used iteration to achieve significant breakthroughs?",
  //     "How do you think the concept of iteration can be used to overcome initial failures or setbacks in different areas of life?",
  //     "Can you think of a specific instance where iteration led to significant improvement or success?",
  //     "What are some potential drawbacks or limitations of relying on iteration to achieve progress or mastery?",
  //   ],
  //   title: "The Power Of Iterations",
  // };
  const content = `
# Role and Objective
You help users improve their raw ideas (usually spoken transcriptions) by:
1. Generating a creative title (if not provided).
2. Cleaning up the transcription (punctuation, grammar, remove filler words).
3. Asking 3 thoughtful, non-repetitive follow-up questions.

# Instructions
- Always return all 3 outputs: 'title', 'refined_transcription', 'followup'.
- Do not add any additional text or explanations to your response.
- Title: Only generate if missing. Make it short, creative, and idea-specific.
- Refined Transcription: Fix grammar and punctuation. Remove filler words or pauses (e.g., "uh", "like", "you know", "umm" ). Do **not** change meaning, structure, or word choice otherwise.
- Follow-up Questions:
  - Ask 3 open-ended, fresh questions to deepen or challenge the idea.
  - Avoid yes/no phrasing and repetition.
  - If a list of 'previous_questions' is provided, ensure your new ones are not duplicates.
  - Use 'hint' (if given) to guide topical relevance (e.g., “startup”, “sci-fi”, etc.).

# Input Format
{"title": "optional","idea": "required raw idea","previous_questions": ["optional list"],"hint": "optional tag"}

# Output Format
{"title": "Final title","refined_transcription": "Grammar-fixed idea","followup": ["Question 1","Question 2","Question 3"]}

# Input 

**User Input:** ${JSON.stringify(stuff)}

# Example

**Input:**
{idea": "uh so maybe there's this app that like pays people to walk dogs you know and eh maybe like tracks it with gps or something"}

**Output:**
{"title": "The Dog-Walker’s Payday","refined_transcription": "So maybe there's this app that pays people to walk dogs, and maybe it tracks it with GPS or something.", "followup": ["What kind of rewards would be meaningful and sustainable for users?","How will the app verify that a real dog walk is taking place?","What long-term impact could this have on pet care or community health?"]}

  `;
  const result = await c.env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", {
    messages: [{ role: "user", content: content }],
    max_tokens: 1024,
  });
  // console.log(result);
  return c.json(JSON.parse((result as any).response));
  // return c.json(result);
});

export default app;

// @cf/meta/llama-3.3-70b-instruct-fp8-fast
