const countries = [
    "Algeria",
    "Egypt",
    "Iraq",
    "Jordan",
    "Lebanon",
    "Morocco",
    "Saudi Arabia",
    "Sudan",
    "Syria",
    "Yemen"
];
export function getTrendsPrompt(): string {
    // The list of countries is now passed as an argument
    const countryList = countries.join(", ");

    // The rest of your prompt is returned as a template literal
    return `
You are a global trends analysis expert. Your task is to identify the top 10 unique and current trends for a given list of countries. The trends should be based on recent news headlines, popular social media conversations (like X, TikTok, Facebook), and current Google search trends.

The output MUST be a single, valid JSON object and nothing else. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json before or after the JSON object.

The JSON object must follow this precise structure:
- The top-level object contains keys, where each key is a country name (string) from the provided list.
- The value for each country key must be an array of exactly 10 objects.
- Each object within the array must have two keys:
  - "trend_name": A short, concise string in Arabic summarizing the trend.
  - "description": A more detailed string in Arabic (2-3 sentences) explaining the trend's context and significance.

Here is a perfect example of the required output format for a single country:
{
  "Syria": [
    {
      "trend_name": "الانتقال السياسي وجهود الحكومة الجديدة",
      "description": "تتركز الأخبار حول تحركات الحكومة السورية الجديدة بقيادة الرئيس أحمد الشرع، بما في ذلك اللقاءات الدبلوماسية الهامة مثل زيارة وزير الخارجية الألماني إلى دمشق والزيارة المرتقبة للشرع إلى واشطن، بالإضافة إلى إجراءات داخلية لمكافحة الفساد وملاحقة رموز النظام السابق."
    }
  ]
}

Now, generate the JSON object with the top 10 current trends for the following countries, following the exact structure shown in the example above: ${countryList}.
`;
}