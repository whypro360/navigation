const { request } = require("../utils/request");
const app = getApp();

 //获取校区类型
 async function fetchCampusType(){
  try{
    const serverRes = await request({
      url:app.globalData.URL+"navigation/campusType",
      method:"GET"
    })
    // console.log("校区类型：",serverRes.data)
    return serverRes.data
  }catch (error) {
    console.error("获取校区类型失败", error);
    wx.showToast({
      title: "加载校区类型失败",
      icon: "none",
    });
  }
}

module.exports = {
  fetchCampusType
};