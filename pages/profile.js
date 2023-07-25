import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Flex, Card, TextField, Heading, Button, Text } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { getUserDetail } from '../utils/Device';
import { TopicClient, CacheClient, CredentialProvider, Configurations, CollectionTtl } from '@gomomento/sdk-web';
import { getAuthToken } from '../utils/Auth';
import short from 'short-uuid';

const ProfilePage = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [id, setId] = useState(short.generate());

  useEffect(() => {
    const user = getUserDetail();
    if(user){
      setEmail(user.email);
      setUsername(user.username);
      if(user.id){
        setId(user.id);
      }
    }
  }, []);

  const handleSave = async () => {
    const user = { username, email, id };
    localStorage.setItem('user', JSON.stringify(user));

    const token = await getAuthToken();
    const cacheClient = new CacheClient({
      configuration: Configurations.Browser.latest(),
      credentialProvider: CredentialProvider.fromString({ authToken: token }),
      defaultTtlSeconds: 43200 // 12 hours
    });    

    await cacheClient.dictionarySetField('conference', 'participants', id, username, { ttl: new CollectionTtl(43200)});
    const topicClient = new TopicClient({
      configuration: Configurations.Browser.latest(),
      credentialProvider: CredentialProvider.fromString({ authToken: token })
    });
    await topicClient.publish('conference', 'leaderboard', id);

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
            <Text fontSize=".9rem"><i>To make sure you get credit for your effort, please enter a display name and optional email address.</i></Text>
            <TextField label="Display Name" name="userName" required value={username} onChange={(e) => setUsername(e.target.value)} />
            <TextField label="Email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button variation="primary" onClick={handleSave} width="25%">Save</Button>
          </Flex>
        </Card>
      </Flex>      
    </>
  );
};

export default ProfilePage;

