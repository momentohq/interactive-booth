const { CacheSetFetch } = require("@gomomento/sdk");

export const getBracket = async (cacheClient) => {
  const bracket = [];
  const rounds = await cacheClient.setFetch('conference', 'brackets');
  if (rounds instanceof CacheSetFetch.Hit) {
    const roundNames = rounds.valueArrayString();
    for (const roundName of roundNames) {
      const [round, seed] = roundName.split('.');
      let bracketRoundIndex = bracket.findIndex(b => b.id == Number(round));
      if (bracketRoundIndex == -1) {
        bracket.push({
          id: Number(round),
          title: `Round ${Number(round) + 1}`,
          seeds: []
        });
        bracketRoundIndex = bracket.length - 1;
      }
      const participants = await cacheClient.setFetch('conference', roundName);
      if (participants instanceof CacheSetFetch.Hit) {
        bracket[bracketRoundIndex].seeds.push({
          id: seed,
          date: new Date().toDateString(),
          teams: participants.valueArrayString().sort().map(participant => {
            return {
              name: participant
            }
          })
        });
        bracket[bracketRoundIndex].seeds.sort((a, b)  => a.id - b.id);
      }
    }
  }

  bracket.sort((a, b) => a.id - b.id);
  return bracket;
};

export const resetBracket = async (cacheClient) => {
  const rounds = await cacheClient.setFetch('conference', 'brackets');
  if (rounds instanceof CacheSetFetch.Hit) {
    const roundNames = rounds.valueArrayString();
    for (const roundName of roundNames) {
      await cacheClient.delete('conference', roundName);      
    }
    await cacheClient.delete('conference', 'brackets');
  }
};