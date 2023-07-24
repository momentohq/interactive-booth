import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Flex, Card, Heading, Button, Text, Image } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { TopicClient, CacheClient, CredentialProvider, Configurations, CacheGet } from '@gomomento/sdk-web';
import { getAuthToken } from '../utils/Auth';
import { getUserDetail } from '../utils/Device';
import { toast } from 'react-toastify';

const RacerPage = () => {
  const router = useRouter();
  const [topicClient, setTopicClient] = useState(null);
  const [isRaceActive, setIsRaceActive] = useState(false);

  useEffect(() => {
    const setupTopicClient = async () => {
      const authToken = await getAuthToken();
      topicClient = new TopicClient({
        configuration: Configurations.Browser.latest(),
        credentialProvider: CredentialProvider.fromString({ authToken })
      });

      setTopicClient(topicClient);

      const cacheClient = new CacheClient({
        configuration: Configurations.Browser.latest(),
        credentialProvider: CredentialProvider.fromString({ authToken }),
        defaultTtlSeconds: 60
      });

      const raceStatusResponse = await cacheClient.get('conference', 'race');
      if (raceStatusResponse instanceof CacheGet.Hit) {
        setIsRaceActive(raceStatusResponse.valueString() == "true");
      }
    };

    const user = getUserDetail();
    if (!user) {
      router.push('/profile?redirect=/racer');
    } else {
      setupTopicClient();
    }
  }, []);

  useEffect(() => {
    const subscribeForUpdates = async () => {
      await topicClient.subscribe('conference', 'race', {
        onItem: (data) => { setIsRaceActive(data.value() == 'true') },
        onError: (err) => {
          console.error(e.errorCode(), e.message());
          toast.error('Failed to get race details', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
        }
      });
    };

    if (topicClient) {
      subscribeForUpdates();
    }
  }, [topicClient]);

  const moveRacer = async (racer) => {
    await topicClient.publish('conference', 'racer', racer);
  };

  return (
    <>
      <Head>
        <title>Race | Momento</title>
      </Head>
      <Flex direction="column" width="100%" alignItems="center" marginTop="1em">
        <Card variation="elevated" borderRadius="large" padding="1.5em 3em" width="90%">
          <Flex direction="column" gap="1em" alignItems="center">
            <Heading level={4} textAlign="center">{isRaceActive ? 'Press your racer as fast as you can!' : 'Waiting for race to start'}</Heading>
            <Text fontSize=".9rem" textAlign="center"><i>{!isRaceActive ? 'When the race starts, press the button for your racer as fast as you can!' : 'Now is your chance, press the button! Go! Go! Go!'}</i></Text>
            <Flex direction="row" gap="1em" wrap="wrap" alignItems="center" justifyContent="center">
              <Button isDisabled={!isRaceActive} variation="link" name="superMo" onClick={(e) => moveRacer(e.target.name)} >
                <Image name="superMo" src="/mo-profile.png" width="45%" borderRadius="50%" boxShadow="large" />
              </Button>
              <Button isDisabled={!isRaceActive} variation="link" name="fauxMo" onClick={(e) => moveRacer(e.target.name)} >
                <Image name="fauxMo" src="/faux-mo-profile.png" width="45%" borderRadius="50%" boxShadow="large" />
              </Button>
              <Button isDisabled={!isRaceActive} variation="link" name="ko" onClick={(e) => moveRacer(e.target.name)} >
                <Image name="ko" src="/ko-profile.png" width="45%" borderRadius="50%" boxShadow="large" />
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </>
  );
};

export default RacerPage;

