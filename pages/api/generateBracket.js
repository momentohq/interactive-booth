const { CacheClient, Configurations, CredentialProvider, CacheSetFetch } = require('@gomomento/sdk');
const { getBracket, resetBracket } = require('../../utils/Bracket');
let cacheClient;

export default async function handler(req, res) {
  try {
    await initializeMomento();
    const participants = await cacheClient.setFetch('conference', 'bracket-participants');
    if (participants instanceof CacheSetFetch.Hit) {
      await resetBracket(cacheClient);
      let round = 0;
      let seed = 0;
      let grouping = [];
      for (const participant of participants.valueArrayString()) {
        grouping.push(participant);
        if (grouping.length == 3) {
          await cacheClient.setAddElements('conference', `${round}.${seed}`, grouping);
          await cacheClient.setAddElement('conference', 'brackets', `${round}.${seed}`);
          seed += 1;
          grouping = [];
        }
      };
      if (grouping.length) {
        await cacheClient.setAddElements('conference', `${round}.${seed}`, grouping);
        await cacheClient.setAddElement('conference', 'brackets', `${round}.${seed}`);
      }
    }
    const bracket = await getBracket(cacheClient);
    return res.status(200).json(bracket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};


const initializeMomento = async () => {
  if (cacheClient) {
    return;
  }

  cacheClient = new CacheClient({
    configuration: Configurations.Laptop.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({ environmentVariableName: 'MOMENTO_AUTH' }),
    defaultTtlSeconds: 3300
  });
};