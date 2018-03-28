"use strict"
import React, { Component } from "react"
import {
	Text,
	View,
	StyleSheet,
	Dimensions,
	Image,
	Modal,
	AlertIOS,
	TextInput,
	AsyncStorage,
	TouchableOpacity
} from "react-native"

const WIDTH = Dimensions.get("window").width
import { Navigation } from 'react-native-navigation'
import Icon from "react-native-vector-icons/Ionicons"
import ImagePicker from "react-native-image-picker"
import * as Progress from 'react-native-progress'
import sha1 from "sha1"
import uuid from "uuid"
import request from "../common/request.js"
import config from "../common/config.js"
import Login from "./login.js"
Navigation.registerComponent('Login', () => Login)
const options = {
	title: "选择头像",
	cancelButtonTitle: "取消",
	takePhotoButtonTitle: "拍照",
	chooseFromLibraryButtonTitle: "选择相册",
	quality: 0.75,
	allowsEditing: true,
	noData: false,
	storageOptions: {
		skipBackup: true,
		path: "images"
	}
}

function avatar(id, type) {
	if (id.indexOf("http") > -1) {
		return id
	}
	if (id.indexOf("data:image") > -1) {
		return id
	}
	if (id.indexOf("avatar/") > -1) {
		return config.cloudinary.base + type + "/upload/" + id
	}
	return "http://otqy7jkjh.bkt.clouddn.com" + id
}
export default class Account extends Component {
	static navigatorStyle = {
		navBarBackgroundColor: "#ff735c"
	}
	static navigatorButtons = {
		rightButtons: [
			{
				title: '编辑',
				id: 'edit',
				testID: 'e2e_rules',
				disabled: false,
				disableIconTint: false,
				showAsAction: 'ifRoom',
				buttonColor: 'white',
				buttonFontSize: 18,
				buttonFontWeight: '400'
			}
		]
	}
	_onNavigatorEvent = (event) => {
		// ScreenChangedEvent
		// NavBarButtonPress
		if (event.type == 'NavBarButtonPress') {
			if (event.id === 'edit') {
				this._edit()
			}
		}
	}
	constructor(props) {
		super(props)
		let user = this.props.user || {}
		this.props.navigator.setOnNavigatorEvent(this._onNavigatorEvent)
		this.state = {
			user: user,
			avatarProgress: 0,
			avatarUploading: false
		}
	}
	componentDidMount = () => {
		let that = this
		AsyncStorage.getItem("user")
			.then((data) => {
				let user
				if (data) {
					user = JSON.parse(data)
				}
				if (user && user.accessToken) {
					that.setState({
						user: user
					})
				}
			})
	}
	//图片上传到七牛服务器
	_getQiniuToken = (key, accessToken) => {
		let url = config.api.base + config.api.signature
		let body = {
			key: key,
			accessToken: accessToken
		}
		return request.post(url, body)
			.catch((e) => {
				console.log("e==" + e)
			})
	}
	//图片上传到cloudinary服务器
	_pickPhoto = () => {
		let that = this
		ImagePicker.showImagePicker(options, (response) => {
			console.log('Response = ', JSON.stringify(response))

			if (response.didCancel) {
				return
				console.log('User cancelled image picker')
			}
			// let avatarData = "data:image/jpeg;base64," + response.data
			let avatarData = "data:image/png;base64," + response.data

			let timestamp = Date.now()
			let tags = "app,avatar"
			let folder = "avatar"
			let url = config.api.base + config.api.signature
			let accessToken = this.state.user.accessToken
			let body = {
				tags: tags,
				type: "avatar",
				folder: folder,
				timestamp: timestamp,
				accessToken: accessToken
			}

			//七牛服务器逻辑Start
			// let key = uuid.v4()
			// let uri = response.uri
			// that._getQiniuToken(key, accessToken)
			// 	.then((data) => {
			// 		if (data && data.success) {
			// 				//data.data
			// 				let token = data.data
			// 				let image_body = new FormData()
			// 				image_body.append("key", key),
			// 				image_body.append("token", token)
			// 				image_body.append("file", {
			// 					type: "image/png",
			// 					uri:uri,
			// 					name:key
			// 				})
			// 				that._upload(image_body)
			// 		}
			// 	})
			//七牛服务器逻辑End

			request.post(url, body)
				.then((data) => {
					if (data && data.success) {
						//data.data
						let signature = "folder=" + folder + "&tags=" + tags
							+ "&timestamp=" + timestamp + config.cloudinary.api_secret

						signature = sha1(signature)
						let image_body = new FormData()
						image_body.append("folder", folder)
						image_body.append("signature", signature)
						image_body.append("tags", tags)
						image_body.append("timestamp", timestamp)
						image_body.append("api_key", config.cloudinary.api_key)
						image_body.append("resource_type", "image")
						image_body.append("file", avatarData)

						that._upload(image_body)
					}
				})
				.catch((e) => {
					console.log("e==" + e)
				})
		})
	}
	_upload(body) {
		let that = this
		let xhr = new XMLHttpRequest()
		//cloudinary服务器地址Start
		let url = config.cloudinary.image

		//七牛服务器地址Start
		// let url = config.qiniu.upload

		that.setState({
			avatarUploading: true,
			avatarProgress: 0
		})

		xhr.open("POST", url)
		xhr.onload = () => {
			if (xhr.status !== 200) {
				AlertIOS.alert("请求失败!")
				console.log("xhr.responsetext==" + xhr.responseText)
				return
			}
			if (!xhr.responseText) {
				// AlertIOS.alert("请求失败!")
				console.log("xhr.responsetext==" + xhr.responseText)
				return
			}
			let response
			try {
				response = JSON.parse(xhr.response)
			} catch (e) {
				console.log("e失败==" + e)
			}
			if (response && response.public_id) {
				let user = this.state.user
				user.avatar = response.public_id

				that.setState({
					avatarProgress: 0,
					avatarUploading: false,
					modalVisible: false,//默认Modal视图不可见
					user: user
				})
				that._asyncUser(true)
			}
		}
		if (xhr.upload) {
			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					let percent = Number((event.loaded / event.total).toFixed(2))
					that.setState({
						avatarProgress: percent
					})
				}
			}

		}
		xhr.send(body)
	}
	_asyncUser = (isAvatar) => {
		let that = this
		let user = that.state.user
		let url = config.api.base + config.api.update

		if (user && user.accessToken) {
			request.post(url, user)
				.then((data) => {
					if (data && data.success) {
						let user = data.data
						if (isAvatar) {
							AlertIOS.alert("更新头像成功!")
						}

						that.setState({
							user: user
						}, () => {
							that._closeModal()
							AsyncStorage.setItem("user", JSON.stringify(user))
						})
					}
				})
				.catch((e) => {
					console.log("e==" + e)
				})
		}
	}
	_edit = () => {
		this.setState({
			modalVisible: true
		})
	}
	_closeModal = () => {
		this.setState({
			modalVisible: false
		})
	}
	_changeUserState = (key, value) => {
		let user = this.state.user
		user[key] = value
		this.setState({
			user: user
		})
	}
	_submit = () => {
		this._asyncUser()
	}
	_logout = () => {
		AsyncStorage.removeItem("user")
		Navigation.startSingleScreenApp({
			screen: {
				screen: 'Login',
				navigatorStyle: {
					navBarHidden: true
				}
			}
		})
	}
	componentWillUnmount() {
		options = null
		WIDTH = null
	}
	render() {
		let user = this.state.user
		return (
			<View style={styles.container}>

				{
					user.avatar
						?
						<View style={[styles.avatarContainer]}>
							<Text style={[styles.avatarTip]}>戳这里换头像</Text>
							<TouchableOpacity onPress={this._pickPhoto}
								style={[styles.avatarBox]}>
								{this.state.avatarUploading
									? <Progress.Circle
										size={75}
										// indeterminate={true}
										showsText={true}
										color="#ff6600"
										progress={this.state.avatarProgress}
									/>
									: <Image source={{ uri: avatar(user.avatar, "image") }}
										style={[styles.avatar]} />
								}
							</TouchableOpacity>
						</View>

						: <View style={[styles.avatarContainer]}>
							<Text style={[styles.avatarTip]}>添加狗狗头像</Text>
							<TouchableOpacity style={[styles.avatarBox]}
								onPress={this._pickPhoto}>
								{
									this.state.avatarUploading
										? <Progress.Circle
											size={75}
											// indeterminate={true}
											showsText={true}
											color="#ee735c"
											progress={this.state.avatarProgress}
										/>
										: <Image style={{ borderRadius: 10 }}>
											<Icon
												name="ios-cloud-upload-outline"
												style={[styles.plusIcon]} />
										</Image>
								}
							</TouchableOpacity>
						</View>
				}
				{
					this.state.modalVisible
						? <Modal
							animationType={"slide"}//动画效果
							// transparent ={false}//透明
							visible={this.state.modalVisible}>
							<View style={[styles.modalContainer]}>
								<Icon
									name="ios-close-outline"
									onPress={this._closeModal}//点击关闭
									style={[styles.closeIcon]}
								/>
								<View style={[styles.fieldItem]}>
									<Text style={[styles.label]}>昵称</Text>
									<TextInput
										placeholder={"输入你的昵称"}
										style={[styles.textField]}
										autoCapitalize={"none"}
										autoCorrect={false}
										defaultValue={user.nickname}
										onChangeTxet={(text) => {
											this._changeUserState("nickname", text)
										}}
									/>
								</View>
								<View style={[styles.fieldItem]}>
									<Text style={[styles.label]}>品种</Text>
									<TextInput
										placeholder={"狗狗的品种"}
										style={[styles.textField]}
										autoCapitalize={"none"}
										autoCorrect={false}
										defaultValue={user.breed}
										onChangeTxet={(text) => {
											this._changeUserState("breed", text)
										}}
									/>
								</View>
								<View style={[styles.fieldItem]}>
									<Text style={[styles.label]}>年龄</Text>
									<TextInput
										placeholder={"狗狗的年龄"}
										style={[styles.textField]}
										autoCapitalize={"none"}
										autoCorrect={false}
										defaultValue={user.age}
										onChangeTxet={(text) => {
											this._changeUserState("age", text)
										}}
									/>
								</View>
								<View style={[styles.fieldItem]}>
									<Text style={[styles.label]}>性别</Text>
									<Icon.Button
										onPress={() => { this._changeUserState("gender", "male") }}
										style={[styles.gender, user.gender === "male" && styles.genderChecked]}
										name="ios-paw">男</Icon.Button>
									<Icon.Button
										onPress={() => { this._changeUserState("gender", "felame") }}
										style={[styles.gender, user.gender === "felame" && styles.genderChecked]}
										name="ios-paw-outline">女</Icon.Button>
								</View>
								{
									<TouchableOpacity onPress={this._submit}>
										<View style={styles.btn}>
											<Text style={styles.btntext}>保存</Text>
										</View>
									</TouchableOpacity>
								}
							</View>
						</Modal>
						: null
				}
				{
					<TouchableOpacity onPress={this._logout}>
						<View style={styles.btn}>
							<Text style={styles.btntext}>退出登录</Text>
						</View>
					</TouchableOpacity>
				}

			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	toolbar: {
		flexDirection: "row",
		paddingTop: 25,
		paddingBottom: 12,
		backgroundColor: "#ee735c"
	},
	toolbarTitle: {
		flex: 1,
		fontSize: 16,
		color: "white",
		textAlign: "center",
		fontWeight: "400"
	},
	avatarContainer: {
		width: WIDTH,
		height: 140,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#666",
	},
	avatarBox: {
		marginTop: 15,
		alignItems: "center",
		justifyContent: "center"
	},
	avatarTip: {
		marginTop: 6,
		color: "#fff",
		backgroundColor: "transparent",
		fontSize: 14
	},
	avatar: {
		marginBottom: 15,
		width: WIDTH * 0.2,
		height: WIDTH * 0.2,
		resizeMode: "contain",
		borderRadius: WIDTH * 0.1
	},
	plusIcon: {
		padding: 20,
		paddingLeft: 25,
		paddingRight: 25,
		color: "#999",
		fontSize: 24,
		backgroundColor: "white"
	}, toolbarExtral: {
		position: "absolute",
		right: 18,
		top: 26,
		color: "white",
		textAlign: "right",
		fontSize: 14,
		fontWeight: "400"
	},
	modalContainer: {
		flex: 1,
		paddingTop: 80,
		backgroundColor: "#fff"
	},
	fieldItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		height: 50,
		paddingLeft: 15,
		paddingRight: 30,
		borderWidth: 2,
		borderColor: "#eee",
		// backgroundColor: "#ccc"
	},
	label: {
		color: "#f12",
		marginRight: 10

	},
	textField: {
		flex: 1,
		height: 50,
		color: "#666",
		fontSize: 14
	},
	closeIcon: {
		position: "absolute",
		width: 40,
		height: 40,
		fontSize: 32,
		right: 10,
		top: 30,
		color: "#ee735c"
	},
	btn: {
		marginTop: 50,
		width: WIDTH / 3,
		padding: 10,
		backgroundColor: "transparent",
		borderColor: "#ee735c",
		borderWidth: 2,
		borderRadius: 6,
		alignSelf: "center",
	}, btntext: {
		fontSize: 18,
		color: "#ee735c",
		textAlign: "center"
	},
	gender: {
		backgroundColor: "#ccc"
	},
	genderChecked: {
		backgroundColor: "#f12"
	}
})