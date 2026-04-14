import OpenAI from 'openai';

let _openai;
export function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function generatePropertyTitleAndDescription(data) {
  const { propertyType, address, bedrooms, bathrooms, squareFeatures, features, price } = data;

  const messages = [
    { role: 'system', content: 'You generate listing titles and descriptions for Premarket, an Australian pre-market property platform. Listings are designed to attract buyer price opinions and registered interest before the property goes to market. Write concise, engaging copy. Never include the street address or price. Focus on the property\'s appeal and invite buyers to submit their price opinion.' },
    { role: 'user', content: `Property details — Type: ${propertyType}, Area: ${address}, Bedrooms: ${bedrooms}, Bathrooms: ${bathrooms}, Size: ${squareFeatures || 'N/A'}sqm, Features: ${(features || []).join(', ') || 'None specified'}. Generate a short punchy title (under 10 words) and a description (2-3 sentences). The description should highlight what makes this property appealing and encourage buyers to register their interest or submit a price opinion. Do NOT use generic real estate clichés. Do NOT include the street address or price.` },
  ];

  const tools = [
    {
      type: 'function',
      function: {
        name: 'capturePropertyDetails',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['title', 'description'],
        },
      },
    },
  ];

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools,
    tool_choice: { type: 'function', function: { name: 'capturePropertyDetails' } },
  });

  return JSON.parse(completion.choices[0].message.tool_calls[0].function.arguments);
}
