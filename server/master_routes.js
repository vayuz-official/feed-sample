var express = require('express');
const { JwtConfiguration } = require('./jwt/JwtConfiguration.js');
var router = express.Router();
var cors = require('cors');

var feedController = require('./feed/feed_apis.js');
router.post('/api/v1/createPost', JwtConfiguration.authenticateJWTwithUser, function(req, res){
    return feedController.create_post(req,res);
});
router.get('/api/v1/networkPosts', JwtConfiguration.authenticateJWTwithUser, function(req, res){
    return feedController.network_posts(req,res);
});


router.put('/api/v1/updatePost', JwtConfiguration.authenticateJWTwithUser, function(req, res){
    return feedController.update_post(req,res);
});

router.post('/api/v1/postLike', JwtConfiguration.authenticateJWTwithUser, function(req, res){
    return feedController.like_post(req,res);
});

router.get('/api/v1/postLikes', JwtConfiguration.authenticateJWTwithUser, function(req, res){
    return feedController.post_likes(req,res);
});

router.put('/api/v1/deletePost', JwtConfiguration.authenticateJWTwithUser, function(req, res){
    return feedController.delete_post(req,res);
});

router.get('/api/v1/fetchPost', JwtConfiguration.authenticateJWTwithUser, function(req, res){
    return feedController.fetch_post(req,res);
});
