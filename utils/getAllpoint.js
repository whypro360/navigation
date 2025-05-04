  const { request } = require("../utils/request");
  const app = getApp();
  //获取所有点位
  async function fetchAllPoint(){
    try{
      wx.showLoading({
        title: '加载中...'
      })
      const serverRes =await request({
        url:app.globalData.URL+"navigation/all_point",
        method:"GET"
      });
      // console.log("获取到的所有点位对象：",serverRes.data);
      // this.setData({ allPoints: serverRes.data });
      wx.hideLoading();
      return serverRes.data
    }catch (err) {
      console.error('获取点位失败:', err);
      wx.showToast({ title: '数据加载失败', icon: 'none' });
      wx.hideToast();
    }
  }
module.exports = {
  fetchAllPoint
};