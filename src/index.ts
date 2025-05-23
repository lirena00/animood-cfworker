import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();

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

export default app;
