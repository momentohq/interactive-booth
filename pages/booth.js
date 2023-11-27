import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { TopicClient, CacheClient, CredentialProvider, Configurations, CacheSortedSetFetch, CacheDictionaryFetch, CacheGet } from '@gomomento/sdk-web';
import { Flex, Table, TableCell, TableHead, TableRow, TableBody, ThemeProvider, Theme, Heading, Divider, Card, Image } from '@aws-amplify/ui-react';
import { getAuthToken } from '../utils/Auth';
import { getUserDetail } from '../utils/Device';
import { toast } from 'react-toastify';
import { FaPlayCircle, FaRegStopCircle } from 'react-icons/fa';
import { VscDebugRestart } from 'react-icons/vsc';
import Confetti from 'react-confetti';

const BoothPage = () => {
  const router = useRouter();
  const [cacheClient, setCacheClient] = useState(null);
  const [topicClient, setTopicClient] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isRaceActive, setIsRaceActive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [raceMessage, setRaceMessage] = useState('');
  const [showRace, setShowRace] = useState(false);
  const cacheClientRef = useRef(cacheClient);
  const [racers, setRacers] = useState({ superMo: 0, fauxMo: 0, ko: 0 });
  const racerRef = useRef(racers);
  const confettiRef = useRef(null);
  const activeRaceRef = useRef(isRaceActive);

  useEffect(() => {
    setShowRace(router.query?.race?.toLowerCase() == 'true');
  }, [router.query]);

  useEffect(() => {
    async function initialize() {
      const token = await getAuthToken();

      const client = new CacheClient({
        configuration: Configurations.Laptop.latest(),
        credentialProvider: CredentialProvider.fromString({ authToken: token }),
        defaultTtlSeconds: 43200 // 12 hours
      });

      updateCacheClient(client);

      topicClient = new TopicClient({
        configuration: Configurations.Laptop.latest(),
        credentialProvider: CredentialProvider.fromString({ authToken: token })
      });

      setTopicClient(topicClient);
    }

    const user = getUserDetail();
    if (!user) {
      router.push('/profile?redirect=/booth');
    } else {
      initialize();
    }
  }, []);

  useEffect(() => {
    async function load() {
      if (cacheClient) {
        updateLeaderboard();

        const raceResponse = await cacheClient.get('conference', 'race');
        if (raceResponse instanceof CacheGet.Hit) {
          const activeRace = raceResponse.valueString() == 'true';
          setIsRaceActive(activeRace);
          activeRaceRef.current = activeRace;
        }
      }
    }

    if (cacheClient) {
      load()
    }
  }, [cacheClient]);

  useEffect(() => {
    async function subscribe() {
      await topicClient.subscribe('conference', 'leaderboard', {
        onItem: (item) => { updateLeaderboard(); },
        onError: (e) => {
          console.error(e.errorCode(), e.message());
          toast.error('Failed to get leaderboard updates', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
        }
      });

      await topicClient.subscribe('conference', 'racer', {
        onItem: (item) => { updateRacer(item.value()); },
        onError: (e) => {
          console.error(e.errorCode(), e.message());
          toast.error('Failed to get race data', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
        }
      });

      setIsSubscribed(true);
    }

    if (topicClient && !isSubscribed) {
      subscribe();
    }
  }, [topicClient]);

  const updateCacheClient = (client) => {
    cacheClientRef.current = client;
    setCacheClient(client);
  };

  const updateLeaderboard = async () => {
    let board;
    const leaderboardResponse = await cacheClientRef.current.sortedSetFetchByRank('conference', 'leaderboard', { startRank: 0, order: 'DESC' });
    if (leaderboardResponse instanceof CacheSortedSetFetch.Hit) {
      const results = leaderboardResponse.valueArrayStringElements();
      if (results.length) {
        board = results.map((result, index) => {
          return {
            rank: index + 1,
            username: result.value,
            score: result.score
          };
        });
      }
    } else if (leaderboardResponse instanceof CacheSortedSetFetch.Error) {
      console.error(leaderboardResponse.errorCode(), leaderboardResponse.message());
      toast.error('Could not load leaderboard', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
    }
    setLeaderboard(board);
  };

  const updateRacer = (racer) => {
    if (!activeRaceRef.current) return;
    if (['superMo', 'fauxMo', 'ko'].includes(racer)) {
      const newRacers = { ...racerRef.current, [racer]: racerRef.current[racer] += 1 };
      setRacers(newRacers);
      racerRef.current = newRacers;

      let isRaceOver = false;
      let winner;
      if (newRacers.superMo >= 93) {
        isRaceOver = true;
        winner = 'Mo';
      } else if (newRacers.fauxMo >= 93) {
        isRaceOver = true;
        winner = 'Faux Mo';
      } else if (newRacers.ko >= 93) {
        isRaceOver = true;
        winner = 'Ko';
      }

      if (isRaceOver) {
        toggleRace(false);
        setRaceMessage(`The winner is ${winner}! Congratulations!`);
        setShowConfetti(true);
      }
    }
  }

  const toggleRace = async (isActive) => {
    setIsRaceActive(isActive);
    activeRaceRef.current = isActive;
    await cacheClientRef.current.set('conference', 'race', `${isActive}`);
    await topicClient.publish('conference', 'race', `${isActive}`);
  }

  const restartRace = async () => {
    toggleRace(false);

    const resetRacers = { superMo: 0, fauxMo: 0, ko: 0 };
    setRacers(resetRacers);
    racerRef.current = resetRacers;
    setRaceMessage('');
    setShowConfetti(false);
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        <Head>
          <title>Momento Booth</title>
        </Head>
        <Flex direction="column" width="100%" alignItems="center" justifyContent="center">
          <Flex direction="row" alignContent="space-between" justifyContent="center" width="100%" padding="0em 2em" height="92vh">
            {/* <Flex direction="column" gap="1em" basis={showRace ? "48%" : "80%"} height="min-content">
              <Card variation="elevated" backgroundColor="#C4F135">
                <Heading level={4} textAlign="center">Scavenger Hunt Leaderboard</Heading>
              </Card>
              <Table title="Scavenger Hunt Leaderboard" variation="striped" highlightOnHover boxShadow="medium" backgroundColor="#AEE2B3" >
                <TableHead>
                  <TableRow backgroundColor="white">
                    <TableCell as="th">Rank</TableCell>
                    <TableCell as="th" colSpan={3}>Username</TableCell>
                    <TableCell as="th">Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard?.map(entry => (
                    <TableRow key={entry.username}>
                      <TableCell>{entry.rank}</TableCell>
                      <TableCell colSpan={3}>{entry.username}</TableCell>
                      <TableCell>{entry.score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Flex> */}
            {/* {showRace && (
              <>
                <Divider orientation="vertical" size="large" /> */}
                <Flex direction="column" basis="48%" ref={confettiRef} position="relative">
                  {showConfetti && (
                    <Confetti
                      width={confettiRef.current?.offsetWidth}
                      height={confettiRef.current?.offsetHeight}
                      numberOfPieces={500}
                      style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                    />
                  )}
                  <Card variation="elevated" backgroundColor="#C4F135">
                    <Flex direction="row" alignItems="center" justifyContent="space-between">
                      <VscDebugRestart size="1.5em" cursor="pointer" onClick={restartRace} />
                      <Heading level={4} textAlign="center" >Momento Racers</Heading>
                      {isRaceActive ? <FaRegStopCircle size="1.5em" cursor="pointer" onClick={() => toggleRace(false)} /> : <FaPlayCircle size="1.5em" cursor="pointer" onClick={() => toggleRace(true)} />}
                    </Flex>
                  </Card>
                  <Card variation="elevated" id="track" width="100%" backgroundColor="#F4DACD">
                    <Flex direction="row" gap=".5em" justifyContent="center">
                      <Divider orientation="vertical" size="small" basis="2%" />
                      <Flex direction="column" gap="1em" basis="96%">
                        <Divider size="small" />
                        <Image key="superMo" src="mo.png" left={`${racerRef.current.superMo}%`} width="4em" position="relative" />
                        <Divider size="small" />
                        <Image key="fauxMo" src="fauxmo.png" left={`${racerRef.current.fauxMo}%`} width="4em" position="relative" />
                        <Divider size="small" />
                        <Image key="ko" src="ko.png" left={`${racerRef.current.ko}%`} width="4em" position="relative" />
                        <Divider size="small" />
                      </Flex>
                      <Divider orientation="vertical" size="small" basis="2%" />
                    </Flex>
                  </Card>
                  {raceMessage && (
                    <Card variation="elevated" width="100%">
                      <Heading level={5} textAlign="center" >{raceMessage}</Heading>
                    </Card>
                  )}
                  <Flex alignItems="center" width="100%" justifyContent="center">
                    <Card variation='elevated' width="fit-content" marginTop="5em" borderRadius="large">
                      <Flex direction="column" gap="1em" justifyContent="center" alignItems="center" width="100%">
                        <Image src="/join-qr.png" width="15em" />
                        <Heading level={5}>Join the race!</Heading>
                      </Flex>
                    </Card>
                  </Flex>
                </Flex>
              {/* </>
            )} */}
          </Flex>
        </Flex>
      </ThemeProvider>
    </>
  );
};

const theme = {
  name: 'table-theme',
  tokens: {
    components: {
      table: {
        row: {
          hover: {
            backgroundColor: { value: '{colors.blue.20}' },
          },

          striped: {
            backgroundColor: { value: '{colors.green.10}' },
          },
        },

        header: {
          color: { value: '{colors.green.80}' },
          fontSize: { value: '{fontSizes.large}' },
        },

        data: {
          fontWeight: { value: '{fontWeights.semibold}' },
        },
      },
    },
  },
};

export default BoothPage;
