import { PopupUtils } from "../../../utils/PopupUtils";
import { Utils } from "../../../utils/utils";
import {
  FeedPosts,
  FeedLikes,
  RecentPosts,
  LoggedInUser,
} from "../../../collections/collection";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
const axios = require("axios").default;

import { eventNames } from "cluster";
import { FeedOperations } from "../../../utils/FeedOperations";
import { FeedNetwork } from "../../../network/itg/feed-network/feed-network.js";
import "./feed_listing.html";

var limit = 8;
var timer = 0;
var apiCalling;
Template.feed_listing.onDestroyed(function () {
  FeedPosts._collection.remove({});
});

Template.feed_listing.onRendered(function () {
  Session.set("likeApiCalled", false);
  limit = 8;
  FeedPosts._collection.remove({});
  fetchAllPostsFromNetwork(limit);
  setTimeout(function () {
    Utils.loadDropdowns();
  }, 1000);
});

Template.check_for_new_posts_available.events({
  "click #new_posts_available_div": function (event) {
    event.preventDefault();
    $("#post_fetcher_loader").removeClass("display_hidden");
    fetchAllPostsFromNetwork(0);
  },
});

function attachViewMoreObserver(startingTime) {
  Meteor.call(
    "check_for_feed_new_post_add",
    Utils.getLoggedInUserId(),
    startingTime,
    function (error, result) {
      if (error) {
        console.log("check_for_feed_new_post_add:" + "err");
      } else {
        if (result.code == 200) {
          // console.log(result.feed_ids);
          if (result.feed_ids.length != 0) {
            var checkFeedIdsCurrentUserDontHave = FeedPosts.find({
              feed_id: { $in: result.feed_ids },
            }).fetch();
            // console.log(checkFeedIdsCurrentUserDontHave);
            if (checkFeedIdsCurrentUserDontHave.length == 0) {
              $("#new_posts_available_div").removeClass("display_hidden");
            }
          }

          timer = setTimeout(function () {
            attachViewMoreObserver(startingTime);
          }, 10000);
        }
      }
    }
  );
}

Template.registerHelper("fetch_all_feed_posts", function () {
  var feedPosts = [];
  if (
    Template.instance() &&
    Template.instance().data != undefined &&
    Template.instance().data == "user"
  ) {
    if (FlowRouter.current().params.id != undefined) {
      var user_id = Utils.decodedEncodedString(FlowRouter.current().params.id);
      feedPosts = FeedPosts.find(
        { created_by: user_id },
        { sort: { created_at: -1 } }
      ).fetch();
    } else {
      feedPosts = FeedPosts.find(
        { created_by: Utils.getLoggedInUserId() },
        { sort: { created_at: -1 } }
      ).fetch();
    }
  } else {
    feedPosts = FeedPosts.find({}, { sort: { created_at: -1 } }).fetch();
  }
  return feedPosts;
});

Template.registerHelper("check_if_profile", function () {
  return (
    Template.instance() &&
    Template.instance().data != undefined &&
    Template.instance().data == "user"
  );
});
function scrollToBottom() {
  window.onscroll = function () {
    var scrollHeight, totalHeight;
    scrollHeight = document.body.scrollHeight;
    totalHeight = window.scrollY + window.innerHeight;
    if (totalHeight >= scrollHeight) {
      if (limit < Session.get("total_feed_posts")) {
        limit = limit + 8;
        console.log("Increasing Limit");
        Session.set("pagination_loading", true);
        if (apiCalling == false) {
          fetchAllPostsFromNetwork(limit);
        }
      }
    }
  };
}

