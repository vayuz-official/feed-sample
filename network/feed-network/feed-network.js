import { Utils } from "../../../utils/utils";

const axios = require("axios").default;

export class FeedNetwork {
  async loadMentionLibrary(obj) {
    var url = Meteor.absoluteUrl() + "bootstrap_typehead"
    try {
      var data = await axios.get(url);
      return data;
    } catch (error) {
      console.log(Object.keys(error), error.message);
      return { expcetion: true };
    }
  }
  async loadMentionLibrary2(obj) {
    var url = Meteor.absoluteUrl() + "mention"
    try {
      var data = await axios.get(url);
      return data;
    } catch (error) {
      console.log(Object.keys(error), error.message);
      return { expcetion: true };
    }
  }

  async createFeedPost(obj) {
    var url = Meteor.absoluteUrl() + "api/v1/createPost"
    try {
      var data = await axios.post(url,obj, {
        headers: {
          Authorization: "Bearer: " + Session.get("auth-jwt-token"),
          user_id: Utils.getLoggedInUserId(),
        },
      });
      return data;
    } catch (error) {
      console.log(Object.keys(error), error.message);
      return { expcetion: true };
    }
  }
  
  async fetchNetworkPosts(obj) {
    var url = Meteor.absoluteUrl() + "api/v1/networkPosts";
    url = Utils.addParameter(obj, url, "limit", obj.limit);
    url = Utils.addParameter(obj, url, "tag", obj.tag);
    try {
      var data = await axios.get(url, {
        headers: {
          Authorization: "Bearer: " + Session.get("auth-jwt-token"),
          user_id: Utils.getLoggedInUserId(),
        },
      });
      return data;
    } catch (error) {
      console.log(Object.keys(error), error.message);
      return { expcetion: true };
    }
  }
  
  async fetchAllLikes(obj) {
    var url = Meteor.absoluteUrl() + "api/v1/postLikes";
    url = Utils.addParameter(obj, url, "post_id", obj.post_id);

    try {
      var data = await axios.get(url, {
        headers: {
          Authorization: "Bearer: " + Session.get("auth-jwt-token"),
          user_id: Utils.getLoggedInUserId(),
        },
      });
      return data;
    } catch (error) {
      console.log(Object.keys(error), error.message);
      return { expcetion: true };
    }
  }
  async postLike(obj) {
    var url = Meteor.absoluteUrl() + "api/v1/postLike";
    try {
      var data = await axios.post(url, obj, {
        headers: {
          Authorization: "Bearer: " + Session.get("auth-jwt-token"),
          user_id: Utils.getLoggedInUserId(),
        },
      });
      return data;
    } catch (error) {
      console.log(Object.keys(error), error.message);
      return { expcetion: true };
    }
  }

  async deletePost(obj) {
    var url = Meteor.absoluteUrl() + "api/v1/deletePost";
    try {
      var data = await axios.put(url, obj, {
        headers: {
          Authorization: "Bearer: " + Session.get("auth-jwt-token"),
          user_id: Utils.getLoggedInUserId(),
        },
      });
      return data;
    } catch (error) {
      console.log(Object.keys(error), error.message);
      return { expcetion: true };
    }
  }

  
  
  
  async updateFeedPost(obj) {
    var url = Meteor.absoluteUrl() + "api/v1/updatePost"
    try {
      var data = await axios.put(url,obj, {
        headers: {
          Authorization: "Bearer: " + Session.get("auth-jwt-token"),
          user_id: Utils.getLoggedInUserId(),
        },
      });
      return data;
    } catch (error) {
      console.log(Object.keys(error), error.message);
      return { expcetion: true };
    }
  }

  async fetchFeedPost(obj) {
    var url = Meteor.absoluteUrl() + "api/v1/fetchPost"
    url = Utils.addParameter(obj, url, "feed_id", obj.feed_id);

    try {
      var data = await axios.get(url, {
        headers: {
          Authorization: "Bearer: " + Session.get("auth-jwt-token"),
          user_id: Utils.getLoggedInUserId(),
        },
      });
      return data;
    } catch (error) {
      console.log(Object.keys(error), error.message);
      return { expcetion: true };
    }
  }
  
}
