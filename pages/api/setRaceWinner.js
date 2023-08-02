const { CacheClient, Configurations, CredentialProvider } = require('@gomomento/sdk');
const { getBracket } = require('../../utils/Bracket');
let cacheClient;

export default async function handler(req, res) {
  try {
    await initializeMomento();

    const { winner, round, seed } = req.body;
    const nextSeed = Math.floor(seed / 3);
    const nextRound = round +1;
    const cacheSlot = `${nextRound}.${nextSeed}`;
    await cacheClient.setAddElement('conference', cacheSlot, winner);
    await cacheClient.setAddElement('conference', 'brackets', cacheSlot);

    const updatedBracket = await getBracket(cacheClient);
    res.status(200).json(updatedBracket);
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Something went wrong'});
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
