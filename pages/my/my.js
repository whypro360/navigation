const app = getApp();
const user = require("../../utils/user.js");
const { request } = require("../../utils/request");

Page({
  /**
   * 页面的初始数据
   */
  data: {
    login: {
      show: false,
      avatar: 'https://img0.baidu.com/it/u=3204281136,1911957924&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
    }
  },

// 登录函数
async login() {
  try {
    const loginRes = await new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject,
      });
    });

    if (!loginRes.code) {
      console.error('获取 code 失败:', loginRes.errMsg);
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none',
      });
      return;
    }

    console.log('临时登录凭证 code:', loginRes.code);

    // 将 code 发送到开发者服务器
    const serverRes = await request({
      url: 'http://localhost:8080/user/user/login',
      method: 'POST',
      data: {
        code: loginRes.code,
      },
    });

    console.log('服务器返回数据:', serverRes);

    const userInfo = serverRes.data;
    if (userInfo) {
      user.setUserInfo(userInfo);

      // 提示用户登录成功
      wx.showToast({
        title: '登录成功',
        icon: 'success',
      });

      // 更新页面状态（如果需要）
      this.setData({
        login: {
          show: true,
          avatar: userInfo.avatar || '', // 可以根据需求设置默认头像
        },
      });
    } else {
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none',
      });
    }
  } catch (err) {
    console.error('请求服务器失败:', err);
    wx.showToast({
      title: '网络错误，请检查连接',
      icon: 'none',
    });
  }
},

  basicClick() {
    wx.navigateTo({
      url: '/pages/info/info',
      success:function(res){
        console.log("跳转基本信息界面成功")
      }
    });
  },

  resourced() {
    wx.navigateTo({
      url: '/pages/resource/resource',
      success: function (res) {
        console.log("跳转资源界面成功！");
      },
      fail: (res) => {},
      complete: (res) => {},
    });
  },

  feedbackClick() {
    console.log('匿名反馈监听');
  },

  aboutClick() {
    console.log('关于我们监听');
  },

  exitClick() {
    let that = this;
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success(res) {
        if (res.confirm) {
          const logout = () => {
            user.clearUserInfo();
            that.setData({
              login: {
                show: false,
                avatar: 'https://img0.baidu.com/it/u=3204281136,1911957924&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
              }
            });
          };
          logout();
        }
      }
    });
  },
});