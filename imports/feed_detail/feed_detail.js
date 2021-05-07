import { PopupUtils } from "../../../utils/PopupUtils";
import { ErrorMessages } from "../../../utils/ErrorMessages";
import { Utils } from "../../../utils/utils";
import { FeedOperations } from "../../../utils/FeedOperations";
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { FeedNetwork } from "../../../network/itg/feed-network/feed-network.js";

import {
  FeedPosts,
  FeedLikes,
  RecentPosts,
  Likes,
  LoggedInUser,
  Followers,
  UserComments,
  User,
} from "../../../collections/collection";
import './feed_detail.html';
const axios = require("axios").default;
Template.feed_detail.helpers({
  like_api_called:function(){
    return Session.get("likeApiCalled");
  }
})
Template.feed_detail.onRendered(function () {
  console.log("Loading Scripts");
  Session.set("likeApiCalled", false);
  // Utils.loadScript();
  Utils.fetchLoggedInUserDetails();
  fetchFeedPostBasedOnFeedId(FlowRouter.current().params.post_id);
});

Template.feed_detail.onDestroyed(function () {
  return FeedPosts.remove({});
});

Template.registerHelper("fetch_feed_post_based_on_post_id", function () {
  var feed_id = FlowRouter.current().params.post_id;
  var feedPosts = FeedPosts.find(
    { feed_id: Utils.decodedEncodedString(feed_id) },
    { sort: { created_at: -1 }, limit: 1 }
  ).fetch();
  return feedPosts;
});

Template.feed_detail.events({
  "click #report_abused_modal": function (event) {
    event.preventDefault();
    $("#report_abuse-modal").addClass("is-active");
    Session.set("reportedFeedPostId", this.feed_post_id);
    Session.set("reportedPostType", "feed");
  },
  "click #cancel_editing": function (event) {
    event.preventDefault();
    $("#visible_post_content_" + this.feed_id).removeClass("display_hidden");
    $(Session.get("lastOpenCommentId")).addClass("display_hidden");
  },
  "click #three_dots": function (event) {
    event.preventDefault();
    // event.stopPropagation();
    if ($("#feed_dropdown_" + this.feed_post_id).hasClass("is-active")) {
      $("#feed_dropdown_" + this.feed_post_id).removeClass("is-active");
    } else {
      $("#feed_dropdown_" + this.feed_post_id).addClass("is-active");
    }
  },

  "click .redirect_to_profile": function (event) {
    event.preventDefault();
    Utils.openUserProfile(this.user_type, this.user_id, true, this.name);
  },
  "click #like_count": async function (event) {
    event.preventDefault();
    event.stopPropagation();
    var obj = {};
    obj.user_id = Utils.getLoggedInUserId();
    obj.post_id = this.feed_id;
    FeedLikes._collection.remove({});
    var response = await new FeedNetwork().fetchAllLikes(obj);

    if (Utils.isObject(response.data)) {
      if (response.data.code == 200) {
          for (var i = 0; i < response.data.all_likes.length; i++) {
            FeedLikes.insert(response.data.all_likes[i].user_details[0]);
          }
          $("#all_likes_modal").addClass("is-active");
        } else {
          PopupUtils.showErrorPopupWithMessage("Something went wrong");
        }
    }else if (response.data.code == 403) {
      PopupUtils.showErrorMessageFromJWT();
      localStorage.setItem("_id", "");
      FlowRouter.go("/signin");
    }else {
      PopupUtils.showErrorPopupWithMessage(
        ErrorMessages.getNetworkTimeoutMessage()
      );
    } 
  },
  "click #like_event": async function (event) {
    event.preventDefault();
    if (Session.get("likeApiCalled") == false) {
      var obj = {};
      obj.user_id = localStorage.getItem("_id");
      obj.feed_id = this.feed_id;
      obj.liked = !this.user_liked;
      Session.set("likeApiCalled", true);
      // Utils.likeEventOnFeed(obj);
      var response = await new FeedNetwork().postLike(obj);
      if (Utils.isObject(response.data)) {
        if (response.data.code == 200) {
          Session.set("likeApiCalled", false);
          FeedPosts._collection.update({feed_id:obj.feed_id},{$set:{user_liked :obj.liked,updated_at:Date.now()}});
          RecentPosts._collection.update({feed_id:obj.feed_id},{$set:{user_liked :obj.liked,updated_at:Date.now()}});
        }else if (response.data.code == 403) {
          PopupUtils.showErrorMessageFromJWT();
          localStorage.setItem("_id", "");
          FlowRouter.go("/signin");
        }
      }else {
        PopupUtils.showErrorPopupWithMessage(
          ErrorMessages.getNetworkTimeoutMessage()
        );
      }
    }
  },
  "click #delete_post": function (event) {
    event.preventDefault();
    $("#feed_dropdown_" + this.feed_post_id).removeClass("is-active");
    $("#delete-post-modal").addClass("is-active");
    Session.set("deletingPostId", this.feed_post_id);
  },
  "click .modal-background":function(event){
    event.preventDefault();
    $("#delete-post-modal").removeClass("is-active");
    $("#delete-comment-modal").removeClass("is-active");
    $("#all_likes_modal").removeClass("is-active");
},
  "click .close-modal": function (event) {
    event.preventDefault();
    $("#delete-post-modal").removeClass("is-active");
    $("#delete-comment-modal").removeClass("is-active");
    $("#all_likes_modal").removeClass("is-active");
  },
  "click #confirm_post_removal": async function (event) {
    event.preventDefault();
    $("#remove_post_loader").removeClass("display_hidden");
    var obj = {};
    obj.user_id = localStorage.getItem("_id");
    obj.feed_id = Session.get("deletingPostId");
    var response = await new FeedNetwork().deletePost(obj);
    if (Utils.isObject(response.data)) {
      if (response.data.code == 200) {
        PopupUtils.showSuccessPopup("Post deleted!");
        $("#remove_post_loader").addClass("display_hidden");
        $("#delete-post-modal").removeClass("is-active");
        FeedPosts._collection.remove({ feed_id: obj.feed_id });
        history.back();
      }else if (response.data.code == 403) {
        PopupUtils.showErrorMessageFromJWT();
        localStorage.setItem("_id", "");
        FlowRouter.go("/signin");
      }
    }else {
      PopupUtils.showErrorPopupWithMessage(
        ErrorMessages.getNetworkTimeoutMessage()
      );
    } 

  },

  "click #edit_post": function (event) {
    event.preventDefault();
    var hiddenPostId = "#hidden_text_field_" + this.feed_post_id;
    if (
      Session.get("lastOpenPostId") == undefined ||
      Session.get("lastOpenPostId") == ""
    ) {
      Session.set("lastOpenPostId", hiddenPostId);
    } else {
      $(Session.get("lastOpenCommentId")).addClass("display_hidden");
    }
    Session.set("lastOpenCommentId", hiddenPostId);
    $(Session.get("lastOpenCommentId")).removeClass("display_hidden");
    $("#updated_text_" + this.feed_post_id).focus();
    $("#visible_post_content_" + this.feed_post_id).addClass("display_hidden");
    $("#feed_dropdown_" + this.feed_post_id).removeClass("is-active");
  },
  "click #save_changes": function (event) {
    event.preventDefault();
    updatePost(this.feed_id);
  },

  "click #share_model": function (event) {
    event.preventDefault();
    Session.set("sharedPostId", Utils.encodeString(this.feed_id));
    $("#share-modal-social").addClass("is-active");
  },
  "click .close_share_button_model": function (event) {
    event.preventDefault();
    $("#share-modal-social").removeClass("is-active");
  },
});

