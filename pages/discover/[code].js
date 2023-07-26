import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { TopicClient, CacheClient, CredentialProvider, Configurations, CacheSetFetch, CollectionTtl } from '@gomomento/sdk-web';
import { Flex, Card, Text, Loader, Image, Heading } from '@aws-amplify/ui-react';
import { getAuthToken } from '../../utils/Auth';
import { getUserDetail, generateUserId } from '../../utils/Device';
import { toast } from 'react-toastify';

const DiscoverPage = () => {
  const validCodes = ['St9Eb2', 'Xy8Gn2', 'Qp4Jm9', 'Kd7Fp5', 'Ht2Sn6', 'Rf3Gk8', 'Wv6Px4', 'Mj5Lr9', 'Nq9Dt2', 'Zb1Cf7', 'Vg4Hs6', 'Yt7Kx3', 'Pl6Nv9', 'Bf2Rt5', 'Uj3Qw8', 'Ec9Am4', 'Lm8Yx3', 'Go5Vr9', 'Zp3Tk6', 'Qw1Ad7', 'Xc4Fu2'];
  const router = useRouter();
  const { code } = router.query;
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (code) {
      const userDetail = getUserDetail();
      if (!userDetail) {
        router.push(`/profile?redirect=/discover/${code}`);
      } else {
        if(!userDetail.id){
          const id = generateUserId();
          userDetail.id = id;
        }
        setUser(userDetail);
      }
    }
  }, [code]);

  useEffect(() => {
    async function validateCodeAgainstUser() {
      if (!validCodes.includes(code)) {
        setMessage("Not sure how you got here, but it's not quite right. Keep hunting!");
        setTitle("Who let you in here?");
        setIsSuccess(false);
        setIsLoaded(true);
        return;
      }

      const token = await getAuthToken();

      const cacheClient = new CacheClient({
        configuration: Configurations.Browser.latest(),
        credentialProvider: CredentialProvider.fromString({ authToken: token }),
        defaultTtlSeconds: 43200 // 12 hours
      });

      const setFetchResponse = await cacheClient.setFetch('conference', user.id);
      // update users in the dictionary with the correct username
      await cacheClient.dictionarySetField('conference', 'participants', user.id, user.username, { ttl: new CollectionTtl(43200)});
      if (setFetchResponse instanceof CacheSetFetch.Hit) {
        const foundCodes = setFetchResponse.valueArrayString();
        if (foundCodes.includes(code)) {
          setMessage("Nice work! You found one of the codes! Think you can find some more?");
          setTitle("Hooray!")
          setIsSuccess(true);
          setIsLoaded(true);
          return;
        }
      } else if (setFetchResponse instanceof CacheSetFetch.Error) {
        console.error(setFetchResponse.errorCode(), setFetchResponse.message());
        toast.error('Uh oh, something went wrong', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
        setIsLoaded(true);
        return;
      }

      await cacheClient.setAddElement('conference', user.id, code, { ttl: new CollectionTtl(43200) });
      await cacheClient.sortedSetIncrementScore('conference', 'leaderboard', user.id, 1, { ttl: new CollectionTtl(43200) });

      const topicClient = new TopicClient({
        configuration: Configurations.Browser.latest(),
        credentialProvider: CredentialProvider.fromString({ authToken: token })
      });

      await topicClient.publish('conference', 'leaderboard', user.id);
      setMessage('Nice work! You found one of the codes! Think you can find some more?');
      setTitle("Hooray!");
      setIsSuccess(true);
      setIsLoaded(true);
    }

    if (code && user) {
      validateCodeAgainstUser();
    }

  }, [code, user]);

  return (
    <>
      <Head>
        <title>Check Scan | Momento</title>
      </Head>
      <Flex direction="column" width="100%" alignItems="center">
        <Card variation="elevated" borderRadius="large" padding="1.5em 3em" width="90%">
          <Flex direction="column" alignItems="center" gap="1em">
            {isLoaded && (<Heading level={4}>{title}</Heading>)}
            {isLoaded && (<Text textAlign="center">{message}</Text>)}
            {(!isSuccess && isLoaded) && (<Image src="/mo-sad.png" width="10em" />)}
            {(isSuccess && isLoaded) && (<Image src="/mo-success.png" width="10em" />)}
            {!isLoaded && (<Loader size="4em" />)}
          </Flex>
        </Card>
      </Flex>
    </>
  );
};

export default DiscoverPage;
