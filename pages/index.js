import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Flex, Card, Heading, Image, Text, View } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { getUserDetail, getDeviceId } from '../utils/Device';
import { TopicClient, CacheClient, CredentialProvider, Configurations, CollectionTtl } from '@gomomento/sdk-web';
import { getAuthToken } from '../utils/Auth';
import { MdWavingHand } from 'react-icons/md';

const ProfilePage = () => {
	const router = useRouter();
	const [username, setUsername] = useState('');

	useEffect(() => {
		const user = getUserDetail();
		if (user) {
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

		await cacheClient.dictionarySetField('conference', 'participants', deviceId, username, { ttl: new CollectionTtl(43200) });
		const topicClient = new TopicClient({
			configuration: Configurations.Browser.latest(),
			credentialProvider: CredentialProvider.fromString({ authToken: token })
		});
		const r = await topicClient.publish('conference', 'leaderboard', deviceId);
		console.log(r);

		if (router.query.redirect) {
			router.push(router.query.redirect);
		} else {
			toast.success('Profile updated!', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' })
		}
	};

	return (
		<>
			<Head>
				<title>Momento Explorer</title>
			</Head>
			<Flex direction="column" width="100%" alignItems="center" height="90vh">
				<Card variation="elevated" borderRadius="large" padding="1.5em 3em" maxWidth="90%" marginTop="1em">
					<Flex direction="column" gap="1em">
						<Heading level={4}>Hey there! <MdWavingHand /></Heading>
						<Text>We are so happy you've joined us at THAT conference! Guess what.... you're in for a real treat, <b>{username}</b>!</Text>
						<Text>Each day, we will hide 5 new QR codes around the conference for you to find. All you have to do is scan them with your phone and you're done!</Text>
						<Text>Once you find all 5 QR codes, you'll be entered into our raffle to win a super cool lego set!</Text>
						<Text>So get that camera out and ninja around the conference floor. See you out there!</Text>
						<View width="100%" textAlign="center">
							<Image src="/mo-ninja.png" marginTop="1em" width="auto" maxWidth="8em" />
						</View>
					</Flex>
				</Card>
			</Flex>
		</>
	);
};

export default ProfilePage;

