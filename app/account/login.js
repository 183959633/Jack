'use strict'
import React, { Component } from "react"
import {
	Text,
	View,
	StyleSheet,
	TextInput,
	Dimensions,
	AlertIOS,
	AsyncStorage,
	NativeModules,
	TouchableOpacity
} from "react-native";
const WIDTH = Dimensions.get("window").width
import request from "../common/request.js"
import config from "../common/config.js"
import { Navigation } from 'react-native-navigation'
import List from "../creation/index.js"      //视频列表
import Edit from "../edit/index.js"          //视频编辑
import Account from "../account/index.js"    //个人页面
Navigation.registerComponent('List', () => List)
Navigation.registerComponent('Edit', () => Edit)
Navigation.registerComponent('Account', () => Account)
import Icon from "react-native-vector-icons/Ionicons"
import Toast from "react-native-toast"
const tabs = [{
	label: '',
	screen: 'List',//video-camera
	icon: require("../img/video-camera.png"),
	title: '列表页面',
}, {
	label: '',
	screen: 'Edit',
	icon: require('../img/ios-recording-outline.png'),
	title: '了解狗狗,从配音开始',
}, {
	label: '',
	screen: 'Account',
	icon: require('../img/More.png'),
	title: '我的账户',
}]
export default class Login extends Component {
	constructor(props) {
		super(props)
		this.state = {
			phoneNumber: "",
			verifyCode: "",
			codeSent: false,
			text: '获取验证码',
			dash: true,
			shouldStartCountting: false
		}
	}
	//手机号码校验
	_checkMobile(str) {
		let re = /^(13[0-9]{9})|(15[89][0-9]{8})$/
		if (!str) {
			return AlertIOS.alert("手机号不能为空!")
		}
		if (!re.test(str)) {
			return AlertIOS.alert("请输入正确格式的手机号码!")
		}
	}
	_sendCode = () => {
		this._checkMobile(this.state.phoneNumber)
		let time = 30
		if (this.state.dash) {
			this.sendTime = setInterval(() => {
				if (time > 0) {
					time--
					this.setState({ text: `重新获取(${time})s`, dash: false })
				} else {
					clearInterval(this.sendTime)
					this.setState({
						text: '获取验证码',
						dash: true
					})
				}
			}, 1000)
		}
	}
	_sendVerifyCode = () => {
		let that = this
		let phoneNumber = this.state.phoneNumber
		this._checkMobile(phoneNumber)
		NativeModules.MyCustomModule.getSMSSDK(
			{ 'SMS_key': 'SMS_phoneNumber', 'phoneNumber': phoneNumber },
			(error, events) => {
				if (!error && !events[0]) {
					this._sendCode()
					this.setState({
						// events: events
						verifyCode: true,
						codeSent: true,
						countingDone: false
					})
				} else if (events[0] === "300477") {
					AlertIOS.alert("SMS短信平台挂掉!")
				}
			}
		)
	}
	_submit = () => {
		let that = this
		let phoneNumber = this.state.phoneNumber
		let verifyCode = this.state.verifyCode
		if (!verifyCode) {
			return AlertIOS.alert("手机号或验证码不能为空!")
		}
		this._checkMobile(phoneNumber)
		let body = {
			phoneNumber: phoneNumber,
			verifyCode: verifyCode
		}
		let url = config.api.base + config.api.verify
		request.post(url, body)
			.then((data) => {
				if (data && data.success) {
					let user = JSON.stringify(data.data)
					AsyncStorage.setItem("user", user)
					NativeModules.MyCustomModule.getSMSSDK(
						{ 'SMS_key': 'SMS_verifyCode', 'verifyCode': verifyCode, 'phoneNumber': phoneNumber },
						(error, events) => {
							if (!error && !events[0]) {
								let user = JSON.stringify(data.data)
								AsyncStorage.setItem("user", user)
								Navigation.startTabBasedApp({
									tabs,
									animationType: 'none',//add transition animation to root change: 'none', 'slide-down', 'fade'
									tabsStyle: {
										tabBarButtonColor: '#8a8a8a',//单个选项卡颜色
										tabBarSelectedButtonColor: '#ff6600',//单个选项卡选中时颜色
										tabFontFamily: 'BioRhyme-Bold',//选项卡字体类型
										tabBarBackgroundColor: '#eee',//tab选项卡背景色
										tabBarHidden: true,
									},
									appStyle: {
										orientation: "auto",   //Default: 'auto'. Supported values: 'auto', 'landscape', 'portrait'
										statusBarColor: '#002b4c',
									},
									passProps: { user: user }
								})
							}
							else if (events[0] === "300468") {
								AlertIOS.alert("SMS验证码超时!")
							}
							else if (events[0] === "300256") {
								AlertIOS.alert("SMS验证码格式有误!")
							}
						}
					)
				} else {
					Toast.showShortBottom("登录失败")
				}
			})
			.catch((e) => {
				Toast.showShortBottom("网络异常"+e)				
			})
	}
	_countingDone = () => {
		this.setState({
			countingDone: true
		})
	}
	_requestSMSCode = (shouldStartCountting) => {
		return shouldStartCountting = !this.state.shouldStartCountting
	}
	render() {
		return (
			<View style={styles.container}>
				<Text style={[styles.title]}>快速登录</Text>
				<View style={[styles.signupBox]}>
					{
						<View style={[styles.verifyCodeBox]}>
							<TextInput placeholder="请输入手机号"
								autoCaptialize={"none"}
								autoCorrect={false}
								keyboardType="phone-pad"
								style={styles.inputField}
								onChangeText={(text) => {
									this.setState({
										phoneNumber: text
									})
								}} />
						</View>
					}
					{
						<View style={[styles.verifyCodeBox]}>
							<TextInput placeholder="请输入验证码"
								keyboardType="phone-pad"
								style={styles.inputField}
								onChangeText={(text) => {
									this.setState({
										verifyCode: text
									})
								}} />
							<Text style={[styles.conunt, !this.state.dash && styles.conuntSelect]}
								onPress={this._sendVerifyCode}>{this.state.text}</Text>
						</View>
					}
					{
						<TouchableOpacity onPress={this._submit}>
							<View style={styles.btn}>
								<Text style={styles.btntext}>登录</Text>
							</View>
						</TouchableOpacity>
					}
				</View>
			</View>
		)
	}
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	signupBox: {
		flex: 1,
		marginTop: 80,
	},
	title: {
		marginTop: 30,
		marginBottom: 20,
		fontSize: 20,
		textAlign: "center"
	},
	inputField: {
		width: 160,
		height: 20,
		marginLeft: 8,
		fontSize: 16,
		marginTop: 8,
		padding: 4
	},
	btn: {
		marginTop: 20,
		width: WIDTH / 3,
		padding: 10,
		backgroundColor: "transparent",
		borderColor: "#ee735c",
		borderWidth: 2,
		borderRadius: 6,
		alignSelf: "center"
	},
	btntext: {
		fontSize: 18,
		color: "#ee735c",
		textAlign: "center"
	},
	verifyCodeBox: {
		flexDirection: "row",
		height: 40,
		marginTop: 20,
		marginLeft: 50,
		marginRight: 50,
		backgroundColor: "transparent",
		justifyContent: "space-between",
		borderColor: "#ee735c",
		borderWidth: 2,
		borderRadius: 6,
	}, countBtn: {
		position: "absolute",
		right: 20,
		backgroundColor: "transparent",
		width: 80,
		height: 24,
		marginTop: 20,
		marginBottom: 4,
		borderRadius: 20
	},
	textStyle: {
		color: "cyan",
		fontSize: 16,
		marginTop: 2,
		padding: 2,
		textAlign: "center"
	},
	conunt: {
		position: "absolute",
		top: 8,
		right: 6,
		fontSize: 18,
		color: "#ee735c",
		textAlign: "center"
	},
	conuntSelect: {
		position: "absolute",
		top: 8,
		right: 6,
		fontSize: 18,
		color: "#ccc",
		textAlign: "center"
	},
})