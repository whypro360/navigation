// pages/info/info.js
const app = getApp();
const user = require("../../utils/user.js");
const { request } = require("../../utils/request");
const fetchCampus = require("../../utils/getCampus");
Page({
  data: {
    userInfo: {
      openid: "用户唯一标识",
      sex : null, 
      phone: "12345678901",
      id : 0,
      role : "用户",
      campusId:0
    },
    sexOptions: ["男", "女"],
    campusesType:[]
  },

  onLoad:async function(){
    const campus = await fetchCampus.fetchCampusType();
    this.setData({
      campusesType:campus.map(item=>({
        id:item.id,
        name:item.name,
        description:item.description
      }))
    })
    this.fetchUserInfo();
  },

  async fetchUserInfo(){
    try {
      wx.showLoading({ title: '加载个人信息中...' });
      const serverRes = await request({
        url: app.globalData.URL + 'user/user/getUserById',
        method: 'GET'
      });
      // console.log('获取到的个人信息：', serverRes.data);

      const { openid, name, sex, id, role: originalRole, campusId } = serverRes.data;
      const index = this.data.campusesType.findIndex(c => c.id == campusId);

      const role = originalRole == "0" ? "用户" : "管理员";

      this.setData({
        userInfo: {
          openid,
          name,
          sex,
          id,
          role,
          campusId: index
        }
      });
    } catch (err) {
      console.error('获取个人信息失败:', err);
      wx.showToast({ title: '获取个人信息失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  


  async updateUserInfo() {
    try {
      wx.showLoading({ title: '提交个人信息中...' });
      await request({
        url: app.globalData.URL + "user/user/updateUser",
        method: "POST",
        data: {
          id: this.data.userInfo.id,
          name: this.data.userInfo.name,
          sex: this.data.userInfo.sex,
          campusId: this.data.campusesType[this.data.userInfo.campusId].id
        },
      });
      wx.showToast({ title: '上传成功' });

      const { id, openid, token, avatar, role } = user.getUserInfo();
      user.setUserInfo({
        id,
        name: this.data.userInfo.name,
        openid,
        token,
        avatar,
        role,
        campusId: this.data.campusesType[this.data.userInfo.campusId].id
      });
    } catch (err) {
      console.error('提交个人信息失败:', err);
      wx.showToast({ title: '提交个人信息失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 监听姓名输入框变化
  onNameChange(e) {
    this.setData({
      "userInfo.name": e.detail.value
    });
  },

  // 监听性别选择变化
  onSexChange(e) {
    this.setData({
      "userInfo.sex": this.data.sexOptions[e.detail.value]
    });
  },
  // 监听校区变化
  onCampusChange(e) {
    const index = e.detail.value;
    this.setData({
      "userInfo.campusId": index
    });
  }
});