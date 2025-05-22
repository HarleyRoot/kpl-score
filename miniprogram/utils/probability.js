// probability.js

// 计算队伍积分
function calculateTeamPoints(matches, teamName) {
  let bigScore = 0;
  let smallScore = 0;

  matches.forEach(match => {
    if (match.team1 === teamName || match.team2 === teamName) {
      const [score1, score2] = match.score.split(':').map(Number);
      const isTeam1 = match.team1 === teamName;
      const teamScore = isTeam1 ? score1 : score2;
      const opponentScore = isTeam1 ? score2 : score1;

      // 计算大分
      if (teamScore > opponentScore) {
        bigScore += 1;
      }

      // 计算小分
      smallScore += teamScore - opponentScore;
    }
  });

  return { bigScore, smallScore };
}

// 计算净胜场
function calculateNetWins(matches, teamName) {
  let netWins = 0;
  matches.forEach(match => {
    if (match.team1 === teamName || match.team2 === teamName) {
      const [score1, score2] = match.score.split(':').map(Number);
      if (match.team1 === teamName) {
        netWins += score1 - score2;
      } else {
        netWins += score2 - score1;
      }
    }
  });
  return netWins;
}

// 计算队伍排名
function calculateTeamRankings(teams, matches) {
  return teams.map(team => {
    const { bigScore, smallScore } = calculateTeamPoints(matches, team.name);
    return {
      name: team.name,
      bigScore,
      smallScore
    };
  }).sort((a, b) => {
    // 第一关键字：大分（降序）
    if (b.bigScore !== a.bigScore) {
      return b.bigScore - a.bigScore;
    }
    // 第二关键字：小分（降序）
    if (b.smallScore !== a.smallScore) {
      return b.smallScore - a.smallScore;
    }
    // 第三关键字：队伍名称字典序（升序）
    return a.name.localeCompare(b.name);
  });
}

// 计算出线概率
function calculateQualificationProbability(teams, groups, matches) {
  const rankings = calculateTeamRankings(teams, matches);
  const results = [];

  teams.forEach(team => {
    const teamRankings = rankings.find(t => t.name === team.name);
    const teamRank = rankings.indexOf(teamRankings) + 1;
    
    const probabilities = groups.map(group => {
      // 根据当前排名和小组名次计算概率
      const rankDiff = Math.abs(teamRank - group.rank);
      let probability = 0;
      
      if (rankDiff === 0) {
        probability = 100;
      } else if (rankDiff === 1) {
        probability = 50;
      } else if (rankDiff === 2) {
        probability = 25;
      } else {
        probability = 10;
      }

      return {
        group: group.name,
        probability: probability.toFixed(2)
      };
    });

    results.push({
      team: team.name,
      probabilities
    });
  });

  return results;
}

module.exports = {
  calculateQualificationProbability
}; 