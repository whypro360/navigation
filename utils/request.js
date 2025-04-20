// utils/request.js
const app = getApp();
const user = require("../utils/user");

function request(config) {
  const userInfo = user.getUserInfo();
  const token = userInfo && userInfo.token;

  return new Promise((resolve, reject) => {
    wx.request({
      url: config.url, // 确保 url 是字符串
      method: config.method || 'GET',
      data: config.data || {},
      header: {
        ...config.header,
        'user_token': token ? `${token}` : '',
      },
      success: (res) => {
        if (res.statusCode === 200) {
          // console.log('请求头中的 token:', token);
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
}
module.exports = {
  request,
};