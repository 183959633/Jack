
"use strict";

import React, { Component } from "react"
import {
	AppRegistry,
	Text,
	View,
	StyleSheet,
	Linking,
	NetInfo,
	Platform,
	AsyncStorage,
	Image
} from "react-native"
import { Navigation } from 'react-native-navigation'
import Icon from "react-native-vector-icons/Ionicons"
import List from "../app/creation/index.js"      //视频列表
import Edit from "../app/edit/index.js"          //视频编辑
import Account from "../app/account/index.js"    //个人页面
import Login from "../app/account/login.js"
// import Detail from "../app/creation/detail.js"

Navigation.registerComponent('List', () => List)
Navigation.registerComponent('Edit', () => Edit)
Navigation.registerComponent('Account', () => Account)
Navigation.registerComponent('Login', () => Login)
const tabs = [{
	label: '',
	screen: 'List',//video-camera
	icon: require("./img/video-camera.png"),
	title: '列表页面',
}, {
	label: '',
	screen: 'Edit',
	icon: require('./img/ios-recording-outline.png'),
	title: '了解狗狗,从配音开始',
}, {
	label: '',
	screen: 'Account',
	icon: require('./img/More.png'),
	title: '我的账户',
}]
	AsyncStorage.getItem("user")
	.then((data) => {
		let user
		if (data) {
			user = JSON.parse(data)
			Navigation.startTabBasedApp({
				tabs,
				animationType: 'none',//add transition animation to root change: 'none', 'slide-down', 'fade'
				tabsStyle: {
					tabBarButtonColor: '#8a8a8a',//单个选项卡颜色
					tabBarSelectedButtonColor: '#ff6600',//单个选项卡选中时颜色
					tabFontFamily: 'BioRhyme-Bold',//选项卡字体类型
					tabBarBackgroundColor: '#eee',//tab选项卡背景色
				},
				appStyle: {
					orientation: "auto",   //Default: 'auto'. Supported values: 'auto', 'landscape', 'portrait'
					statusBarColor: '#002b4c',
				},
				passProps: {user:user}
			})
		}else{
			Navigation.startSingleScreenApp({
				screen: {
					screen: 'Login', // unique ID registered with Navigation.registerScreen
					navigatorStyle: {
						navBarHidden:true
					}
				}
			})
		}
	})
// export default class TabBarExample extends Component {

// 	_afterLogin = (user) => {
// 		let that = this
// 		user = JSON.stringify(user)
// 		AsyncStorage.setItem("user", user)
// 		that.setState({
// 			logined: true,
// 			user: user
// 		})
// 	}
// 	_logout = () => {
// 		AsyncStorage.removeItem("user")
// 		this.setState({
// 			user: {},
// 			logined: false
// 		})
// 	}
// 	_asyncAppStatus = () => {
// 		AsyncStorage.getItem("user")
// 			.then((data) => {
// 				let user
// 				let newState = {}
// 				if (data) {
// 					user = JSON.parse(data)
// 				}
// 				if (user && user.accessToken) {
// 					newState.user = user
// 					newState.logined = true
// 				} else {
// 					newState.logined = false
// 				}
// 				this.setState(newState)
// 			})
// 	}
// 	render() {

// 		return (
// 		<View style={styles.container}>
// 			<Text>{"是否联网: " +this.state.isCon}</Text>
// 			<Text>{"联网信息: " +this.state.conInfo}</Text>
// 			<Text>{"是否计费: " +this.state.isFree}</Text>
// 		</View>

// 	}
// 	//网络监听部分
// 	componentDidMount() {
// 		// this._asyncAppStatus()
// 		//监听网络是否链接
// 		NetInfo.isConnected.addEventListener("isCon", this.isCon.bind(this));
// 		//监听网络变化
// 		NetInfo.addEventListener("changeCon", this.changeCon.bind(this));
// 		//检查网络是否链接 返回true/fase
// 		NetInfo.isConnected.fetch().done((b) => {
// 			this.setState({
// 				isCon: b
// 			})
// 		})
// 		//网络链接的信息
// 		NetInfo.fetch().done((info) => {
// 			info
// 		})

// 		// 用于判断当前活动的连接是否计费
// 		NetInfo.isConnectionExpensive().then((state) => {
// 			this.setState({
// 				isFree: state
// 			})
// 		})
// 	}
// 	componentWillUnmount() {
// 		//移除监听
// 		NetInfo.isConnected.removeEventListener("isCon", this.isCon);
// 		NetInfo.removeEventListener("changeCon", this.changeCon);
// 	}
// 	isCon(b) {
// 		this.setState({
// 			isCon: b
// 		})
// 	}
// 	changeCon(info) {
// 		this.setState({
// 			conInfo: info
// 		})
// 	}
// }

