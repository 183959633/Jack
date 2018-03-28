"use strict"
import React, { Component, PropTypes } from "react";
import {
	Text,
	View,
	StyleSheet,
	Dimensions,
	Image,
	AlertIOS,
	Platform,
	AsyncStorage,
	ProgressViewIOS,
	TouchableOpacity
} from "react-native"
const WIDTH = Dimensions.get("window").width
const HEIGHT = Dimensions.get("window").height
const Video = require("react-native-video").default
import { UIManager} from 'NativeModules'
import Toast from "react-native-toast"
import Icon from "react-native-vector-icons/Ionicons"
import ImagePicker from "react-native-image-picker"
import * as Progress from 'react-native-progress'
import config from "../common/config.js"
import request from "../common/request.js"
import { AudioRecorder, AudioUtils } from 'react-native-audio'
import _ from "lodash"
//七牛专属
import sha1 from "sha1"
import uuid from "uuid"
// import qiniu from "qiniu"
// qiniu.conf.ACCESS_KEY =config.qiniu.AK
// qiniu.conf.SECRET_KEY =config.qiniu.SK
const buckket = "jack"
const videoOptions = {
	title: "选择视频",
	cancelButtonTitle: "取消",
	takePhotoButtonTitle: "录制10'视频",
	chooseFromLibraryButtonTitle: "选择已有视频",
	videoQualitu: "medium",//中等视频质量
	durationLimit: 10,//允许录制10'
	mediaType: "video",//类型
	// quality: 0.75,//图片质量
	// allowsEditing: true,
	noData: false,
	storageOptions: {
		skipBackup: true,
		path: "images"
	}
}
const defaultData = {
	previewVideo: null,
	videoTotal: 0,//视频总时间
	currentTime: 0,//已经播放的时间
	muted: true,//状态音,

	//video
	video:null,
	repeat: false,
	videoLoaded: false,
	videoProgress: 0.01,//进度条
	videoUploadedProgress: 0.01,//进度条
	videoUploaded: false,//上传完成
	videoUploading: false,//上传中

	text: 'Go',
	dash: true,
	recording: false,//正在录制
	counting: false,//正在倒计时

	//Audio
	audio:null,
	audioPlaying: false,
	recordDeon: false,
	audioPath: AudioUtils.DocumentDirectoryPath + '/' + "jack.aac",
	audioUploadedProgress: 0.01,//进度条
	audioUploaded: false,//上传完成
	audioUploading: false,//上传中
}
export default class Edit extends React.Component {
	static navigatorStyle = {
		navBarBackgroundColor: "#ff735c"
	}
	static navigatorButtons = {
		rightButtons: [
			{
				title: '更换视频',
				id: 'change',
				testID: 'e2e_rules',
				disabled: false,
				disableIconTint: false,
				showAsAction: 'ifRoom',
				buttonColor: 'white',
				buttonFontSize: 14,
				buttonFontWeight: '400'
			}
		]
	}

	_onNavigatorEvent = (event) => {
		// ScreenChangedEvent
		// NavBarButtonPress
		// alert("=="+JSON.stringify(event))
		if (event.type == 'NavBarButtonPress') {
			if (event.id === 'change') {
				this._pickVideo()
			}
		}
	}

