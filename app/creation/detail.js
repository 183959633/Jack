"use strict";

import React, { Component } from "react";
import {
	Text,
	View,
	Image,
	StyleSheet,
	Dimensions,
	ActivityIndicator,
	TouchableOpacity,
	ListView,
	FlatList,
	TextInput,
	Modal,
	AlertIOS,
	Button
} from "react-native";

const WIDTH = Dimensions.get("window").width
const Video = require("react-native-video").default

import Icon from "react-native-vector-icons/Ionicons"
import config from "../common/config.js"
import request from "../common/request.js"
const cachedResults = {
	nextPage: 1,
	items: [],
	total: 0
}
export default class Detail extends Component {
	constructor(props) {
		super(props)
		let data = this.props.data
		this.state = {
			data: data,
			rate: 1,//0暂停,1播放
			animationType: "none",
			modalVisible: false,
			videoOk: true,
			content: "",//默认留言
			isSending: false,//评论请求是否发送
			pauesd: false,//默认不暂停
			videoProgress: 0.01,//进度条
			videoTotal: 0,//视频总时间
			currentTime: 0,//已经播放的时间
			muted: false,
			repeat: false,
			playing: false,
			videoLoaded: false,
			resizeMode: "contain",
			FlatData: []
		}
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
		if (!this.state.videoLoaded) {
			this.setState({
				videoLoaded: true
			})
		}
		let duration = data.playableDuration//获取视频总时间
		let currentTime = data.currentTime//视频当前播放时间
		let percent = Number((currentTime / duration).toFixed(2))
		let newState = {
			videoTotal: duration,
			currentTime: Number(currentTime.toFixed(2)),
			videoProgress: percent
		}
		if (!this.state.videoLoaded) {
			newState.videoLoaded = true
		}
		if (!this.state.playing) {
			newState.playing = true
		}
		this.setState(newState)
	}
	_onEnd = () => {//视频结束
		this.setState({
			playing: false,
			repeat: true,
			videoProgress: 1.00
		})
		console.log("_onEnd==" + JSON.stringify(this.state))
	}
	_onError = (e) => {//视频出错时
		this.setState({
			videoOk: false
		})
		console.log("出错了==" + e)
	}
	_pause = () => {//暂停
		if (!this.state.pauesd) {
			this.setState({
				pauesd: true,
				rate: 0
			})
		}
	}
	_replay = () => {//重新播放
		this.refs.videoPlayer.seek(0)
	}

