import OpenAI from 'openai';

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function generatePropertyTitleAndDescription(data) {
  const { propertyType, address, bedrooms, bathrooms, squareFeatures, features, price } = data;

  const messages = [
    { role: 'system', content: 'You are an assistant that generates title and description JSON for Australian pre-market properties. You are not to put in any price or street address into the title or description.' },
    { role: 'user', content: `Type: ${propertyType}, Address: ${address}, Bedrooms: ${bedrooms}, Bathrooms: ${bathrooms}, Size: ${squareFeatures}, Features: ${(features || []).join(', ')}, Price: ${price} - You are not to put in any price or street address into the title or description. Refrain from using generic text - try to be creative.` },
  ];

  const functionsDef = [
    {
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
  ];

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages,
    functions: functionsDef,
    function_call: { name: 'capturePropertyDetails' },
  });

  return JSON.parse(completion.choices[0].message.function_call.arguments);
}
