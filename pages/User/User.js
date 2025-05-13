// pages/User/User.js
const app = getApp();
const { request } = require("../../utils/request");
const fetchCampus = require("../../utils/getCampus");

Page({
  /**
   * 页面的初始数据
   */
  data: {
    users: [],              // 存储所有用户数据
    userNames: [],          // 下拉框显示的用户名列表
    selectedIndex: 0,       // 当前选中的用户索引
    selectedUser: {}        // 当前选中的用户对象
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad:async function() {
    const campus = await fetchCampus.fetchCampusType();
    this.setData({
      campusesType:campus.map(item=>({
        id:item.id,
        name:item.name,
        description:item.description
      }))
    })
    this.fetchUsers();
  },

  /**
   * 获取用户列表
   */
  async fetchUsers() {
    try {
      wx.showLoading({ title: '加载用户信息中...' });

      const serverRes = await request({
        url: app.globalData.URL + 'admin/get_users',
        method: 'GET'
      });

      console.log('获取到的用户信息：', serverRes.data);

      if (serverRes && serverRes.data && Array.isArray(serverRes.data)) {
        const users = serverRes.data;
        const userNames = users.map(user => user.name);

        this.setData({ users, userNames });

        // 默认选中第一个用户
        if (users.length > 0) {
          this.selectUser(0);
        }
      } else {
        throw new Error('返回的数据格式不正确');
      }

    } catch (err) {
      console.error('获取用户信息失败:', err);
      wx.showToast({ title: '获取用户信息失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 选择用户事件
   */
  onUserSelect(e) {
    const index = e.detail.value;
    this.selectUser(index);
  },

  /**
   * 根据索引设置当前选中用户
   */
  selectUser(index) {
    const user = this.data.users[index] || {};
    this.setData({
      selectedIndex: index,
      selectedUser: { ...user }  // 深拷贝一份用于编辑
    });
  },

  /**
   * 输入框内容变化事件
   */
  onCampusChange(e) {
    const index = e.detail.value;
    this.setData({
      "selectedUser.campusId": index
    });
  },
  
  // 修改性别
  onSexChange(e) {
    const sexes = ['男', '女'];
    const index = e.detail.value;
    const sex = sexes[index];
    this.setData({
      'selectedUser.sex': sex
    });
  },

  // 修改角色
  onRoleChange(e) {
    const roles = ['0', '1']; // 1: 管理员，0: 普通用户
    const index = e.detail.value;
    const role = roles[index];
    this.setData({
      'selectedUser.role': role
    });
  },

  // 修改状态
  onStatusChange(e) {
    const status = e.detail.value  ? 1 : 0;
    // console.log("this is a status",status);
    this.setData({
      'selectedUser.status': status
    });
  },

  /**
   * 提交修改
   */
  async submitChanges() {
    this.data.selectedUser.campus = this.data.campusesType[this.data.selectedUser.campusId].id;
  
    try {
      wx.showLoading({ title: '提交中...' });
  
      const res = await request({
        url: app.globalData.URL + 'admin/update_user',
        method: 'POST',
        data: this.data.selectedUser 
      });
  
      console.log('用户信息更新成功:', res);
      wx.hideLoading();
      wx.showToast({ title: '保存成功' });

      const users = [...this.data.users];
      users[this.data.selectedIndex] = this.data.selectedUser;
      this.setData({ users });
  
    } catch (err) {
      console.error('提交用户信息失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});