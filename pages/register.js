import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Flex, Card, Heading, Text, Image, Loader } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { CacheClient, CredentialProvider, Configurations, CacheSetAddElement, CollectionTtl } from '@gomomento/sdk-web';
import { getAuthToken } from '../utils/Auth';
import { getUserDetail } from '../utils/Device';

const RacerPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const register = async (username) => {
      const authToken = await getAuthToken();
      const cacheClient = new CacheClient({
        configuration: Configurations.Browser.latest(),
        credentialProvider: CredentialProvider.fromString({ authToken }),
        defaultTtlSeconds: 32400 // 9 hours
      });
      const response = await cacheClient.setAddElement('conference', 'bracket-participants', username, { ttl: new CollectionTtl(32400) });
      if (response instanceof CacheSetAddElement.Error) {
        console.error(response.errorCode, response.message);
        setIsSuccess(false);
        setTitle('Uh oh');
        setMessage('Something went wrong. Try refreshing the page.');
      } else {
        setIsSuccess(true);
        setTitle('We got you.');
        setMessage("You're all registered for the race! Wait for your name to be called and good luck!")
      }
      setIsLoading(false);
    };

    const user = getUserDetail();
    if (!user) {
      router.push('/profile?redirect=/register');
    } else {
      register(user.username);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Register | Momento</title>
      </Head>
      <Flex direction="column" width="100%" alignItems="center">
        <Card variation="elevated" borderRadius="large" padding="1.5em 3em" width="90%">
          <Flex direction="column" alignItems="center" gap="1em">
            {!isLoading && (
              <>
                <Heading level={4}>{title}</Heading>
                <Text textAlign="center">{message}</Text>
                {!isSuccess && (<Image src="/mo-sad.png" width="10em" />)}
                {isSuccess && (<Image src="/mo-success.png" width="10em" />)}
              </>
            )}
            {isLoading && (<Loader size="large" />)}
          </Flex>
        </Card>
      </Flex>
    </>
  );
};

export default RacerPage;

