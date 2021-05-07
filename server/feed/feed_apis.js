import { MailSender } from "../../MailSender";
import { NotificationSender } from "../../NotificationSender";
import { ErrorHandler } from "../error-handler/ErrorHandler";
import { JwtConfiguration } from "../jwt/JwtConfiguration";
import { Followers, Feed, User , AbusivePosts, UserComments, Likes} from "./../../../collections/collection.js";
var jwt = require("jsonwebtoken");
var Fiber = require("fibers");



exports.create_post = async function (req, res) {
    var content = req.body.content;
    var totalUploadedImages = req.body.totalUploadedImages;
    var metadata_post = req.body.metadata_post;
    var posted_by = req.body.posted_by;
    var obj = {
        'feed_id': 'feed_id_' + Date.now(),
        'content': content,
        'post_images': totalUploadedImages,
        'is_active': true,
        'metadata_post': metadata_post,
        'created_at': Date.now(),
        'created_by': posted_by,
        'total_likes': 0,
        'total_comments': 0,
        'metadata_details': req.body.metadata_details
    };
    Feed.insert(obj);

    var result = {};
    obj.user_data = User.find({
        user_id: posted_by
    }).fetch();
    if (obj.user_data[0]) {
        obj.user_data[0].feed_post_id = obj.feed_id;
        obj.user_liked = false;
    }
     result.code = 200;
     result.new_post = obj;
     result.message = "Feed Post created successfully";
     return res.status(200).send(result);
 };

exports.post_likes = async function (req, res) {
   
    let post_id = req.query.post_id;
    if(post_id !=undefined  ) {
        
        if(Feed.find({feed_id:post_id}).count() == 0){
            var result = {};
            result.code = 300;
            result.message = "Invalid Details";
            return res.status(200).send(result);
        }else{
            var allLikes = await  Likes.rawCollection()
            .aggregate([
              {
               $match: {
                 $and:[{post_id: post_id}, {is_active:true}]
                }
              },
              {
                $lookup: {
                  from: "user",
                  localField: "user_id",
                  foreignField: "user_id",
                  as: "user_details",
                },
              },
              {
                $project: {
                  'user_details.name': 1,
                  'user_details.email':1,
                  'user_details.user_type': 1,
                  'user_details.profile_picture': 1,
                  'user_details.headline': 1,
                  'user_details.gender': 1,
                },
              }
            ]).toArray();
            var result = {};
            result.code = 200;
            result.all_likes = allLikes;
            return res.status(200).send(result);
        }
    }else{
        var result = {};
            result.code = 300;
            result.message = "Invalid Details";
            return res.status(200).send(result);
    }
    
 };

