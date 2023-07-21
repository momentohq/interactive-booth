import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Flex, Card, TextField, Heading, Button, Text } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { getUserDetail, getDeviceId } from '../utils/Device';

const ProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userDetail = getUserDetail();
    if (!userDetail) {
      router.push(`/profile?redirect=${encodeURIComponent(router.pathname)}`);
    } else {
      setUser(userDetail);
    }
  }, []);
 

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

