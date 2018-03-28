"use strict"
import React, { Component } from "react"
import {
	AppRegistry,
	StyleSheet,
	Text,
	View,
	Image
} from "react-native"

// import SwiperShow from "react-native-swiper"

export default class Swiper extends Component {
	constructor(props) {
		super(props)
		this.state={

		}
	}
	render(){
		return (
			<SwiperShow showsButtons={true}>
				<View style={styles.slide}>
					<Image style={[styles.slide]}
						source={require("../img/01_meitu.png")}/>
				</View>
				<View style={styles.slide}>
					<Image style={[styles.slide]}
						source={require("../img/02_meitu.png")}/>
				</View>
				<View style={styles.slide}>
					<Image style={[styles.slide]}
						source={require("../img/03_meitu.png")}/>
				</View>
			</SwiperShow>
		)
	}
}
const styles = StyleSheet.create({
	slide: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center"
	},
	text: {
		color: "#fff",
		fontSize: 30,
		fontWeight: "bold"
	}
})