Template.feed_listing.helpers({
  trim_characters_0_100:function(string,count){
    string = htmlToText.fromString(string);
    if(string && string.replace(/<br *\/?>/gi, '\n').length > count){
        return string.replace(/<br *\/?>/gi, '\n').substr(0,count).replace(/(\#\w+)/g, '<span class="blue">$1</span>');; 
    }  
  },
  highlight_hash_tags:function(content){
    return content.replace(/(\#\w+)/g, '<span class="blue">$1</span>');
  },
  like_api_called: function () {
    return Session.get("likeApiCalled");
  },
  pagination_loading: function () {
    return Session.get("pagination_loading");
  },
  isReady: function () {
    return Session.get("isReady");
  },
  end_reached: function () {
    return Session.get("end_reached");
  },
});
function openInNewTab(url) {
  var win = window.open(url, "_blank");
  win.focus();
}

Template.feed_listing.events({
  "click .blue":function(event){
    window.location.href = "/feed/tag/" + $(event.target).text().replace("#","");
  },
  "click #close": function (event) {
    event.preventDefault();
    $("#popup").css("display", "none");
  },
  "click #prev": function (event) {
    event.preventDefault();
    Session.set(
      "currentPopupIndex",
      parseInt(Session.get("currentPopupIndex")) - 1
    );
    var feedDetails = FeedPosts.find({
      feed_id: Session.get("popupModalFeedId"),
    }).fetch();
  
    if (feedDetails[0]) {
      var media_type =
        feedDetails[0].post_images[parseInt(Session.get("currentPopupIndex"))]
          .media_type;
      var sourceLink =
        feedDetails[0].post_images[parseInt(Session.get("currentPopupIndex"))]
          .source_link;
      var totalMedia = feedDetails[0].post_images.length;
      Session.set("totalMedia", totalMedia);
      if (media_type == "video") {
        Session.set("open_post_is_of_image", false);
        setTimeout(function () {
          $("#popv").attr("src", sourceLink);
        }, 2000);
      } else {
        Session.set("open_post_is_of_image", true);
        setTimeout(function () {
          $("#popimg").attr("src", sourceLink);
        }, 1000);
      }
      $("#popup").fadeIn(500);

      $("#popup").css("display", "block");
    } else {
      $("#popup").css("display", "none");
    }
  },
  "click #next": function (event) {
    event.preventDefault();
    Session.set(
      "currentPopupIndex",
      parseInt(Session.get("currentPopupIndex")) + 1
    );
    var feedDetails = FeedPosts.find({
      feed_id: Session.get("popupModalFeedId"),
    }).fetch();
    console.log(feedDetails[0]);
    if (feedDetails[0]) {
      var media_type =
        feedDetails[0].post_images[parseInt(Session.get("currentPopupIndex"))]
          .media_type;
      var sourceLink =
        feedDetails[0].post_images[parseInt(Session.get("currentPopupIndex"))]
          .source_link;
      var totalMedia = feedDetails[0].post_images.length;
      Session.set("totalMedia", totalMedia);
      if (media_type == "video") {
        setTimeout(function () {
          $("#popv").attr("src", sourceLink);
        }, 2000); // $("#popv").attr("src",sourceLink);
        Session.set("open_post_is_of_image", false);
      } else {
        setTimeout(function () {
          $("#popimg").attr("src", sourceLink);
        }, 1000);
        // $("#").attr("src",sourceLink);
        Session.set("open_post_is_of_image", true);
      }
      $("#popup").fadeIn(500);

      $("#popup").css("display", "block");
    } else {
      $("#popup").css("display", "none");
    }
  },
  "click .image_popup": function (event) {
    event.preventDefault();
    Session.set("popupModalFeedId", this.feed_id);
    var media_type = this.post_images[
      parseInt($(event.currentTarget).attr("index"))
    ].media_type;
    var sourceLink = this.post_images[
      parseInt($(event.currentTarget).attr("index"))
    ].source_link;
    var totalMedia = this.post_images.length;
    Session.set("currentPopupIndex", $(event.currentTarget).attr("index"));
    Session.set("totalMedia", totalMedia);

    if (media_type == "video") {
      Session.set("open_post_is_of_image", false);

      setTimeout(function () {
        $("#popv").attr("src", sourceLink);
      }, 1000);
    } else {
      Session.set("open_post_is_of_image", true);
      setTimeout(function () {
        $("#popimg").attr("src", sourceLink);
      }, 1000);
    }
    $("#popup").fadeIn(500);

    $("#popup").css("display", "block");

    return false;
  },
  "click #metadata_card": function (event) {
    event.preventDefault();
    openInNewTab(this.metadata_details.metadata_url);
  },
  "click .read-more": function (event) {
    event.preventDefault();
    $("#invisible_post_content_" + this.feed_id).removeClass("display_hidden");
    $("#visible_post_content_" + this.feed_id).addClass("display_hidden");
    $("#read_more_" + this.feed_id).addClass("display_hidden");
    $("#read_less_" + this.feed_id).removeClass("display_hidden");
  },
  "click .read-less": function (event) {
    event.preventDefault();
    $("#invisible_post_content_" + this.feed_id).addClass("display_hidden");
    $("#visible_post_content_" + this.feed_id).removeClass("display_hidden");
    $("#read_less_" + this.feed_id).addClass("display_hidden");
    $("#read_more_" + this.feed_id).removeClass("display_hidden");
  },

  "click #report_abused_modal": function (event) {
    event.preventDefault();
    $("#report_abuse-modal").addClass("is-active");
    Session.set("reportedFeedPostId", this.feed_post_id);
    Session.set("reportedPostType", "feed");
  },
  "click .feed_detail_redirection": function (event) {
    event.preventDefault();
    if (!this.special_post) {
      window.location.href = "/feed-detail/" + Utils.encodeString(this.feed_id);
    } else {
      if (this.special_post_type == "event") {
        window.location.href =
          "/event-details/" + Utils.encodeString(this.event_id);
      } else {
        window.location.href =
          "/blog-detail/" + Utils.encodeString(this.blog_id);
      }
    }
  },
  "click .event_detail_redirection": function (event) {
    window.location.href =
      "/event-details/" + Utils.encodeString(this.event_id);
  },
  
  "click .blog_post": function (event) {
    event.preventDefault();
    window.location.href = "/blog-detail/" + Utils.encodeString(this.blog_id);
  },
  "click #cancel_editing": function (event) {
    event.preventDefault();
    // console.log(JSON.stringify(this));
    $("#visible_post_content_" + this.feed_id).removeClass("display_hidden");
    $(Session.get("lastOpenCommentId")).addClass("display_hidden");
  },

  "click #three_dots": function (event) {
    event.preventDefault();
    if ($("#feed_dropdown_" + this.feed_post_id).hasClass("is-active")) {
      $("#feed_dropdown_" + this.feed_post_id).removeClass("is-active");
    } else {
      if (Session.get("activeDropdown") != undefined) {
        $(Session.get("activeDropdown")).removeClass("is-active");
      }
      Session.set("activeDropdown", "#feed_dropdown_" + this.feed_post_id);

      $("#feed_dropdown_" + this.feed_post_id).addClass("is-active");
    }
  },
  "click .redirect_to_profile": function (event) {
    event.preventDefault();
    Utils.openUserProfile(this.user_type, this.user_id, true, this.name);
  },
  "click #edit_post": function (event) {
    event.preventDefault();
    var feedDetails = FeedPosts._collection
      .find({ feed_id: this.feed_post_id })
      .fetch();
    if (feedDetails[0]) {
      if (!feedDetails[0].special_post) {
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
        $("#visible_post_content_" + this.feed_post_id).addClass(
          "display_hidden"
        );
        $("#feed_dropdown_" + this.feed_post_id).removeClass("is-active");
      } else {
        if (feedDetails[0].special_post_type == "blog") {
          window.location.href =
            "/edit-blog/" + Utils.encodeString(feedDetails[0].blog_id);
        } else if (feedDetails[0].special_post_type == "event") {
          window.location.href =
            "/edit-event/" + Utils.encodeString(feedDetails[0].event_id);
        } else if (feedDetails[0].special_post_type == "group") {
          let id = Base64.encode(feedDetails[0].group_id);
          window.location.href = "/edit-group/" + id;
        }
      }
    }
  },
  "click #save_changes": function (event) {
    event.preventDefault();
    updatePost(this.feed_id);
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
  "click #like_event": async  function (event) {
    event.preventDefault();
    if (Session.get("likeApiCalled") == false) {
      var obj = {};
      obj.user_id = Utils.getLoggedInUserId()
      if (!this.special_post) {
        obj.feed_id = this.feed_id;
        obj.liked = !this.user_liked;
        obj.is_special_post = false;
      } else {
        obj.is_special_post = true;
        obj.special_post_type = this.special_post_type;
        if (this.special_post_type == "blog") {
          obj.feed_id = this.blog_id;
          obj.liked = !this.user_liked;
        } else if (this.special_post_type == "event") {
          obj.feed_id = this.event_id;
          obj.liked = !this.user_liked;
        } else if (this.special_post_type == "group") {
          obj.feed_id = this.group_id;
          obj.liked = !this.user_liked;
        }
      }
      Session.set("likeApiCalled", true);
      var response = await new FeedNetwork().postLike(obj);
      if (Utils.isObject(response.data)) {
        if (response.data.code == 200) {
          Session.set("likeApiCalled", false);
          if(obj.is_special_post){
            if(obj.special_post_type  == 'blog'){
              FeedPosts._collection.update({blog_id:obj.feed_id},{$set:{user_liked :obj.liked,updated_at:Date.now()}});
            }else if(obj.special_post_type == 'event'){
              FeedPosts._collection.update({event_id:obj.feed_id},{$set:{user_liked :obj.liked,updated_at:Date.now()}});
            }else if(this.special_post_type == 'group'){
              FeedPosts._collection.update({group_id:obj.feed_id},{$set:{user_liked :obj.liked,updated_at:Date.now()}});
            }	
          }else{
            FeedPosts._collection.update({feed_id:obj.feed_id},{$set:{user_liked :obj.liked,updated_at:Date.now()}});
            RecentPosts._collection.update({feed_id:obj.feed_id},{$set:{user_liked :obj.liked,updated_at:Date.now()}});
          }
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
  "click .close-modal": function (event) {
    event.preventDefault();
    $("#delete-post-modal").removeClass("is-active");
    $("#all_likes_modal").removeClass("is-active");
  },
  "click .modal-background": function (event) {
    event.preventDefault();
    $("#delete-post-modal").removeClass("is-active");
    $("#all_likes_modal").removeClass("is-active");
  },
  "click #confirm_post_removal": async function (event) {
    event.preventDefault();
    $("#remove_post_loader").removeClass("display_hidden");
    var obj = {};
    obj.user_id = Utils.getLoggedInUserId()
    obj.feed_id = Session.get("deletingPostId");

    var response = await new FeedNetwork().deletePost(obj);
      if (Utils.isObject(response.data)) {
        if (response.data.code == 200) {
          PopupUtils.showSuccessPopup("Post deleted!");
          $("#remove_post_loader").addClass("display_hidden");
          $("#delete-post-modal").removeClass("is-active");

        FeedPosts._collection.remove({ feed_id: obj.feed_id });
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

async function fetchAllPostsFromNetwork(limit) {
  var obj = {};
  obj.user_id = Utils.getLoggedInUserId();
  obj.logged_in_user = Utils.getLoggedInUserId();
  obj.limit = limit;
  apiCalling = true;
  if(FlowRouter.current().params.tag!=undefined){
    obj.tag = FlowRouter.current().params.tag;  
  }
  var response = await new FeedNetwork().fetchNetworkPosts(obj);
 
  if (Utils.isObject(response.data)) {
    if (response.data.code == 200) {
      $("#publish_loader").addClass("display_hidden");
      apiCalling = false;
      Session.set("isReady", true);
      if (response.data.code == 200) {
        console.log(response.data.data);
        for (var i = 0; i < response.data.data.length; i++) {
          FeedPosts._collection.insert(response.data.data[i]);
        }
        if (
          response.data.total_posts == FeedPosts._collection.find({}).count()
        ) {
          Session.set("end_reached", true);
        }
        Session.set("total_feed_posts", response.data.total_posts);
        Session.set("pagination_loading", false);
        scrollToBottom();
        Blaze._globalHelpers.fetch_all_feed_posts();
        Utils.loadScript();
       // if (urlString == "/fetchAllPostsFromNetwork") {
        if (!$("#post_fetcher_loader").hasClass("display_hidden")) {
          $("#post_fetcher_loader").addClass("display_hidden");
        }
        if (!$("#new_posts_available_div").hasClass("display_hidden")) {
          $("#new_posts_available_div").addClass("display_hidden");
        }
          if (timer != 0) {
            clearInterval(timer);
          }
          attachViewMoreObserver(Date.now());
      // }
        setTimeout(function () {
          Utils.loadDropdowns();
        }, 1000);
        attachVideoScript();
      } 
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


async function updatePost(postId) {
  var obj = {};
  obj.user_id = Utils.getLoggedInUserId();
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


function attachVideoScript() {
    function playVisibleVideos() {
    document.querySelectorAll("video").forEach(video => elementIsVisible(video) ? video.play() : video.pause());
  }
  function elementIsVisible(el) {
    let rect = el.getBoundingClientRect();
    return (rect.bottom >= 0 && rect.right >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight) && rect.left <= (window.innerWidth || document.documentElement.clientWidth));
  }
  let playVisibleVideosTimeout;
  window.addEventListener("scroll", () => {
    clearTimeout(playVisibleVideosTimeout);
    playVisibleVideosTimeout = setTimeout(playVisibleVideos, 100);
  });
  window.addEventListener("resize", playVisibleVideos);
  window.addEventListener("DOMContentLoaded", playVisibleVideos)
}
