const app = getApp();
const user = require("../../utils/user.js");
const { request } = require("../../utils/request");

Page({
  data: {
    latitude: null,
    longitude: null,
    name: '',
    describe: '', 
    types: [], 
    typeMap: {}, 
    selectedType: '',
    selectedTypeId: null ,// 存储选中的点位类型的ID
    image:''
  },

 onLoad(){
    // 页面加载时获取点位类型
    this.fetchPointTypes();
 },
  // 获取点位类型
  async fetchPointTypes() {
    try {
      wx.showLoading({ title: '加载中...' });
      const serverRes = await request({
        url: app.globalData.URL+'navigation/pointType',
        method: 'GET',
      });
      console.log('获取到的点位类型对象:', serverRes.data);
      // 提取 typeName 并更新 types
      const types = serverRes.data.map(item => item.typeName);
      // 建立 typeName 到 id 的映射
      const typeMap = serverRes.data.reduce((acc, item) => {
        acc[item.typeName] = item.id;
        return acc;
      }, {});

      this.setData({
        types: types,
        typeMap: typeMap,
      });

      wx.hideLoading();
    } catch (err) {
      console.error('获取点位类型失败:', err);
      wx.showToast({ title: '获取点位类型失败', icon: 'none' });
      wx.hideToast();
    }
  },
 
  // 下拉框选择事件
  onTypeChange(e) {
    const selectedType = this.data.types[e.detail.value];
    const selectedTypeId = this.data.typeMap[selectedType];
    
    this.setData({
      selectedType: selectedType,
      selectedTypeId: selectedTypeId
    });
  },
  onInputName(e) {
    this.setData({ name: e.detail.value });
  },
  onDescribe(e) {
    this.setData({ describe: e.detail.value });
  },



  handleGetLocation() {
    // 第一步：检查用户授权状态[2,5](@ref)
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => this._getActualLocation(),
            fail: () => this._showAuthGuide()
          });
        } else {
          this._getActualLocation();
        }
      }
    });
  },

  // 实际获取位置的方法
  _getActualLocation() {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        // 错误处理[2,5](@ref)
        console.error('定位失败', err);
        wx.showToast({
          title: '定位失败，请检查权限或GPS',
          icon: 'none'
        });
      }
    });
  },

  // 授权引导方法
  _showAuthGuide() {
    wx.showModal({
      title: '需要位置权限',
      content: '请前往设置开启地理位置权限',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) {
          // 打开设置页面[5](@ref)
          wx.openSetting({
            success: (res) => {
              if (res.authSetting['scope.userLocation']) {
                this._getActualLocation();
              }
            }
          });
        }
      }
    });
  },

  // 选择图片
  chooseImage() {
    const that = this;
    wx.chooseMedia({
      count: 1, // 设置只能选择一张图片
      mediaType: ['image'], // 限制只能选择图片
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success(res) {
        // 返回选定照片的本地文件路径，tempFilePath可以作为img标签的src属性显示图片
        const tempFilePath = res.tempFiles[0].tempFilePath;
        that.setData({
          image: tempFilePath
        });
      }
    });
  },

  // 预览图片
  previewImage() {
    wx.previewImage({
      current: this.data.image, // 当前显示图片的http链接
      urls: [this.data.image] // 需要预览的图片http链接列表
    });
  },

  // 删除图片
  deleteImage() {
    this.setData({
      image: ''
    });
  },

  async submitData() {
    if (!this.data.name || !this.data.latitude) {
      return wx.showToast({ title: '请填写名称并获取坐标', icon: 'none' });
    }

    wx.showLoading({ title: '上传中...' });
    try {

      //先上传图片获取url
      var pic_url = this.data.image
      if (pic_url){
        // 压缩图片
        const compressRes = await new Promise((resolve, reject) => {
          wx.compressImage({
            src: pic_url,
            quality: 80,
            success: resolve,
            fail: reject
          });
        });
        //上传图片
        const uploadTask = wx.uploadFile({
          url: app.globalData.URL + 'upload',
          filePath: compressRes.tempFilePath,
          name: 'file', 
          header: {
            'user_token': user.getUserInfo().token 
          },
          formData: {
            userId: user.getUserInfo().id 
          },
          success: (res) => {
            const result = JSON.parse(res.data);
            console.log("this is a result:",result)
            this.setData({image:result.data})
            if (result.code === 1) {
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
        wx.showToast({ title: '上传成功' });
      }
      await request({
        url: app.globalData.URL+'navigation/point',
        method: 'POST',
        data: {
          name: this.data.name,
          latitude: this.data.latitude,
          longitude: this.data.longitude,
          description: this.data.describe,
          campusId: 1,
          typeId: this.data.selectedTypeId,
          picUrl:this.data.image
        },
      });
      wx.showToast({ title: '上传成功' });
    } catch (err) {
      console.error('上传失败:', err);
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

});