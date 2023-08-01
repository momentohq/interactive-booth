import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Flex, Card, Heading, Image, Text, View } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { getUserDetail } from '../utils/Device';
import { MdWavingHand } from 'react-icons/md';

const ProfilePage = () => {
	const router = useRouter();
	const [username, setUsername] = useState('');

	useEffect(() => {
		const user = getUserDetail();
		if (user) {
			setUsername(user.username);
		} else {
			router.push('/profile');
		}
	}, []);

	return (
		<>
			<Head>
				<title>Momento Explorer</title>
			</Head>
			<Flex direction="column" width="100%" alignItems="center" height="90vh">
				<Card variation="elevated" borderRadius="large" padding="1.5em 3em" maxWidth="90%" marginTop="1em">
					<Flex direction="column" gap="1em">
						<Heading level={4}>Hey there! <MdWavingHand /></Heading>
						<Text>We are so happy you've joined us at {process.env.NEXT_PUBLIC_CONFERENCE}! Guess what.... you're in for a real treat, <b>{username}</b>!</Text>
						<Text>We've hidden QR codes around the conference for you to find. All you have to do is scan them with your phone and you're done!</Text>
						<Text>Once you find all the QR codes, you'll be entered into our raffle to win a super cool {process.env.NEXT_PUBLIC_PRIZE}!</Text>
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

