const { CacheClient, Configurations, CredentialProvider } = require('@gomomento/sdk');
const { getBracket } = require('../../utils/Bracket');
let cacheClient;

export default async function handler(req, res) {
  try {
    await initializeMomento();

    const bracket = await getBracket(cacheClient);
    return res.status(200).json(bracket);    
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