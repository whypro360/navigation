// user.js
const app = getApp();

// 获取用户信息
function getUserInfo() {
  return wx.getStorageSync('userInfo') || null;
}

// 设置用户信息
function setUserInfo(userInfo) {
  wx.setStorageSync('userInfo', userInfo);
}

// 清除用户信息
function clearUserInfo() {
  wx.removeStorageSync('userInfo');
}

// 检查是否已登录
function isLoggedIn() {
  return !!getUserInfo();
}

module.exports = {
  getUserInfo,
  setUserInfo,
  clearUserInfo,
  isLoggedIn,
};