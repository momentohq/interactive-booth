import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Flex, Card, TextField, Heading, Button, Text } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { getUserDetail, getDeviceId } from '../utils/Device';
import { TopicClient, CacheClient, CredentialProvider, Configurations, CollectionTtl } from '@gomomento/sdk-web';
import { getAuthToken } from '../utils/Auth';

const ProfilePage = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const user = getUserDetail();
    if(user){
      setEmail(user.email);
      setUsername(user.username);
    }
  }, []);

  const handleSave = async () => {
    const deviceId = await getDeviceId();
    const user = { username, email, deviceId };
    localStorage.setItem('user', JSON.stringify(user));

    const token = await getAuthToken();
    const cacheClient = new CacheClient({
      configuration: Configurations.Browser.latest(),
      credentialProvider: CredentialProvider.fromString({ authToken: token }),
      defaultTtlSeconds: 43200 // 12 hours
    });    

    await cacheClient.dictionarySetField('conference', 'participants', deviceId, username, { ttl: new CollectionTtl(43200)});
    const topicClient = new TopicClient({
      configuration: Configurations.Browser.latest(),
      credentialProvider: CredentialProvider.fromString({ authToken: token })
    });
    await topicClient.publish('conference', 'leaderboard', deviceId);

    if (router.query.redirect) {
      router.push(router.query.redirect);
    } else {
      toast.success('Profile updated!', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' })
    }
  };

  return (
    <>
      <Head>
        <title>Profile | Momento</title>
      </Head>
      <Flex direction="column" width="100%" alignItems="center" justifyContent="center" height="90vh">
        <Card variation="elevated" borderRadius="large" padding="1.5em 3em">
          <Flex direction="column" gap="1em">
            <Heading level={4}>Enter Your Info</Heading>
            <Text fontSize=".9rem"><i>To make sure you get credit for your effort, please enter<br/>a display name and optional email address.</i></Text>
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

