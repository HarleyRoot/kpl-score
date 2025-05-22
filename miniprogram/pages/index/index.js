const { envList } = require("../../envList");
const { QuickStartPoints, QuickStartSteps } = require("./constants");
const { calculateQualificationProbability } = require('../../utils/probability');

Page({
  data: {
    teams: [], // 存储所有队伍
    groups: [], // 存储所有小组
    newTeamName: '', // 新队伍名称
    newGroupName: '', // 新小组名称
    newGroupRank: '', // 新小组名次
    showScoreModal: false, // 是否显示添加比分弹窗
    showTeamDetailModal: false, // 是否显示队伍详情弹窗
    showEditScoreModal: false, // 是否显示编辑比分弹窗
    showImportModal: false, // 是否显示输入信息弹窗
    showGroupDetailModal: false, // 是否显示小组详情弹窗
    importText: '', // 导入的文本内容
    selectedTeam: '', // 当前选中的队伍
    editingGroup: null, // 当前正在编辑的小组
    availableOpponents: [], // 可选的对手列表
    selectedOpponentIndex: 0, // 选中的对手索引
    scoreOptions: ['未比赛', '3:0', '3:1', '3:2', '2:3', '1:3', '0:3'], // 比分选项
    selectedScoreIndex: 0, // 选中的比分索引
    results: [], // 计算结果
    matches: [], // 存储所有比赛记录
    teamMatches: [], // 当前查看的队伍的比赛记录
    editingMatch: null // 当前正在编辑的比赛记录
  },

  copyCode(e) {
    const code = e.target?.dataset?.code || '';
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({
          title: '已复制',
        })
      },
      fail: (err) => {
        console.error('复制失败-----', err);
      }
    })
  },

  discoverCloud() {
    wx.switchTab({
      url: '/pages/examples/index',
    })
  },

  gotoGoodsListPage() {
    wx.navigateTo({
      url: '/pages/goods-list/index',
    })
  },

  // 输入队伍名称
  onTeamNameInput(e) {
    this.setData({
      newTeamName: e.detail.value
    });
  },

  // 添加队伍
  addTeam() {
    if (!this.data.newTeamName) {
      wx.showToast({
        title: '请输入队伍名称',
        icon: 'none'
      });
      return;
    }

    const teams = this.data.teams;
    if (teams.some(team => team.name === this.data.newTeamName)) {
      wx.showToast({
        title: '该队伍已存在',
        icon: 'none'
      });
      return;
    }

    teams.push({
      name: this.data.newTeamName,
      bigScore: 0,
      smallScore: 0
    });

    // 对队伍进行排序
    const sortedTeams = this.sortTeams(teams);

    this.setData({
      teams: sortedTeams,
      newTeamName: ''
    });
  },

  // 删除队伍
  deleteTeam(e) {
    const teamName = e.currentTarget.dataset.team;
    wx.showModal({
      title: '确认删除',
      content: '是否确定删除该队伍及其比分？',
      success: (res) => {
        if (res.confirm) {
          const teams = this.data.teams.filter(team => team.name !== teamName);
          const matches = this.data.matches.filter(
            match => match.team1 !== teamName && match.team2 !== teamName
          );
          
          // 对剩余队伍进行排序
          const sortedTeams = this.sortTeams(teams);
          
          this.setData({
            teams: sortedTeams,
            matches
          });

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 显示队伍详情
  showTeamDetail(e) {
    const teamName = e.currentTarget.dataset.team;
    const teamMatches = this.data.matches.filter(
      match => match.team1 === teamName || match.team2 === teamName
    );

    this.setData({
      showTeamDetailModal: true,
      selectedTeam: teamName,
      teamMatches
    });
  },

  // 关闭队伍详情
  closeTeamDetail() {
    this.setData({
      showTeamDetailModal: false
    });
  },

  // 输入小组名称
  onGroupNameInput(e) {
    this.setData({
      newGroupName: e.detail.value
    });
  },

  // 输入小组名次
  onGroupRankInput(e) {
    this.setData({
      newGroupRank: e.detail.value
    });
  },

  // 添加小组
  addGroup() {
    if (!this.data.newGroupName || !this.data.newGroupRank) {
      wx.showToast({
        title: '请输入完整的小组信息',
        icon: 'none'
      });
      return;
    }

    const groups = this.data.groups;
    const newRank = parseInt(this.data.newGroupRank);

    // 检查名称是否重复
    if (groups.some(group => group.name === this.data.newGroupName)) {
      wx.showToast({
        title: '该小组名称已存在',
        icon: 'none'
      });
      return;
    }

    // 检查名次是否重复
    if (groups.some(group => group.rank === newRank)) {
      wx.showToast({
        title: '该小组名次已存在',
        icon: 'none'
      });
      return;
    }

    groups.push({
      name: this.data.newGroupName,
      rank: newRank
    });

    // 对小组进行排序
    const sortedGroups = this.sortGroups(groups);

    this.setData({
      groups: sortedGroups,
      newGroupName: '',
      newGroupRank: ''
    });
  },

  // 显示小组详情
  showGroupDetail(e) {
    const group = e.currentTarget.dataset.group;
    this.setData({
      showGroupDetailModal: true,
      editingGroup: { ...group }
    });
  },

  // 输入编辑的小组名称
  onEditGroupNameInput(e) {
    this.setData({
      'editingGroup.name': e.detail.value
    });
  },

  // 输入编辑的小组名次
  onEditGroupRankInput(e) {
    this.setData({
      'editingGroup.rank': e.detail.value
    });
  },

  // 确认编辑小组
  confirmEditGroup() {
    const { name, rank } = this.data.editingGroup;
    if (!name || !rank) {
      wx.showToast({
        title: '请输入完整的小组信息',
        icon: 'none'
      });
      return;
    }

    const newRank = parseInt(rank);
    const groups = this.data.groups;
    const oldGroup = groups.find(g => g.name === this.data.editingGroup.name);

    // 检查名称是否重复（排除当前编辑的小组）
    if (groups.some(group => group.name === name && group.name !== oldGroup.name)) {
      wx.showToast({
        title: '该小组名称已存在',
        icon: 'none'
      });
      return;
    }

    // 检查名次是否重复（排除当前编辑的小组）
    if (groups.some(group => group.rank === newRank && group.name !== oldGroup.name)) {
      wx.showToast({
        title: '该小组名次已存在',
        icon: 'none'
      });
      return;
    }

    // 更新小组信息
    const updatedGroups = groups.map(group => {
      if (group.name === oldGroup.name) {
        return {
          name,
          rank: newRank
        };
      }
      return group;
    });

    // 对小组进行排序
    const sortedGroups = this.sortGroups(updatedGroups);

    this.setData({
      groups: sortedGroups,
      showGroupDetailModal: false,
      editingGroup: null
    });

    wx.showToast({
      title: '修改成功',
      icon: 'success'
    });
  },

  // 取消编辑小组
  cancelEditGroup() {
    this.setData({
      showGroupDetailModal: false,
      editingGroup: null
    });
  },

  // 删除小组
  deleteGroup(e) {
    const groupName = e.currentTarget.dataset.group;
    wx.showModal({
      title: '确认删除',
      content: '是否确定删除该小组？',
      success: (res) => {
        if (res.confirm) {
          const groups = this.data.groups.filter(group => group.name !== groupName);
          this.setData({ groups });
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 对小组进行排序
  sortGroups(groups) {
    return groups.sort((a, b) => a.rank - b.rank);
  },

  // 显示添加比分弹窗
  showAddScore(e) {
    const team = e.currentTarget.dataset.team;
    const availableOpponents = this.data.teams
      .filter(t => t.name !== team)
      .map(t => t.name);

    if (availableOpponents.length === 0) {
      wx.showToast({
        title: '没有可选的对手',
        icon: 'none'
      });
      return;
    }

    this.setData({
      showScoreModal: true,
      selectedTeam: team,
      availableOpponents,
      selectedOpponentIndex: 0,
      selectedScoreIndex: 0
    });
  },

  // 选择对手
  onOpponentChange(e) {
    this.setData({
      selectedOpponentIndex: e.detail.value
    });
  },

  // 选择比分
  onScoreChange(e) {
    this.setData({
      selectedScoreIndex: e.detail.value
    });
  },

  // 确认添加比分
  confirmScore() {
    const match = {
      team1: this.data.selectedTeam,
      team2: this.data.availableOpponents[this.data.selectedOpponentIndex],
      score: this.data.scoreOptions[this.data.selectedScoreIndex]
    };

    // 如果选择"未比赛"，则不添加比赛记录
    if (match.score === '未比赛') {
      this.setData({
        showScoreModal: false
      });
      return;
    }

    const matches = this.data.matches;
    matches.push(match);

    // 更新队伍积分
    const teams = this.data.teams.map(team => {
      if (team.name === match.team1 || team.name === match.team2) {
        const [score1, score2] = match.score.split(':').map(Number);
        const isTeam1 = team.name === match.team1;
        const teamScore = isTeam1 ? score1 : score2;
        const opponentScore = isTeam1 ? score2 : score1;

        // 计算大分
        const bigScore = teamScore > opponentScore ? 1 : 0;
        // 计算小分
        const smallScore = teamScore - opponentScore;

        return {
          ...team,
          bigScore: team.bigScore + bigScore,
          smallScore: team.smallScore + smallScore
        };
      }
      return team;
    });

    // 对队伍进行排序
    const sortedTeams = this.sortTeams(teams);

    this.setData({
      matches,
      teams: sortedTeams,
      showScoreModal: false
    });

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  // 取消添加比分
  cancelScore() {
    this.setData({
      showScoreModal: false
    });
  },

  // 计算概率
  calculateProbability() {
    if (this.data.teams.length === 0) {
      wx.showToast({
        title: '请先添加队伍',
        icon: 'none'
      });
      return;
    }

    if (this.data.groups.length === 0) {
      wx.showToast({
        title: '请先添加小组',
        icon: 'none'
      });
      return;
    }

    const results = calculateQualificationProbability(this.data.teams, this.data.groups, this.data.matches);
    
    // 保存历史记录
    const history = {
      timestamp: new Date().getTime(),
      teams: this.data.teams,
      groups: this.data.groups,
      matches: this.data.matches,
      results: results,
      teamCount: this.data.teams.length,
      matchCount: this.data.matches.length,
      groupNames: this.data.groups.map(g => g.name).join('、')
    };

    // 获取现有历史记录
    let historyList = wx.getStorageSync('calculationHistory') || [];
    // 将新记录添加到开头
    historyList.unshift(history);
    // 只保留最近50条记录
    if (historyList.length > 50) {
      historyList = historyList.slice(0, 50);
    }
    // 保存历史记录
    wx.setStorageSync('calculationHistory', historyList);

    this.setData({
      results
    });
  },

  // 显示编辑比分弹窗
  showEditScore(e) {
    const match = e.currentTarget.dataset.match;
    const scoreIndex = this.data.scoreOptions.indexOf(match.score);
    
    this.setData({
      showEditScoreModal: true,
      editingMatch: match,
      selectedScoreIndex: scoreIndex
    });
  },

  // 选择新的比分
  onEditScoreChange(e) {
    this.setData({
      selectedScoreIndex: e.detail.value
    });
  },

  // 确认编辑比分
  confirmEditScore() {
    const newScore = this.data.scoreOptions[this.data.selectedScoreIndex];
    const oldMatch = this.data.editingMatch;
    
    // 如果选择"未比赛"，则删除该比赛记录
    if (newScore === '未比赛') {
      const matches = this.data.matches.filter(
        match => !(match.team1 === oldMatch.team1 && match.team2 === oldMatch.team2)
      );

      // 重新计算所有队伍的积分
      const teams = this.data.teams.map(team => {
        const { bigScore, smallScore } = this.calculateTeamPoints(matches, team.name);
        return {
          ...team,
          bigScore,
          smallScore
        };
      });

      // 对队伍进行排序
      const sortedTeams = this.sortTeams(teams);

      this.setData({
        matches,
        teams: sortedTeams,
        showEditScoreModal: false,
        editingMatch: null
      });

      // 更新队伍详情中的比赛记录
      this.updateTeamMatches();

      wx.showToast({
        title: '已删除比赛记录',
        icon: 'success'
      });
      return;
    }
    
    // 更新比赛记录
    const matches = this.data.matches.map(match => {
      if (match.team1 === oldMatch.team1 && match.team2 === oldMatch.team2) {
        return {
          ...match,
          score: newScore
        };
      }
      return match;
    });

    // 重新计算所有队伍的积分
    const teams = this.data.teams.map(team => {
      const { bigScore, smallScore } = this.calculateTeamPoints(matches, team.name);
      return {
        ...team,
        bigScore,
        smallScore
      };
    });

    // 对队伍进行排序
    const sortedTeams = this.sortTeams(teams);

    this.setData({
      matches,
      teams: sortedTeams,
      showEditScoreModal: false,
      editingMatch: null
    });

    // 更新队伍详情中的比赛记录
    this.updateTeamMatches();

    wx.showToast({
      title: '修改成功',
      icon: 'success'
    });
  },

  // 取消编辑比分
  cancelEditScore() {
    this.setData({
      showEditScoreModal: false,
      editingMatch: null
    });
  },

  // 更新队伍详情中的比赛记录
  updateTeamMatches() {
    if (this.data.selectedTeam) {
      const teamMatches = this.data.matches.filter(
        match => match.team1 === this.data.selectedTeam || match.team2 === this.data.selectedTeam
      );
      this.setData({ teamMatches });
    }
  },

  // 计算队伍积分（从probability.js中提取的方法）
  calculateTeamPoints(matches, teamName) {
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
  },

  // 对队伍进行排序
  sortTeams(teams) {
    return teams.sort((a, b) => {
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
  },

  // 导出数据
  exportData() {
    const data = {
      teams: this.data.teams,
      groups: this.data.groups,
      matches: this.data.matches
    };
    
    const jsonStr = JSON.stringify(data, null, 2);
    
    wx.setClipboardData({
      data: jsonStr,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  // 显示导入弹窗
  showImportModal() {
    this.setData({
      showImportModal: true,
      importText: ''
    });
  },

  // 输入导入文本
  onImportInput(e) {
    this.setData({
      importText: e.detail.value
    });
  },

  // 确认导入
  confirmImport() {
    try {
      const data = JSON.parse(this.data.importText);
      
      // 验证数据格式
      if (!data.teams || !data.groups || !data.matches) {
        throw new Error('数据格式不正确');
      }

      // 更新数据
      this.setData({
        teams: data.teams,
        groups: data.groups,
        matches: data.matches,
        showImportModal: false,
        importText: ''
      });

      wx.showToast({
        title: '导入成功',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: '导入失败：' + error.message,
        icon: 'none'
      });
    }
  },

  // 取消导入
  cancelImport() {
    this.setData({
      showImportModal: false,
      importText: ''
    });
  }
});
