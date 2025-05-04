// app.js
const user = require("/utils/user.js");
const { request } = require("/utils/request");

const url = ['localhost','192.168.54.134','47.111.107.231']

App({
  globalData: {
    URL: `http://${url[0]}:8080/`
    // URL:'https://sshnavigation.dpdns.org'
  },

  // 修改 app.js 的 wxLogin 方法
  wxLogin() {
    return new Promise(async (resolve, reject) => {
      try {
        const loginRes = await new Promise((resolve, reject) => {
          wx.login({
            success: resolve,
            fail: reject
          });
        });
        if (!loginRes.code) {
          console.error('获取 code 失败:', loginRes.errMsg);
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
          reject(loginRes);
          return;
        }
        console.log('临时登录凭证 code:', loginRes.code);
        const serverRes = await request({
          url: `http://${url[0]}:8080/user/user/login`,//
          method: 'POST',
          data: {
            code: loginRes.code
          }
        });

        console.log('服务器返回数据:', serverRes);
        const userInfo = serverRes.data;
        if (userInfo) {
          user.setUserInfo(userInfo);
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
          resolve(userInfo); // 登录成功，返回 userInfo
        } else {
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
          reject(new Error('Login failed'));
        }
      } catch (err) {
        console.error('请求服务器失败:', err);
        wx.showToast({
          title: '网络错误，请检查连接',
          icon: 'none'
        });
        reject(err);
      }
    });
  }
})