async  function updatePost(postId) {
  var obj = {};
  obj.user_id = localStorage.getItem("_id");
  obj.feed_id = postId;
  obj.content = $("#updated_text_" + postId)
    .val()
    .replace(/\r?\n/g, "<br />")
    .trim();
  $("#update_post_loader" + postId).removeClass("display_hidden");
  var response = await new FeedNetwork().updateFeedPost(obj);
  if (Utils.isObject(response.data)) {
    if (response.data.code == 200) {
      $("#update_post_loader" + postId).addClass("display_hidden");
      PopupUtils.showSuccessPopup("Post Updated!");
        FeedPosts._collection.update(
          { feed_id: obj.feed_id },
          { $set: { content: obj.content, updated_at: Date.now() } }
        );
        $("#visible_post_content_" + obj.feed_id).removeClass("display_hidden");
        $(Session.get("lastOpenCommentId")).addClass("display_hidden");
    }else{
      PopupUtils.showSuccessPopup(response.data.message);
    }
  }else if (response.data.code == 403) {
    PopupUtils.showErrorMessageFromJWT();
    localStorage.setItem("_id", "");
    FlowRouter.go("/signin");
  }else {
    PopupUtils.showErrorPopupWithMessage(
      ErrorMessages.getNetworkTimeoutMessage()
    );
  } 
}

async function fetchFeedPostBasedOnFeedId(feed_id) {
  var obj = {};
  obj.feed_id = Utils.decodedEncodedString(feed_id);
  obj.user_id = Utils.getLoggedInUserId();
  var response = await new FeedNetwork().fetchFeedPost(obj);
  console.log(response.data);
  if (Utils.isObject(response.data)) {
    if (response.data.code == 200) {
      for (var i = 0; i < response.data.data.length; i++) {
                FeedPosts._collection.insert(response.data.data[i]);
      }
      
      // Utils.loadScript();
    }else{
      PopupUtils.showSuccessPopup(response.data.message);
    }
  }else if (response.data.code == 403) {
    PopupUtils.showErrorMessageFromJWT();
    localStorage.setItem("_id", "");
    FlowRouter.go("/signin");
  }else {
    PopupUtils.showErrorPopupWithMessage(
      ErrorMessages.getNetworkTimeoutMessage()
    );
  } 
  
}