exports.network_posts = async function (req, res) {
    var user_id = req.headers.user_id;
        var limit = req.query.limit;
        limit = parseInt(limit);
        // console.log(req.query);
        var userDetails = User.find({
            user_id: user_id
        }).fetch();
        
        var allFollowers = [];
        if (userDetails.length != 0) {
           var checkAllAbusivePosts = AbusivePosts.find(
                    {$or:[
                        {
                        user_id: user_id,
                        post_type: 'feed',
                        status: {
                            $in: [0, 1]
                        }
                },{
                    
                        post_type: 'feed',
                        status: {
                            $in: [1]
                        }
                }     
                ]
            }).fetch();
            var allAbusivePosts = [];
            for (var i = 0; i < checkAllAbusivePosts.length; i++) {
                allAbusivePosts.push(checkAllAbusivePosts[i].post_id);
            }
            
            var queryObj = [
                {
                    'is_active': true
                },
                {
                    created_at: {
                        $lte: Date.now()
                    }
                },
                {
                    feed_id: {
                        $nin: allAbusivePosts
                    }
                }
            ];
            if(req.query.tag == undefined){
                allFollowers = Followers.find({
                    $and: [{is_active: true}, 
                            {status: 1}, 
                            {user_id: user_id}],
                }, {
                    sort: {
                        created_at: -1
                    }
                }).fetch();
    
    
                var allNetworkUsers = []
                for (var i = 0; i < allFollowers.length; i++) {
                    var userIdToCheck = allFollowers[i].following_id;
                    allNetworkUsers.push(userIdToCheck);
                }
                allNetworkUsers.push(user_id);
                queryObj.push({
                    created_by: {
                      $in: allNetworkUsers,
                    },
                  });
            }else{
                const query = new RegExp("#" + req.query.tag,'i');   
                queryObj.push({
                    content: query
                });
            }
            

            // console.log(queryObj);
            var skip  = 0;
            if(skip  >= 8){
                skip = limit-8;
            }
            var data = Promise.await(Feed.rawCollection().aggregate([{
                    $match: {
                        $and: queryObj
                    }
                },
                {
                    $lookup: {
                        from: 'user',
                        localField: 'created_by',
                        foreignField: 'user_id',
                        as: 'user_data',
                    }
                },
                {
                    $sort: {
                        created_at: -1
                    }
                },
                {
                    $limit:  limit
                },
                {
                    $skip: skip
                },
            ]).toArray());
                for (var i = 0; i < data.length; i++) {
                    if (data[i].special_post != undefined && data[i].special_post) {
                         if (data[i].special_post_type == 'blog') {
                            var blog_details = Blogs.find({
                                blog_id: data[i].blog_id
                            }).fetch();
                            data[i].blog_details = blog_details;

                            var query = {
                                post_id: data[i].blog_id,
                                user_id: user_id,
                                is_active: true
                            }
                            var likeCount = Likes.find(query).count();
                            data[i].user_liked = likeCount > 0;
                            if (data[i].user_data[0]) {
                                data[i].user_data[0].feed_post_id = data[i].feed_id;
                            }
                        } else if (data[i].special_post_type == 'event') {
                            var event_details = Event.find({
                                event_id: data[i].event_id
                            }).fetch();
                            data[i].event_details = event_details;

                            var query = {
                                post_id: data[i].event_id,
                                user_id: user_id,
                                is_active: true
                            }
                            var likeCount = Likes.find(query).count();
                            data[i].user_liked = likeCount > 0;
                            if (data[i].user_data[0]) {
                                data[i].user_data[0].feed_post_id = data[i].feed_id;
                            }
                        }

                    } else {
                        var query = {
                            post_id: data[i].feed_id,
                            user_id: user_id,
                            is_active: true
                        }
                        var likeCount = Likes.find(query).count();
                        data[i].user_liked = likeCount > 0;
                        if (data[i].user_data[0]) {
                            data[i].user_data[0].feed_post_id = data[i].feed_id;
                        }

                        var query = {
                            post_id: data[i].feed_id,
                            created_by: user_id,
                            is_active: true
                        }
                        var userCommented = UserComments.find(query).count();
                        data[i].user_commented = userCommented > 0;
                    }
                }

                var result = {};
                result.code = 200;
                result.data = data;
                result.total_posts = Feed.find({
                    $and: [{
                            'is_active': true
                        },
                        {
                            created_by: {
                                $in: allNetworkUsers
                            }
                        },
                        {
                            created_at: {
                                $lte: Date.now()
                            }
                        }
                    ]
                }).count();
                result.message = "Feed Post returned successfully";
                return res.status(200).send(result);
        }
 };
exports.update_post = async function (req, res) {
   var user_id = req.headers.user_id;
   var feed_id = req.body.feed_id;
    var content = req.body.content;
    var checkIfFeedExists = Feed.find({
        created_by: user_id,
        feed_id: feed_id
    }).fetch();
    var result = {};
    if(checkIfFeedExists.length!=0){
        var resultUpdated = 0;
        if (checkIfFeedExists[0]) {
            resultUpdated = Feed.update({
                feed_id: checkIfFeedExists[0].feed_id
            }, {
                $set: {
                    content: content
                }
            });
        }
        var result = {};
        result.code = 200;
        result.data = resultUpdated;
        result.message = "Post Updated successfully";
    }else{
        result.code = 300;
        result.message = "Invalid details";
    }
    
    return res.status(200).send(result);
};

