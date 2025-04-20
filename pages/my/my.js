const app = getApp();
const user = require("../../utils/user.js");
const { request } = require("../../utils/request");

Page({
  /**
   * 页面的初始数据
   */
  data: {
    login: {
      avatar: 'https://img0.baidu.com/it/u=3204281136,1911957924&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
      name: '点击登录',
    }
  },


  onLoad(){
    if (user.isLoggedIn()) {
      const userInfo = user.getUserInfo();
      this.setData({
        login: {
          avatar: userInfo.avatar,
          name: userInfo.name
        }
      });
    }
  },

  async login(e) {
    if (user.isLoggedIn()) {
      console.log("点击修改头像");
      this.uploadAvatar();
    } else {
      try {
        const userInfo = await app.wxLogin(); 
        this.setData({
          login: {
            avatar: userInfo.avatar  || this.data.login.avatar,
            name: userInfo.name
          }
        });
      } catch (err) {
        console.error("Login failed:", err);
      }
    }
  },

  async uploadAvatar() {
    try {
      const { tempFiles } = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['album', 'camera'],
          maxDuration: 60,
          success: resolve,
          fail: reject
        });
      });
  
      if (!tempFiles.length) return;
  
      wx.showLoading({ title: '上传中...' });
  
      const tempFilePath = tempFiles[0].tempFilePath;
  
      // 压缩图片
      const compressRes = await new Promise((resolve, reject) => {
        wx.compressImage({
          src: tempFilePath,
          quality: 80,
          success: resolve,
          fail: reject
        });
      });
  
      try {
        // 使用 wx.uploadFile 上传文件
        const uploadTask = await request({
          url: 'http://localhost:8080/upload',
          filePath: compressRes.tempFilePath,
          method :"POST",
          name: 'file', 
          formData: {
            userId: user.getUserInfo().id
          },
          success: (res) => {
            const result = JSON.parse(res.data);
            if (result.code === 200) {
              const newUserInfo = { ...user.getUserInfo(), avatar: result.data };
              user.setUserInfo(newUserInfo);
              this.setData({ 'login.avatar': result.data });
              wx.showToast({ title: '上传成功', icon: 'success' });
            } else {
              wx.showToast({ title: result.message || '上传失败', icon: 'none' });
            }
          },
          fail: (err) => {
            console.error('上传失败:', err);
            wx.showToast({ title: '上传失败，请重试', icon: 'none' });
          }
        });
  
        // 监听上传进度
        uploadTask.onProgressUpdate((res) => {
          console.log(`上传进度：${res.progress}%`);
        });
  
      } catch (err) {
        console.error('上传失败:', err);
        wx.showToast({ title: '上传失败，请重试', icon: 'none' });
      }
  
    } catch (err) {
      console.error('选择图片失败:', err);
      wx.showToast({ title: '操作取消', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async logout(){
    const serverRes = await request({
      url : "http://localhost:8080/user/user/logout",
      method: "POST"
    })
    console.log("退出登录信息：",serverRes.data)
    user.clearUserInfo();
    wx.showToast({
      title: '退出登录成功',
      icon: 'success',
    });
    this.setData({
      login:{
        avatar: 'https://img0.baidu.com/it/u=3204281136,1911957924&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
        name: '点击登录'
      }
    })
  },
  

  toInfo() {
    wx.navigateTo({
      url: '/pages/info/info',
      success:function(res){
        console.log("跳转我的名片界面成功")
      }
    });
  },

  toPoint() {
    wx.navigateTo({
      url: '/pages/point/point',
      success: function (res) {
        console.log("跳转添加点位界面成功！");
      },
      fail: (res) => {},
      complete: (res) => {},
    });
  },

  toPath() {
    wx.navigateTo({
      url: '/pages/path/path',
      success: function (res) {
        console.log("跳转路线管理界面成功！");
      },
      fail: (res) => {},
      complete: (res) => {},
    });
  },

});