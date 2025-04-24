const app = getApp();
const user = require("../../utils/user.js");
const { request } = require("../../utils/request");
Page({
  data: {
    searchKeyword: '', // 当前输入的搜索关键词
    searchHistory: [], // 最近查找记录
    searchResults: [], // 搜索结果
    allLocations: []   // 所有点位信息
  },

  onLoad() {
    // 从后端拉取点位信息
    this.fetchAllPoint();
    // 加载最近查找记录（从本地缓存读取）
    const history = wx.getStorageSync('searchHistory') || [];
    this.setData({ searchHistory: history });
  },

  //获取所有点位
  async fetchAllPoint(){
    try{
      // 检查用户是否登录
      if (!user.isLoggedIn()) {
        const loginModal = await new Promise((resolve) => {
          wx.showModal({
            title: '用户登录',
            content: '是否继续用户登录？',
            success(res) {
              resolve(res.confirm); // 用户点击“确定”返回 true，否则返回 false
            },
          });
        });
        if (!loginModal) {
          console.log("用户取消登录");
          return; // 如果用户取消登录，直接退出函数
        }
        // 执行登录操作
        await app.wxLogin();
      }
      wx.showLoading({
        title: '加载中...'
      })
      const serverRes =await request({
        url:app.globalData.URL+"navigation/all_point",
        method:"GET"
      });
      console.log("获取到的所有点位对象：",serverRes.data);
      this.setData({ allLocations: serverRes.data });
      wx.hideLoading();
    }catch (err) {
      console.error('获取点位失败:', err);
      wx.showToast({ title: '数据加载失败', icon: 'none' });
      wx.hideToast();
    }
  },
  // 输入框内容变化时触发
  handleSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });

    if (!keyword) {
      this.setData({ searchResults: [] }); // 清空搜索结果
      return;
    }

    // 模糊匹配点位信息
    const results = this.data.allLocations.filter(location =>
      location.name.includes(keyword) || location.description.includes(keyword)
    );
    this.setData({ searchResults: results });
  },

  // 清空输入框
  clearSearchInput() {
    this.setData({ searchKeyword: '', searchResults: [] });
  },

  // 点击某条记录时触发
  selectLocation(e) {
    const location = e.currentTarget.dataset.location;

    // 添加到最近查找记录
    const { searchHistory } = this.data;
    const newHistory = searchHistory.filter(item => item.id !== location.id);
    newHistory.unshift(location); // 将新记录插入到最前面

    if (newHistory.length > 5) {
      newHistory.pop(); // 限制最多保存 5 条记录
    }
    this.setData({ searchHistory: newHistory });
    wx.setStorageSync('searchHistory', newHistory); // 更新本地缓存
    const eventChannel = this.getOpenerEventChannel();
    // 触发事件传递数据
    eventChannel.emit('selectLocation', {
      detail: {
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name
      }
    });
    wx.navigateBack(); 
  },

  // 清空最近查找记录
  clearSearchHistory() {
    this.setData({ searchHistory: [] });
    wx.setStorageSync('searchHistory', []);
  }
});