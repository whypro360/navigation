// pages/info/info.js
const { request } = require("../../utils/request");
Page({
  data: {
    userInfo: {
      openid: "用户唯一标识",
      sex : null, 
      phone: "12345678901",
      id : 0,
      role : "用户"
    },
    sexOptions: ["男", "女"]
  },

  onLoad(){
    this.fetchUserInfo();
  },

  async fetchUserInfo(){
    try{
      wx.showLoading({ title: '加载个人信息中...' });
      const serverRes = await request({
        url: 'http://localhost:8080/user/user/getUserById',
        method:'GET'
      });
      console.log('获取到的个人信息：',serverRes.data);
      
      const {openid ,name ,sex , phone, id, role} = serverRes.data

      this.setData({
        userInfo :{
          openid : openid,
          name : name,
          sex : sex ,
          phone :phone,
          id : id,
          role : role
        }
      })

      wx.hideLoading();
    } catch (err) {
      console.error('获取个人信息失败:', err);
      wx.showToast({ title: '获取个人信息失败', icon: 'none' });
      wx.hideToast();
    }finally {
      wx.hideLoading();
    }
  },
  
  async updateUserInfo(){
    try{
      wx.showLoading({ title: '提交个人信息中...' });
      const serverRes = await request({
        url:"http://localhost:8080/user/user/updateUser",
        method:"POST",
        data:{
          id : this.data.userInfo.id,
          name : this.data.userInfo.name,
          phone : this.data.userInfo.phone,
          sex : this.data.userInfo.sex
        },
      });
      wx.showToast({ title: '上传成功' });
    } catch (err) {
      console.error('提交个人信息失败:', err);
      wx.showToast({ title: '提交个人信息失败', icon: 'none' });
      wx.hideToast();
    }finally {
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
  // 监听电话输入框变化
  onPhoneChange(e) {
    this.setData({
      "userInfo.phone": e.detail.value
    });
  }
});