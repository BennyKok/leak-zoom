// IMPORTANT! Set the runtime to edge
// export const runtime = 'edge'

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  return v2(req);
  // return v1(req)
}

let sam_url = process.env.SAM_URL!;
let elon_url = process.env.ELON_URL!;
let steve_url = process.env.STEVE_URL!;

async function message(
  topic: string,
  opponents: string,
  context: string,
  url: string,
) {
  console.log(url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.REBYATE_API,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'latest',
      config: {
        MODEL_1: {
          provider_id: 'openai',
          model_id: 'gpt-4-1106-preview',
          use_cache: true,
          use_semantic_cache: false,
        },
        YOU_COM_SEARCH_1: {
          input_args: [
            {
              name: 'query',
              type: 'string',
              required: true,
              description: 'search query',
              value: '{{CODE_1.argument}}',
            },
          ],
          use_cache: true,
        },
        OUTPUT_STREAM: {
          provider_id: 'openai',
          model_id: 'gpt-4-1106-preview',
          use_cache: true,
        },
      },
      blocking: true,
      inputs: [
        {
          messages: [
            {
              topic: topic,
              opponents: opponents,
              context: context,
            },
          ],
        },
      ],
    }),
  });

  return response;
}

async function v2(req: Request) {
  let { context, agentId, topic, numberOfAgent } = await req.json();

  if (!topic) topic = 'Sam Altman got fired from OpenAI';
  if (numberOfAgent === undefined) numberOfAgent = 2;

  function getOpponentName(agentId: string, numberOfAgent: number) {
    let opponent = '';
    if (numberOfAgent === 2) {
      opponent = agentId === '1' ? 'Sam Altman' : 'Elon Musk';
    } else if (numberOfAgent === 3) {
      const opponents = ['Elon Musk', 'Sam Altman', 'Steve Job'];
      opponent = opponents[Math.floor(Math.random() * opponents.length)];
    }
    return opponent;
  }

  let url = '';
  let agentName = '';
  let opponent = '';

  if (agentId === '1') {
    url = elon_url;
    agentName = 'Elon Musk';
  } else if (agentId === '2') {
    url = sam_url;
    agentName = 'Sam Altman';
  } else if (agentId === '3') {
    url = steve_url;
    agentName = 'Steve Job';
  }

  opponent = getOpponentName(agentId, numberOfAgent);

  console.log(agentId, topic, opponent, context, url);
  let reply = await (await message(topic, opponent, context, url)).json();
  console.log(reply);

  let content = reply['run']['results'][0][0]['value']['content'];
  context += agentName + ': ' + content + '\n';
  console.log('REPLY ' + agentName + ':' + content);
  return new Response(JSON.stringify({ message: content, context: context }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