	_resume() {//继续播放
		if (this.state.pauesd) {
			this.setState({
				pauesd: false,
				rate: 1
			})
		}
	}
	_hasMore = () => {
		return cachedResults.items.length !== cachedResults.total
	}
	_fetchMoreData = () => {
		if (!this._hasMore() || this.state.isLoadingTail) {
			return
		}
		var page = cachedResults.nextPage
		this._fetchData(page)
	}
	_renderHeader = () => {
		let that = this
		let data = this.props.data
		return (
			<View style={[styles.listHeader]}>
				<View style={[styles.infoBox]}>
					<Image style={[styles.avatar]}
						source={{ uri: data.author.avatar }} />
					<View style={[styles.descBox]}>
						<Text style={[styles.nickname]}>{data.author.nickname}</Text>
						<Text style={[styles.title]}>{data.title}</Text>
					</View>
				</View>
				<View style={[styles.commentBox]}>
					<Text style={[styles.content]}
						onPress={that._showModal}>
						说点什么吧!
						</Text>
				</View>
				<View style={[styles.commentArea]}>
					<Text style={[styles.commentTitle]}>精彩评论...</Text>
				</View>
			</View>
		)
	}
	_renderFooter = () => {
		if (!this._hasMore() && cachedResults.total !== 0) {
			return (
				<View style={[styles.loadingMore]}>
					<Text style={styles.loadingText}>我是有底线的...</Text>
				</View>
			)
		}
		if (!this.state.isLoadingTail) {
			return <View style={styles.loadingMore} />
		}
		return <ActivityIndicator style={[styles.loadingMore]} />
	}
	componentDidMount() {
		this._fetchData(0)
	}
	_fetchData(page) {
		var that = this
		var url = config.api.base + config.api.comment
		request.get(url,
			{
				creation: 125,
				page: page,
				accessToken: "123a"
			})
			.then((data) => {
				if (data.success) {
					var items = cachedResults.items.slice()

					items = items.concat(data.dataMock)
					cachedResults.nextPage += 1
					cachedResults.items = items
					cachedResults.total = data.total

					setTimeout(() => {
						that.setState({
							isLoadingTail: false,
							FlatSource: cachedResults.items
						})
					}, 10)
				}
			})
			.catch((error) => {
				this.setState({
					isLoadingTail: false
				})
				console.warn(error)
			})
	}
	_setModalVisible(isVisible) {
		this.setState({
			modalVisible: isVisible
		})
	}
	_showModal = () => {
		this._setModalVisible(true)
		this.setState({
			content: "",
			modalVisible: true
		})
	}
	_closeModal = () => {
		this._setModalVisible(false)

		this.setState({
			modalVisible: false
		})
	}
	_submit = () => {
		var that = this
		if (!this.state.content) {
			return AlertIOS.alert("留言不能为空!")
		}
		if (this.state.isSending) {
			return AlertIOS.alert("正在评论中...")
		}
		that.setState({
			isSending: true
		}, () => {
			let body = {
				accessToken: "abc",
				creation: "123",
				content: that.state.content
			}
			var url = config.api.base + config.api.comment
			request.post(url, body)
				.then((data) => {
					if (data && data.success) {
						var items = cachedResults.items.slice()
						let content = that.state.content
						items = [{
							content: content,
							replyBy: {
								avatar: "https://dummyimage.com/640X640/8ac0c8",
								nickname: "综艺节目"
							}
						}].concat(items)
						cachedResults.items = items
						cachedResults.total += 1

						that.setState({
							// content: "",
							isSending: false,
							FlatSource: cachedResults.items
						})
						that._setModalVisible(false)
					}
				})
				.catch((e) => {
					console.log("==" + e)
					that.setState({
						isSending: false
					})
					that._setModalVisible(false)
					AlertIOS.alert("留言失败,稍后再试!")
				})
		})
	}
	_renderRow = (row) => {
		return (
			<View key={row.item._id}
				style={[styles.replyBox]}>
				<Image style={[styles.replyAvatar]} source={{ uri: row.item.replyBy.avatar }} />
				<View style={[styles.reply]}>
					<Text style={[styles.replyNickname]}>{row.item.replyBy.nickname}</Text>
					<Text style={[styles.replyContent]}>{row.item.content}</Text>
				</View>
			</View>
		)
	}
	render() {
		let data = this.props.data
		return (
			<View style={styles.container}>
				<View style={[styles.videoBox]}>
					<Video
						ref="videoPlayer"
						source={{ uri: this.state.data.video }}
						style={[styles.video]}
						volume={3}//声音放大系数
						pauesd={this.state.pauesd}//是否暂停
						rate={this.state.rate}//0暂停,1播放
						muted={this.state.muted}//静音
						repeat={this.state.repeat}//重复播放
						resizeMode={this.state.resizeMode}
						onLoadStart={this._onLoadStart}
						onLoad={this._onLoad}
						onProgress={this._onProgress}
						onEnd={this._onEnd}
						onError={this._onError}
					/>
					{
						!this.state.videoOk && <Text>视频出错了...</Text>
					}
					{
						!this.state.videoLoaded &&
						<ActivityIndicator
							color="#ff6600"
							style={[styles.loading]} />
					}
					{
						(this.state.videoLoaded && !this.state.playing)
							?
							<Icon
								onPress={this._replay}
								name="ios-refresh"
								size={48}
								style={[styles.playIcon]}
							/>
							: null
					}
					{
						this.state.videoLoaded && this.state.playing
							? <TouchableOpacity
								onPress={this._pause}
								style={[styles.pauseBtn]}>
								{
									this.state.pauesd
										? <Icon
											onPress={this._resume.bind(this)}
											style={[styles.resumeIcon]}
											name="ios-play"
											size={54}
										/> : <Icon
											onPress={this._pause}
											style={[styles.pauseIcon]}
											name="ios-pause"
											size={54}
										/>
								}
							</TouchableOpacity>
							: null
					}
					<View style={[styles.progressBox]}>
						<View style={[styles.progressBar, { width: WIDTH * this.state.videoProgress }]}></View>
					</View>
				</View>
				<FlatList
					ListHeaderComponent={this._renderHeader}
					ListFooterComponent={this._renderFooter}
					renderItem={this._renderRow}
					// refreshing={this.state.isRefreshing}
					// onRefresh={this._onRefresh}//下拉刷新
					onEndReachedThreshold={20}
					onEndReached={this._fetchMoreData}//上拉加载更多
					enableEmptySections={true}
					showsVerticalScrollIndicator={false}
					automaticallyAdjustContentInsets={false}
					data={this.state.FlatSource}>
				</FlatList>
				<Modal
					animationType={"fade"}//动画效果
					visible={this.state.modalVisible}>
					<View style={[styles.modalContainer]}>
						<Icon
							onPress={this._closeModal}//点击关闭
							name="ios-close-outline"
							style={[styles.closeIcon]} />
						<View style={[styles.commentBox]}>
							<TextInput
								style={[styles.content]}
								color="#000"
								placeholder="  随便写点什么吧🙃"//默认提示语
								multiline={true}//多行显示
								// onFocus={this._focus}//获得焦点时
								// onBlur={this._blur}//失去焦点时
								defaultValue={this.state.content}
								onChangeText={(text) => {
									this.setState({
										content: text
									})
								}}
							/>
						</View>

						<TouchableOpacity onPress={this._submit}>
							<View style={styles.submitBtn}>
								<Text style={{ fontSize: 18, color: 'white' }}>评论</Text>
							</View>
						</TouchableOpacity>

					</View>
				</Modal>
			</View>
		)
	}
}
var styles = StyleSheet.create({
	container: {
		flex: 1
	},
	header: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		width: WIDTH,
		height: 64,
		paddingTop: 10,
		paddingLeft: 10,
		paddingRight: 10,
		borderBottomWidth: 1,
		borderBottomColor: "cyan",
		backgroundColor: "white"

	},
	popBox: {
		position: "absolute",
		left: 12,
		top: 32,
		width: 50,
		alignItems: "center",
		flexDirection: "row",
	},
	headerTitle: {
		width: WIDTH - 120,
		textAlign: "center"
	},
	backIcon: {
		color: "#999",
		fontSize: 20,
		marginRight: 5,
	},
	backText: {
		color: "#999",
		backgroundColor: "white",
	},
	videoBox: {
		width: WIDTH,
		height: WIDTH * 0.56,
		backgroundColor: "white"
	}, video: {
		width: WIDTH,
		height: WIDTH * 0.56,
		backgroundColor: "white"
	},
	loading: {
		position: "absolute",
		left: WIDTH / 2,
		top: 96,
		backgroundColor: "transparent"
	},
	progressBox: {
		width: WIDTH,
		height: 2,
		backgroundColor: "#ccc",
	},
	progressBar: {
		width: 1,
		height: 2,
		backgroundColor: "#ff6600"
	},
	pauseBtn: {
		position: "absolute",
		left: 0,
		top: 0,
		width: WIDTH,
		height: WIDTH * 0.56
	},
	playIcon: {
		position: "absolute",
		top: 140,
		left: WIDTH / 2 - 30,
		width: 60,
		height: 60,
		paddingTop: 8,
		paddingLeft: 22,
		backgroundColor: "transparent",
		borderColor: "#fff",
		borderWidth: 2,
		borderRadius: 30,
		color: "#ed7b66"
	},
	resumeIcon: {
		// position: "absolute",
		marginTop: 140,
		marginLeft: 20,
		width: 60,
		height: 60,
		padding: 6,
		paddingLeft: 20,
		paddingTop: 3,
		backgroundColor: "transparent",
		borderColor: "#fff",
		borderWidth: 2,
		borderRadius: 30,
		color: "#ed7b66"
	},
	pauseIcon: {
		// position: "absolute",
		marginTop: 140,
		marginLeft: WIDTH - 80,
		width: 60,
		height: 60,
		padding: 6,
		paddingLeft: 16,
		paddingTop: 3,
		backgroundColor: "transparent",
		borderColor: "#fff",
		borderWidth: 2,
		borderRadius: 30,
		color: "#ed7b66"
	},
	infoBox: {
		width: WIDTH,
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 10
	},
	avatar: {
		width: 60,
		height: 60,
		marginRight: 10,
		marginLeft: 10,
		borderRadius: 30,
	},
	descBox: {
		flex: 1
	},
	nickname: {
		fontSize: 18,
	},
	title: {
		marginTop: 8,
		fontSize: 16,
		color: "#666"
	},
	replyBox: {
		flexDirection: "row",
		justifyContent: "flex-start",
		marginTop: 10
	},
	replyAvatar: {
		width: 40,
		height: 40,
		marginRight: 10,
		marginLeft: 10,
		borderRadius: 20
	},
	replyNickname: {
		color: "#666"
	},
	replyContent: {
		marginTop: 4,
		color: "#ff6600"
	}, reply: {
		flex: 1
	}, loadingMore: {
		marginVertical: 20
	},
	loadingText: {
		color: "cyan",
		textAlign: "center"
	},
	listHeader: {
		marginTop: 10,
		width: 10,
	},
	commentBox: {
		marginTop: 10,
		marginBottom: 10,
		padding: 8,
		width: WIDTH,
		backgroundColor: "#fff",
	},
	commentTitle: {
		fontSize: 16,
		color: "#ff6600",
		paddingLeft: 8
	},
	content: {
		paddingLeft: 14,
		paddingTop: 8,
		color: "#eee",
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		textAlign: "left",
		fontSize: 18,
		height: 40
	},
	commentArea: {
		width: WIDTH,
		paddingBottom: 6,
		paddingLeft: 10,
		paddingRight: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#eee"
	},
	modalContainer: {
		flex: 1,
		backgroundColor: "white"
	}, closeIcon: {
		marginTop: 20,
		alignSelf: "center",
		fontSize: 30,
		color: "#ee753c",
	},
	submitBtn: {
		width: WIDTH / 3,
		borderRadius: 10,
		marginTop: 30,
		height: 40,
		marginLeft: 128,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#ff735c'
	}

})