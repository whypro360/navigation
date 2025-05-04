const { request } = require("../utils/request");
const app = getApp();
//获取所有路径信息
async function fetchAllPath(){
  try{
    wx.showLoading({
      title: '加载中...'
    })
    const serverRes = await request({
      url:app.globalData.URL+"navigation/all_path",
      method:"GET"
    });
    // console.log("获取到的所有路径对象：",serverRes.data);
    wx.hideLoading();
    return serverRes.data
  }catch (err) {
    console.error('获取路径失败:', err);
    wx.showToast({ title: '数据加载失败', icon: 'none' });
    wx.hideToast();
  }
}


module.exports = {
  fetchAllPath
};