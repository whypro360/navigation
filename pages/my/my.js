const app = getApp();
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
login() {
  // 调用 wx.login 获取临时登录凭证 code
  wx.login({
    success: (res) => {
      if (res.code) {
        console.log('临时登录凭证 code:', res.code);

        // 将 code 发送到开发者服务器
        wx.request({
          url: 'http://localhost:8080/user/user/login', // 替换为你的服务器接口地址
          method: 'POST',
          data: {
            code: res.code,
          },
          success: (serverRes) => {
            console.log('服务器返回数据:', serverRes.data);

            // 假设服务器返回的数据格式如下：
            // {
            //   openid: '用户的唯一标识',
            //   unionid: '用户在开放平台的唯一标识（可选）',
            //   session_key: '会话密钥'
            // }

            const { openid, unionid, session_key } = serverRes.data;

            if (openid && session_key) {
              // 保存用户登录态到本地存储或全局状态中
              wx.setStorageSync('userInfo', {
                openid,
                unionid,
                session_key,
              });

              // 提示用户登录成功
              wx.showToast({
                title: '登录成功',
                icon: 'success',
              });

              // 更新页面状态（如果需要）
              this.setData({
                login: {
                  show: true,
                  avatar: '', // 可以根据需求设置默认头像
                },
              });
            } else {
              wx.showToast({
                title: '登录失败，请重试',
                icon: 'none',
              });
            }
          },
          fail: (err) => {
            console.error('请求服务器失败:', err);
            wx.showToast({
              title: '网络错误，请检查连接',
              icon: 'none',
            });
          },
        });
      } else {
        console.error('获取 code 失败:', res.errMsg);
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none',
        });
      }
    },
    fail: (err) => {
      console.error('wx.login 调用失败:', err);
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none',
      });
    },
  });
},
  // // 登录监听
  // chooseAvatar(e) {
  //   this.setData({
  //     login: {
  //       show: true,
  //       avatar: e.detail.avatarUrl,
  //     }
  //   })
  // },
  // 基本信息
  basicClick() {
    console.log('基本信息监听');
  },
  // 匿名反馈
  feedbackClick() {
    console.log('匿名反馈监听');
  },
  // 关于我们
  aboutClick() {
    console.log('关于我们监听');
  },
  // 退出监听
  exitClick() {
    let that = this;
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success(res) {
        if (res.confirm) {
          that.setData({
            login: {
              show: false,
              avatar: 'https://img0.baidu.com/it/u=3204281136,1911957924&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
            }
          })
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