	constructor(props) {
		super(props)
		let user = this.props.user || {}
		this.props.navigator.setOnNavigatorEvent(this._onNavigatorEvent)
		let state = _.clone(defaultData)
		this.state = (state)
	}
	_onLoadStart() {//当视频开始加载的瞬间
		// if (!this.state.videoLoaded) {
		// 	this.setState({
		// 		videoLoaded: true
		// 	})
		// }
	}
	_onLoad = () => {//视频不断地加载

	}
	_onProgress = (data) => {//视频播放时每隔2.50秒执行一次

		let duration = data.playableDuration//获取视频总时间
		let currentTime = data.currentTime//视频当前播放时间
		let percent = Number((currentTime / duration).toFixed(2))

		this.setState({
			videoTotal: duration,
			currentTime: Number(currentTime.toFixed(2)),
			videoProgress: percent
		})
	}
	_onEnd = () => {//视频结束
		if (this.state.recording) {
			AudioRecorder.stopRecording()
			this.setState({
				recording: false,
				recordDeon: true,
				videoProgress: 1.00
			})
		}
	}
	_onError = (e) => {//视频出错时
		this.setState({
			videoOk: false
		})
		console.log("出错了==" + e)
	}
	_sendCode = () => {
		let time = 3
		if (this.state.dash) {
			this.sendTime = setInterval(() => {
				if (time > 0) {
					time--
					this.setState({
						text: time === 0 ? "Go" : `${time}`,
						dash: false
					})
				} else {
					clearInterval(this.sendTime)
					this.setState({
						text: '准备录制',
						dash: true
					})
				}
			}, 0)
		}
	}
	_record = () => {
		this.setState({
			videoProgress: 0,
			recording: true,
			recordDeon: false,
			counting: false
		})
		this._sendCode()
		AudioRecorder.startRecording()
		this.refs.videoPlayer.seek(0)
	}
	_counting = () => {

		if (!this.state.counting && !this.state.recording && !this.state.audioPlaying) {
			this.setState({
				counting: true
			})
			this.refs.videoPlayer.seek(this.state.videoTotal - 0.01)
		}
	}
	_finishRecording(didSucceed, filePath) {
		this.setState({ finished: didSucceed })
		console.log(`Finished recording of duration ${this.state.currentTime} seconds at path: ${filePath}`)
	}
	_preview = () => {
		if (this.state.audioPlaying) {
			AudioRecorder.stopRecording()
		}
		this.setState({
			videoProgress: 0,
			audioPlaying: true
		})
		AudioRecorder.startRecording()
		this.refs.videoPlayer.seek(0)
	}
	_initAudio = () => {
		let audioPath = this.state.audioPath
		AudioRecorder.prepareRecordingAtPath(audioPath, {
			SampleRate: 22050,
			Channels: 1,
			AudioQuality: "Hight",
			AudioEncoding: "aac",
			AudioEncodingBitRate: 32000
		})
		AudioRecorder.onProgress = (data) => {
			this.setState({ currentTime: Math.floor(data.currentTime) })
		}
		AudioRecorder.onFinished = (data) => {
			// Android callback comes in the form of a promise instead.
			if (Platform.OS === 'ios') {
				this._finishRecording(data.status === "OK", data.audioFileURL)
			}
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
		this._initAudio()
	}
	_uploadAudio = () => {
		let that = this
		this._getToken({
			type: "audio",
			timestamp: Date.now(),
			cloud: "cloudinary"
		})
			.catch((e) => {
				console.log("e==" + e)
			})
			.then((data) => {
				if (data && data.success) {
					//data.data
					let signature = "folder=" + folder + "&tags=" + tags
						+ "&timestamp=" + timestamp + config.cloudinary.api_secret

					signature = sha1(signature)
					let key = uuid.v4()
					let timestamp = Date.now()
					let tags = "app,avatar"
					let folder = "avatar"
					let video_body = new FormData()

					video_body.append("folder", folder)
					video_body.append("signature", signature)
					video_body.append("tags", tags)
					video_body.append("timestamp", timestamp)
					video_body.append("api_key", config.cloudinary.api_key)
					video_body.append("resource_type", "video")
					video_body.append("file", {
						type: "video/mp4",
						uri: that.state.audioPath,
						name: key
					})
					that._upload(video_body,"audio")
				}
			})
	}
	//视频上传到七牛服务器
	_getToken = (body) => {
		let accessToken = this.state.user.accessToken
		let url = config.api.base + config.api.signature
		body.accessToken = this.state.user.accessToken
		return request.post(url, body)
	}
	_pickVideo = () => {
		let that = this
		ImagePicker.showImagePicker(videoOptions, (response) => {
			console.log('Response = ', response)

			if (response.didCancel) {
				return
				console.log('User cancelled image picker')
			}
			let uri = response.uri
			let state = _.clone(defaultData)
			state.user = this.state.user
			state.previewVideo = uri
			this.setState(state)

			//七牛服务器逻辑Start
			that._getToken({
				type: "video",
				cloud: "qiniu"
			})
				.catch((e) => {
					console.log("e==" + e)
					AlertIOS.alert("上传出错!")
				})
				.then((data) => {
					if (data && data.success) {

						let token = "IcfURLhoh40GSa7m2z2IhVND7CGRVi2HFI72efQi:CxoT1Hz4I_qegrjbBUx8ZBHGZ7c=:eyJzY29wZSI6ImphY2siLCJkZWFkbGluZSI6MTUwMjA1ODg1M30="
						let video_body = new FormData()
						let key =uuid.v4()
						video_body.append("token", token),
							video_body.append("key", key),
							video_body.append("file", {
								type: "video/mp4",
								uri: uri,
								name: key
							})
						that._upload(video_body,"video")
					}
				})
			//七牛服务器逻辑End
		})
	}
	_upload(body,type) {
		let that = this
		let xhr = new XMLHttpRequest()
		//七牛服务器地址Start
		let url = config.qiniu.upload
		if (type==="audio") {
			url =config.cloudinary.audio
		}
		let state ={}
		state[type + "UploadedProgress" ] =0
		state[type + "Uploading" ] =true
		state[type + "Uploaded" ] = false
		that.setState(state)

		xhr.open("POST", url)
		xhr.onload = () => {
			if (xhr.status !== 200) {
				Toast.showLongCenter="上传失败!"
				console.log("xhr.responsetext==" + xhr.responseText)
				return
			}
			if (!xhr.responseText) {
				Toast.showLongCenter="请求失败!"
				console.log("xhr.responsetext==" + xhr.responseText)
				return
			}
			let response
			try {
				response = JSON.parse(xhr.response)
			} catch (e) {
				console.log("e失败==" + e)
			}
			if (response) {
				console.log("成功==" + JSON.stringify(response))
				let newState ={}
				newState[type] =response
				newState[type + "Uploading"] =false
				newState[type + "Uploaded"]  =true

				that.setState(newState)

				if (type==="video") {
					let updateURL =config.api.base + config.api[type]
					let accessToken =this.state.user.accessToken
					let updateBody ={
						accessToken :accessToken
					}
					updateBody[type] =response
					request.post(updateURL,updateBody)
					.catch((e)=>{
						console.log("e=="+e)
						// AlertIOS.alert("视频同步出错...")
					})
					.then((data)=>{
						if (!data  || !data.success) {
							// AlertIOS.alert("视频同步出错...")
						}
					})
				}
			}
		}
		if (xhr.upload) {
			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					let percent = Number((event.loaded / event.total).toFixed(2))
					let progressState ={}
					progressState[type + "UploadedProgress"] = percent
					that.setState(progressState)
				}
			}
		}
		xhr.send(body)
	}
	// componentWillUnmount() {
	// 	options = null
	// 	WIDTH = null
	// 	HEIGHT = null
	// }
	render() {
		return (
			<View style={[styles.container]}>

				<View style={[styles.page]}>
					{
						this.state.previewVideo
							? <View style={[styles.videoContainer]}>
								<View style={[styles.videoBox]}>
									<Video
										ref="videoPlayer"
										source={{ uri: this.state.previewVideo }}
										style={[styles.video]}
										volume={3}//声音放大系数
										pauesd={this.state.pauesd}//是否暂停
										rate={this.state.rate}//0暂停,1播放
										muted={this.state.muted}//静音
										repeat={this.state.repeat}//重复播放
										resizeMode={this.state.resizeMode}
										onLoadStart={this._onLoadStart.bind(this)}
										onLoad={this._onLoad}
										onProgress={this._onProgress}
										onEnd={this._onEnd}
										onError={this._onError}
									/>
									{
										!this.state.videoUploaded && this.state.videoUploading
											? <View style={[styles.progressTipBox]}>
												<ProgressViewIOS style={[styles.progressBar]}
													progressTintColor="#ee735c"
													progress={this.state.videoUploadedProgress} />
												<Text style={[styles.progressTip]}>正在生成静音视频,已完成{(this.state.videoUploadedProgress * 100).toFixed(2)}%</Text>
											</View>
											: null
									}
									{
										this.state.recording || this.state.audioPlaying
											? <View style={[styles.progressTipBox]}>
												<ProgressViewIOS style={[styles.progressBar]}
													progressTintColor="#cd1"
													progress={this.state.videoProgress} />
												{
													this.state.recording
														? <Text style={[styles.progressTip]}>音频录制中...</Text>
														: null

												}
											</View>
											: null
									}
									{
										this.state.recordDeon
											? <View style={[styles.previewBox]}>
												<Icon name="ios-mic"
													size={28}
													style={[styles.previewIcon]} />

												<Text style={[styles.previewText]}
													onPress={this._preview}>预览</Text>
											</View>
											: null
									}
								</View>
							</View>
							: <View style={[styles.uploadBox]}>
								<TouchableOpacity
									onPress={this._pickVideo}>
									<Image source={require("../img/Icon_1.png")}
										style={[styles.uploadIcon]} />
									<Text style={[styles.uploadTitle]}>点我上传视频</Text>
									<Text style={[styles.uploadDesc]}>建议时长不超过20'秒</Text>
								</TouchableOpacity>
							</View>
					}
					{
						this.state.videoUploaded
							? <View style={[styles.recordBox]}>
								<View style={[styles.recordIconBox, (this.state.recording || this.state.audioPlaying) && styles.recordIconOn]}>
									{
										this.state.counting && !this.state.recording
											? <View >
												<Text style={[styles.butIcon]}
													onPress={this._counting}>{this.state.text}</Text>
											</View>
											: <TouchableOpacity onPress={this._record}>
												<Icon name="ios-mic" style={[styles.recordIcon]} />
											</TouchableOpacity>
									}
								</View>
							</View>
							: null
					}
					{
						this.state.videoLoaded && this.state.recordDeon

							? <View style={[styles.uploadAudioBox]}>
								{
									!this.state.audioUploaded && !this.state.audioUploading
										? <Text style={[styles.uploadAudioText]}
											onPress={this._uploadAudio}>下一步
								</Text>
										: null
								}
								{this.state.audioUploading
									? <Progress.Circle
										size={60}
										showsText={true}
										color="#ff6600"
										progress={this.state.audioUploadedProgress}
									/>
									: null
								}
							</View>
							: null
					}
				</View>
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
	toolbarExtral: {
		position: "absolute",
		right: 18,
		top: 26,
		color: "white",
		textAlign: "right",
		fontSize: 14,
		fontWeight: "400"
	},
	page: {
		flex: 1,
		alignItems: "center",
		// backgroundColor: "#ff6600"
	},
	uploadBox: {
		marginTop: 90,
		width: WIDTH - 40,
		paddingBottom: 10,
		borderWidth: 2,
		borderRadius: 6,
		borderColor: "#ee735c"
	},
	uploadContainer: {
		marginTop: 20,
		height: 200
	}, uploadIcon: {
		width: 110,
		marginTop: 10,
		marginLeft: 20,
		resizeMode: "contain",
		// backgroundColor: "cyan"
	},
	uploadTitle: {
		position: "absolute",
		top: 100,
		left: 160,
		fontSize: 16,
		color: "#000",
		textAlign: "center"
	}, uploadDesc: {
		position: "absolute",
		top: 140,
		left: 160,
		fontSize: 12,
		color: "#999",
		textAlign: "center"
	},
	videoContainer: {
		width: WIDTH,
		justifyContent: "center",
		alignItems: "flex-start"
	},
	videoBox: {
		width: WIDTH,
		height: HEIGHT * 0.6
	},
	video: {
		width: WIDTH,
		height: HEIGHT * 0.6,
		backgroundColor: "#3333"
	}, progressTipBox: {
		position: "absolute",
		left: 0,
		bottom: 0,
		width: WIDTH,
		height: 30,
		backgroundColor: "rgba(244,244,244,0.65)"
	},
	progressTip: {
		color: "#333",
		width: WIDTH - 10,
		padding: 5
	}, progressBar: {
		width: WIDTH
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
	},
	recordBox: {
		marginTop: 20,
		width: WIDTH,
		height: 60,
		alignItems: "center"
	},
	recordIconBox: {
		width: 68,
		height: 68,
		borderRadius: 34,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "#fff",
		backgroundColor: "#ee735c"
	},
	recordIconOn: {
		backgroundColor: "#ccc"
	},
	recordIcon: {
		fontSize: 40,
		color: "white",
		backgroundColor: "transparent"
	},
	butIcon: {
		fontSize: 50,
		color: "#cd1",
		color: "white",
		backgroundColor: "transparent"
	}, previewBox: {
		position: "absolute",
		width: 80,
		height: 30,
		right: 10,
		bottom: 10,
		borderWidth: 2,
		borderColor: "#ee735c",
		borderRadius: 3,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center"
	},
	previewIcon: {
		marginRight: 5,
		color: "#ee735c"
	}, previewText: {
		fontSize: 18,
		color: "#ee735c"
	},
	uploadAudioBox: {
		width: WIDTH,
		height: 60,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center"
	},
	uploadAudioText: {
		width: WIDTH - 20,
		padding: 5,
		borderWidth: 5,
		borderColor: "#ee735c",
		borderRadius: 5,
		textAlign: "center",
		fontSize: 30,
		color: "#ee735c"
	}
})