exports.like_post = async function (req, res) {
    var user_id = req.headers.user_id;
    var feed_id = req.body.feed_id;
    var liked = req.body.liked;
    var feedData = Feed.find({
        feed_id: feed_id,
        is_active: true
    }).fetch();
    if(feedData.length!=0){
        var result = {};
        var query = {
            post_id: feed_id,
            user_id: user_id,
        }
        var likeCount = Likes.find(query).count();
        var newLike = false;

        if (likeCount == 0) {
            query.is_active = true;
            query.post_type = 'feed_post';
            query.last_updated_at = Date.now();
            Likes.insert(query);
            newLike = true;
            result.code = 200;
            result.message = "Inserted Liked  ";
        } else if (likeCount != 0) {
            Likes.update(query, {
                $set: {
                    is_active: liked,
                    last_updated_at: Date.now()
                }
            })
            result.code = 200;
            result.message = "Updated Successfully  ";
        }
        if (newLike || liked) {
            var post_details = Feed.find({feed_id:query.post_id}).fetch();
            if(post_details.length!=0){
                var obj2 = {};
                obj2.notification_id = "notification_" + (Date.now());
                var notification_data = {};
                notification_data.action_required = false;
                obj2.notification_data = notification_data;
                obj2.notiifcation_sender_id = query.user_id;
                obj2.notification_receiver_id = post_details[0].created_by;
                obj2.notification_type = "FEED_POST_LIKE";
                if(query.user_id!=obj2.notification_receiver_id){
                    new NotificationSender().bindNotification(obj2);
                }
                    
            }
        }
        var totalLikes = 0;
        if (feedData[0]) {
            if (newLike) {

                totalLikes = feedData[0].total_likes + 1;
            } else {
                totalLikes = feedData[0].total_likes - 1;
            }
            result.user_liked = newLike;

            Feed.update({
                feed_id: feed_id,
            }, {
                $set: {
                    total_likes: totalLikes,
                    updated_at: Date.now()
                }
            });
        }
        return res.status(200).send(result);

    }else{
        return res.status(200).send({code:300,message:"Invalid details"});
    }
 };

 
exports.delete_post = async function (req, res) {
    var created_by = req.headers.user_id;
    var feed_id = req.body.feed_id;
    var checkIfFeedExists = Feed.find({
        feed_id: feed_id,
        created_by:created_by,
        is_active: true
    }).fetch();
    if(checkIfFeedExists.length!=0){
        resultUpdated = Feed.update({
            feed_id: checkIfFeedExists[0].feed_id
        }, {
            $set: {
                is_active: false
            }
        });
       
        var result = {};
        result.code = 200;
        result.data = resultUpdated;
        result.message = "Post Deleted successfully";
        return res.status(200).send(result);

    }else{
        return res.status(200).send({code:300,message:"Invalid details"});
    }
 };

 
 
exports.fetch_post = async function (req, res) {
    var user_id = req.headers.user_id;
    var feed_id = req.query.feed_id;

    var data = Promise.await(Feed.rawCollection().aggregate([{
            $match: {
                $and: [{
                        'is_active': true
                    },
                    {
                        feed_id: feed_id
                    }
                ]

            }
        },
        {
            $lookup: {
                from: 'user',
                localField: 'created_by',
                foreignField: 'user_id',
                as: 'user_data',
            }
        },
        {
            $sort: {
                created_at: -1
            }
        },
    ]).toArray());
    for (var i = 0; i < data.length; i++) {
        var query = {
            post_id: data[i].feed_id,
            user_id: user_id,
            is_active: true
        }
        var likeCount = Likes.find(query).count();
        data[i].user_liked = likeCount > 0;
        if (data[i].user_data[0]) {
            data[i].user_data[0].feed_post_id = data[i].feed_id;
        }

        var query = {
            post_id: data[i].feed_id,
            created_by: user_id,
            is_active: true
        }
        var userCommented = UserComments.find(query).count();
        data[i].user_commented = userCommented > 0;
    }
    var result = {};
    result.code = 200;
    result.data = data;
    result.message = "Feed Post returned successfully";
    return res.status(200).send(result);
 };

 