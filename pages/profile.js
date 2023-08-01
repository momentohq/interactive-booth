import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Flex, Card, TextField, Heading, Button, Text } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { getUserDetail } from '../utils/Device';
import { TopicClient, CacheClient, CredentialProvider, Configurations, CollectionTtl } from '@gomomento/sdk-web';
import { getAuthToken } from '../utils/Auth';

const ProfilePage = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [oldUsername, setOldUsername] = useState('');
  const [isPopupVisible, setPopupVisible] = useState(false);

  useEffect(() => {
    const user = getUserDetail();
    if (user) {
      setUsername(user.username);
      setOldUsername(user.username);
    }
  }, []);

  const handleSave = async () => {
    if (!oldUsername || oldUsername == username) {
      saveUser();
    } else {
      setPopupVisible(true);
    }
  };

  const saveUser = async () => {
    const user = { username };
    localStorage.setItem('user', JSON.stringify(user));

    const token = await getAuthToken();
    const cacheClient = new CacheClient({
      configuration: Configurations.Browser.latest(),
      credentialProvider: CredentialProvider.fromString({ authToken: token }),
      defaultTtlSeconds: 32400 // 9 hours
    });

    if (oldUsername) {
      await cacheClient.sortedSetRemoveElement('conference', 'leaderboard', oldUsername);
      await cacheClient.delete('conference', oldUsername);
      const topicClient = new TopicClient({
        configuration: Configurations.Browser.latest(),
        credentialProvider: CredentialProvider.fromString({ authToken: token })
      });
      await topicClient.publish('conference', 'leaderboard', username);
    }

    if (router.query.redirect) {
      router.push(router.query.redirect);
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <Head>
        <title>Profile | Momento</title>
      </Head>
      <Flex direction="column" width="100%" alignItems="center" marginTop="1em">
        <Card variation="elevated" borderRadius="large" padding="1.5em 3em" width="90%">
          <Flex direction="column" gap="1em">
            <Heading level={4}>Enter Your Info</Heading>
            <Text fontSize=".9rem"><i>To make sure you get credit for your effort, please enter your first and last name</i></Text>
            <TextField label="Display Name" name="userName" placeholder='First and last name' required value={username} onChange={(e) => setUsername(e.target.value)} />
            <Button variation="primary" onClick={handleSave} width="25%">Save</Button>
          </Flex>
        </Card>
      </Flex>
      {isPopupVisible && (
        <Card variation="outlined" boxShadow="large" borderRadius='large' width="80%" position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" style={{ zIndex: 1000 }}>
          <Flex direction="column" width="100%" justifyContent="center">
            <Text>If you change your name, you will be removed from the leaderboard and will have to start over.</Text>
            <Text>Do you want to continue?</Text>
            <Flex direction="row" justifyContent="space-between">
              <Button variation="warning" onClick={() => setPopupVisible(false)}>No</Button>
              <Button variation="primary" onClick={() => saveUser()}>Yes</Button>
            </Flex>
          </Flex>
        </Card>
      )}
    </>
  );
};

export default ProfilePage;