import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { FaPlus } from 'react-icons/fa';
import Link from 'next/link';
import { faker } from '@faker-js/faker';
import { TopicClient, CacheClient, CredentialProvider, Configurations, CacheSetFetch, CollectionTtl } from '@gomomento/sdk-web';
import { getAuthToken } from '../utils/Auth';

export default function Home() {
	const [chatRooms, setChatRooms] = useState([]);
	const [cacheClient, setCacheClient] = useState(null);
	const [topicClient, setTopicClient] = useState(null);
	const cacheClientRef = useRef(cacheClient);

	useEffect(() => {
		async function setupMomento() {
			if (!cacheClient) {
				const authToken = await getAuthToken();

				const newCacheClient = new CacheClient({
					configuration: Configurations.Browser.latest(),
					credentialProvider: CredentialProvider.fromString({ authToken }),
					defaultTtlSeconds: 1
				});

				const newTopicClient = new TopicClient({
					configuration: Configurations.Browser.latest(),
					credentialProvider: CredentialProvider.fromString({ authToken })
				});

				setTopicClient(newTopicClient);
				setCacheClient(newCacheClient);
			}
		}

		setupMomento();
	}, []);

	useEffect(() => {
		if (topicClient) {
			topicClient.subscribe('chat', 'chat-room-created', {
				onItem: async () => await getRoomList(),
				onError: (err) => console.log(err)
			});
		}
	}, [topicClient]);

	useEffect(async () => {
		if (cacheClient) {
			cacheClientRef.current = cacheClient;
			getRoomList();			
		}
	}, [cacheClient]);
	
	const getRoomList = async () => {
		const roomListResponse = await cacheClientRef.current.setFetch('chat', 'chat-room-list');
		if (roomListResponse instanceof CacheSetFetch.Hit) {
			setChatRooms(roomListResponse.valueArrayString().sort());
		} else {
			setChatRooms([]);
		}
	};

	const handleCreateChatRoom = async () => {
		const chatRoomName = `${faker.hacker.adjective()} ${faker.hacker.noun()}`;

		await cacheClientRef.current.setAddElement('chat', 'chat-room-list', chatRoomName, { ttl: new CollectionTtl(3600) });
		await topicClient.publish('chat', 'chat-room-created', JSON.stringify({ name: chatRoomName }));
	};

	return (
		<div>
			<Head>
				<title>Explorer | Momento</title>
			</Head>
			
			<div className="chat-rooms-container">
				{chatRooms.map((room) => (
					<Link key={room} href={`/chat/${room}`}>
						<a className="chat-room-link">{room}</a>
					</Link>
				))}
			</div>
		</div>
	);
}
