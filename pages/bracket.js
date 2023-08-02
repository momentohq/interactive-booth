import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Flex, Card, TextField, Heading, Button, Text, View } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { TopicClient, CacheClient, CredentialProvider, Configurations, CollectionTtl } from '@gomomento/sdk-web';
import { getAuthToken } from '../utils/Auth';
import { Bracket, Seed, SeedItem, SeedTeam, SingleLineSeed } from 'react-brackets';

const BracketPage = () => {
  const router = useRouter();
  const [rounds, setRounds] = useState([]);

  useEffect(() => {
    if(router.query?.generate){
      generate();
    }
  }, [router.query]);

  useEffect(() => {
    setRounds([
      {
        id: 0,
        title: 'Round one',
        seeds: [
          {
            id: 1,
            date: new Date().toDateString(),
            teams: [{ name: 'Team A' }, { name: 'Team B' }],
          },
          {
            id: 2,
            date: new Date().toDateString(),
            teams: [{ name: 'Team C' }, { name: 'Team D' }],
          },
        ],
      },
      {
        title: 'Round two',
        seeds: [
          {
            id: 3,
            date: new Date().toDateString(),
            teams: [{ name: 'Team A' }, { name: 'Team C' }],
          },
        ],
      },
    ]);
  }, []);

  useEffect(() => {
    const loadBracket = async () => {
      const response = await fetch(`/api/bracket`);
      const data = await response.json();
      if (data.length) {
        setRounds(data);
      }
    };

    loadBracket();
  }, []);

  const generate = async () => {
    const bracket = await fetch('/api/generateBracket');
    const data = await bracket.json()
    if(data?.length){
      setRounds(data);
    }
  }

  const handleWinner = async (name, round, seed) => {
    const response = await fetch('/api/setRaceWinner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        winner: name,
        round,
        seed
      })
    });

    const updatedTable = await response.json();
    setRounds(updatedTable);
  };

  const CustomSeed = ({ seed, breakpoint, roundIndex, seedIndex }) => {
    return (
      <SingleLineSeed mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
        <SeedItem>
          <View>
            <SeedTeam
              style={{ cursor: "pointer", backgroundColor: "#C4F135", color: "black" }}
              onClick={() => handleWinner(seed.teams[0].name, roundIndex, seedIndex)}
            >
              {seed.teams[0]?.name || '-----------'}
            </SeedTeam>
            <SeedTeam
              style={{ cursor: "pointer", backgroundColor: "#C4F135", color: "black" }}
              onClick={() => handleWinner(seed.teams[1].name, roundIndex, seedIndex)}
            >
              {seed.teams[1]?.name || '-----------'}
            </SeedTeam>
            <SeedTeam
              style={{ cursor: "pointer", backgroundColor: "#C4F135", color: "black" }}
              onClick={() => handleWinner(seed.teams[2].name, roundIndex, seedIndex)}
            >
              {seed.teams[2]?.name || '-----------'}
            </SeedTeam>
          </View>
        </SeedItem>
      </SingleLineSeed>
    );
  };

  return (
    <>
      <Head>
        <title>Race Bracket | Momento</title>
      </Head>
      <Flex direction="column" width="100%" alignItems="center" justifyContent="center" marginTop="1em">
        <Card variation='elevated' borderRadius="large">
          <Bracket rounds={rounds} renderSeedComponent={CustomSeed} />
        </Card>
      </Flex>
    </>
  );
};

export default BracketPage;