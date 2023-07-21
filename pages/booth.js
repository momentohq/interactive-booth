import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { TopicClient, CacheClient, CredentialProvider, Configurations, CacheSortedSetFetch, CacheDictionaryFetch } from '@gomomento/sdk-web';
import { Flex, Table, TableCell, TableHead, TableRow, TableBody, ThemeProvider, Theme } from '@aws-amplify/ui-react';
import { getAuthToken } from '../utils/Auth';
import { toast } from 'react-toastify';

const BoothPage = () => {
  const router = useRouter();
  const [cacheClient, setCacheClient] = useState(null);
  const [topicClient, setTopicClient] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const cacheClientRef = useRef(cacheClient);

  useEffect(() => {
    async function initialize() {
      const token = await getAuthToken();

      const client = new CacheClient({
        configuration: Configurations.Browser.latest(),
        credentialProvider: CredentialProvider.fromString({ authToken: token }),
        defaultTtlSeconds: 43200 // 12 hours
      });

      updateCacheClient(client);

      topicClient = new TopicClient({
        configuration: Configurations.Browser.latest(),
        credentialProvider: CredentialProvider.fromString({ authToken: token })
      });

      setTopicClient(topicClient);
      topicClient.subscribe('conference', 'leaderboard', {
        onItem: (item) => { updateLeaderboard(); },
        onError: (e) => {
          console.error(e.errorCode(), e.message());
          toast.error('Failed to get leaderboard updates', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
        }
      });

      topicClient.subscribe('conference', 'racer', {
        onItem: (item) => { updateRacer(JSON.parse(item.value())) },
        onError: (e) => {
          console.error(e.errorCode(), e.message());
          toast.error('Failed to get race data', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
        }
      });
    }

    initialize();
  }, []);

  useEffect(() => {
    if (cacheClient) {
      updateLeaderboard();
    }
  }, [cacheClient]);

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
        const participantsResponse = await cacheClientRef.current.dictionaryFetch('conference', 'participants');
        if (participantsResponse instanceof CacheDictionaryFetch.Hit) {
          const participants = participantsResponse.valueRecord();
          board = results.map((result, index) => {
            const participant = participants[result.value];
            return {
              rank: index + 1,
              username: participant ?? result.value,
              score: result.score
            };
          });
        } else if (participantsResponse instanceof CacheDictionaryFetch.Miss) {
          board = results.map((result, index) => {
            return {
              rank: index + 1,
              username: result.value,
              score: result.score
            };
          });
        } else if (participantsResponse instanceof CacheDictionaryFetch.Error) {
          console.error(participantsResponse.errorCode(), participantsResponse.message());
          toast.error('Could not load leaderboard', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
        }
      }
    } else if (leaderboardResponse instanceof CacheSortedSetFetch.Error) {
      console.error(leaderboardResponse.errorCode(), leaderboardResponse.message());
      toast.error('Could not load leaderboard', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
    }
    setLeaderboard(board);
  };

  const updateRacer = (racerData) => {
    if (!isRacing) return;

    
  }

  return (
    <>
      <ThemeProvider theme={theme}>
        <Head>
          <title>{router.query.code} Check Code | Momento</title>
        </Head>
        <Flex direction="column" width="100%" alignItems="center" justifyContent="center">
          <Table title="Scavenger Hunt Leaderboard" variation="striped" highlightOnHover width="90%" boxShadow="medium" backgroundColor="#AEE2B3">
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
