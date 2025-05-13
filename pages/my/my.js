const app = getApp();
const user = require("../../utils/user.js");
const { request } = require("../../utils/request");
Page({
  data: {
    login: {
      avatar: 'https://img0.baidu.com/it/u=3204281136,1911957924&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
      name: '点击登录',
      role : "0"
    }
  },

  onLoad(){
    if (user.isLoggedIn()) {
      const userInfo = user.getUserInfo();
      this.setData({
        login: {
          avatar: userInfo.avatar,
          name: userInfo.name,
          role : userInfo.role
        }
      });
    }
  },
  onShow(){
    if (user.isLoggedIn()) {
      const userInfo = user.getUserInfo();
      this.setData({
        login: {
          avatar: userInfo.avatar,
          name: userInfo.name,
          role : userInfo.role
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
            name: userInfo.name,
            role: userInfo.role
          }
        });
      } catch (err) {
        console.error("Login failed:", err);
      }
    }
  },

  async uploadAvatar() {
    try {
      // 选择图片
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
      // console.log("this is a user_token",user.getUserInfo().token )
      // 上传图片到服务器
      const uploadTask = wx.uploadFile({
        url: app.globalData.URL + 'upload',
        filePath: compressRes.tempFilePath,
        name: 'file', // 文件字段名，必须与后端接口一致
        header: {
          'user_token': user.getUserInfo().token // 添加 user_token 到请求头
        },
        formData: {
          userId: user.getUserInfo().id // 其他表单数据
        },
        success: (res) => {
          const result = JSON.parse(res.data);
          console.log("this is a result:",result)
          if (result.code === 1) {
            // 更新用户头像
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
      console.error('选择图片失败:', err);
      wx.showToast({ title: '操作取消', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  
  async logout(){

    if(user.getUserInfo()){
      const serverRes = await request({
        url : app.globalData.URL+"user/user/logout",
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
    }else{
      wx.showToast({
        title: '用户未登录，无需退出',
        icon: 'none',
      });
    }


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
      url: '/pages/path/path'
    });
  },

  toAdminPoint(e){
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url:`/pages/adminpoint/adminpoint?type=${type}`
    })
  },
  toUser(){
    wx.navigateTo({
      url: '/pages/User/User'
    })
  }

});